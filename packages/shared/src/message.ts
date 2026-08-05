import { z } from 'zod'

export const messageStatusSchema = z.enum(['new', 'read', 'archived'])

/**
 * Contact form payload. The same schema validates in the browser (before
 * submitting) and in Fastify (on arrival), so the two can never disagree.
 *
 * `website` is a honeypot: a real visitor neither sees nor fills this field.
 * It passes validation on purpose — a bot that fills it is rejected by the
 * route handler, which answers as if the send succeeded so the bot cannot
 * probe its way around the check.
 */
export const messageInputSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  email: z.string().trim().toLowerCase().email('Invalid email address').max(200),
  message: z.string().trim().min(10, 'Message is too short').max(5000),
  website: z.string().max(200).optional(),
})

export const messageSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  message: z.string(),
  status: messageStatusSchema,
  createdAt: z.string(),
})

export const messageStatusUpdateSchema = z.object({ status: messageStatusSchema })

export type MessageStatus = z.infer<typeof messageStatusSchema>
export type MessageInput = z.infer<typeof messageInputSchema>
export type Message = z.infer<typeof messageSchema>
