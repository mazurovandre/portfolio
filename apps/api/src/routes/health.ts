import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'

/**
 * `/health` is liveness (the process is up), `/health/ready` is readiness
 * (Mongo answers). The latter is used as the healthcheck in docker compose.
 */
export const healthRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // The API root serves no routes — the site itself lives on another port.
  // Rather than a bare 404, return a hint: this address is easy to open in a
  // browser by mistake and conclude that the service failed to start.
  fastify.get(
    '/',
    {
      schema: {
        tags: ['health'],
        summary: 'List of available routes',
        response: {
          200: z.object({
            service: z.string(),
            note: z.string(),
            routes: z.array(z.string()),
          }),
        },
      },
    },
    async () => ({
      service: 'portfolio-api',
      note: 'This is the internal API. The site itself runs on port 3000.',
      routes: [
        'GET  /health',
        'GET  /health/ready',
        'GET  /api/content',
        'POST /api/messages',
        'GET|PATCH|DELETE /api/admin/messages[/:id]  (Bearer ADMIN_TOKEN)',
        'PUT  /api/admin/profile                     (Bearer ADMIN_TOKEN)',
        'CRUD /api/admin/techs, /api/admin/contact-links (Bearer ADMIN_TOKEN)',
        ...(fastify.config.NODE_ENV === 'development' ? ['GET  /docs — OpenAPI UI'] : []),
      ],
    }),
  )

  fastify.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        response: { 200: z.object({ status: z.literal('ok'), uptime: z.number() }) },
      },
    },
    async () => ({ status: 'ok' as const, uptime: process.uptime() }),
  )

  fastify.get(
    '/health/ready',
    {
      schema: {
        tags: ['health'],
        response: {
          200: z.object({ status: z.literal('ok'), mongo: z.literal('up') }),
          503: z.object({ status: z.literal('error'), mongo: z.literal('down') }),
        },
      },
    },
    async (_request, reply) => {
      const admin = fastify.mongo.connection.db?.admin()

      try {
        if (!admin) throw new Error('No MongoDB connection')
        await admin.ping()
        return { status: 'ok' as const, mongo: 'up' as const }
      } catch (error) {
        fastify.log.error({ err: error }, 'Readiness check failed')
        return reply.code(503).send({ status: 'error' as const, mongo: 'down' as const })
      }
    },
  )
}
