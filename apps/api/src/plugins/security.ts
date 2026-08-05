import { timingSafeEqual, createHash } from 'node:crypto'
import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    /** preHandler for private routes: bearer token matched against ADMIN_TOKEN. */
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    /** Salted hash of an IP — raw addresses of form senders are never stored. */
    hashIp: (ip: string) => string
  }
}

/**
 * Constant-time secret comparison. `timingSafeEqual` requires buffers of
 * equal length, so both sides go through sha256 first.
 */
function safeCompare(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

const securityPlugin: FastifyPluginAsync = async (fastify) => {
  // The API serves no HTML and sits behind Nuxt, so no CSP is needed here —
  // the public layer sets it. The remaining headers are still worth having.
  await fastify.register(helmet, { contentSecurityPolicy: false })

  await fastify.register(rateLimit, {
    global: false,
    max: fastify.config.RATE_LIMIT_MAX,
    timeWindow: fastify.config.RATE_LIMIT_WINDOW,
  })

  fastify.decorate('hashIp', (ip: string): string =>
    createHash('sha256').update(`${fastify.config.IP_HASH_SALT}:${ip}`).digest('hex'),
  )

  fastify.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''

    if (!token || !safeCompare(token, fastify.config.ADMIN_TOKEN)) {
      // Log that an attempt happened, but never the token that was sent.
      request.log.warn({ url: request.url }, 'Rejected request to an admin route')
      return reply.code(401).send({ error: 'Unauthorized', message: 'Admin token required' })
    }
  })
}

export default fp(securityPlugin, { name: 'security' })
