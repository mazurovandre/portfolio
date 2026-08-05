import { z } from 'zod'
import { messageInputSchema } from '@portfolio/shared'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { MessageModel } from '../models/message.js'

/**
 * Contact form intake. Three layers of protection against junk: a honeypot
 * field, a per-IP rate limit, and the same Zod schema that validates the
 * form in the browser.
 */
export const messageRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    '/api/messages',
    {
      config: {
        rateLimit: {
          max: fastify.config.RATE_LIMIT_MAX,
          timeWindow: fastify.config.RATE_LIMIT_WINDOW,
        },
      },
      schema: {
        tags: ['messages'],
        summary: 'Send a message through the contact form',
        body: messageInputSchema,
        response: {
          201: z.object({ ok: z.literal(true) }),
        },
      },
    },
    async (request, reply) => {
      const { name, email, message, website } = request.body

      // The honeypot is filled in, so this is a bot. Answer as if the send
      // succeeded, so it cannot probe its way around the check, but store
      // nothing.
      if (website) {
        request.log.info('Dropped by honeypot')
        return reply.code(201).send({ ok: true as const })
      }

      await MessageModel.create({
        name,
        email,
        message,
        status: 'new',
        ipHash: fastify.hashIp(request.ip),
        userAgent: request.headers['user-agent']?.slice(0, 300),
      })

      request.log.info('Stored a new message from the contact form')
      return reply.code(201).send({ ok: true as const })
    },
  )
}
