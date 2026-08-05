import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  hasZodFastifySchemaValidationErrors,
} from 'fastify-type-provider-zod'
import type { FastifyError, FastifyInstance } from 'fastify'
import { loadConfig, type Config } from './config.js'
import mongoPlugin from './plugins/mongo.js'
import securityPlugin from './plugins/security.js'
import { healthRoutes } from './routes/health.js'
import { contentRoutes } from './routes/content.js'
import { messageRoutes } from './routes/messages.js'
import { adminRoutes } from './routes/admin.js'

declare module 'fastify' {
  interface FastifyInstance {
    config: Config
  }
}

export interface BuildAppOptions {
  /** Config overrides — tests pass the in-memory Mongo address here. */
  config?: Partial<Config>
}

/** Reduce to an env-like shape; numbers are coerced by the schema. */
function toEnvOverrides(config: Partial<Config> = {}): Record<string, unknown> {
  return Object.fromEntries(Object.entries(config).filter(([, value]) => value !== undefined))
}

/**
 * Building the app is kept out of the entry point so tests can spin up the
 * very same instance through `app.inject()`, without a real network socket.
 */
export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  // Overrides go through the same validation as the real environment.
  const config = loadConfig(toEnvOverrides(options.config))

  const app = Fastify({
    logger: {
      level: config.NODE_ENV === 'test' ? 'silent' : config.LOG_LEVEL,
      ...(config.NODE_ENV === 'development'
        ? { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } } }
        : {}),
    },
    // The app runs behind a reverse proxy (Nuxt/nginx), so the real client
    // address comes from X-Forwarded-For — otherwise the rate limiter would
    // count every visitor as the same client.
    trustProxy: true,
    bodyLimit: 64 * 1024,
  })

  app.decorate('config', config)

  // Zod as the single source of both validation and OpenAPI schemas.
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Request body failed validation',
        // instancePath arrives as '/email' — normalise it to the usual 'email'.
        details: error.validation.map((issue) => ({
          path: issue.instancePath.replace(/^\//, '').replace(/\//g, '.'),
          message: issue.message ?? 'Invalid value',
        })),
      })
    }

    const status = error.statusCode ?? 500

    if (status >= 500) {
      request.log.error({ err: error }, 'Unhandled error')
      return reply.code(status).send({ error: 'Internal Server Error', message: 'Internal server error' })
    }

    return reply.code(status).send({ error: error.name, message: error.message })
  })

  await app.register(sensible)
  await app.register(securityPlugin)
  await app.register(mongoPlugin, { uri: config.MONGO_URI })

  if (config.NODE_ENV === 'development') {
    await app.register(swagger, {
      openapi: {
        info: { title: 'Portfolio API', version: '1.0.0' },
        components: {
          securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } },
        },
      },
      transform: jsonSchemaTransform,
    })
    await app.register(swaggerUi, { routePrefix: '/docs' })
  }

  await app.register(healthRoutes)
  await app.register(contentRoutes)
  await app.register(messageRoutes)
  await app.register(adminRoutes, { prefix: '/api/admin' })

  return app
}
