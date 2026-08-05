import { z } from 'zod'
import {
  contactLinkInputSchema,
  contactLinkSchema,
  contactLinkUpdateSchema,
  messageSchema,
  messageStatusSchema,
  messageStatusUpdateSchema,
  profileSchema,
  profileUpdateSchema,
  techInputSchema,
  techSchema,
  techUpdateSchema,
} from '@portfolio/shared'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { ProfileModel } from '../models/profile.js'
import { TechModel } from '../models/tech.js'
import { ContactLinkModel } from '../models/contact-link.js'
import { MessageModel } from '../models/message.js'
import { toContactLink, toMessage, toProfile, toTech } from '../lib/serialize.js'

const idParamsSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') })
const okSchema = z.object({ ok: z.literal(true) })

/**
 * Private CRUD for editing content without rebuilding the frontend.
 * It is not published externally (see docker-compose: the API port is not
 * mapped) and is additionally guarded by a bearer token at the plugin level.
 */
export const adminRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook('preHandler', fastify.requireAdmin)

  // ─── Messages ─────────────────────────────────────────────────────────────

  fastify.get(
    '/messages',
    {
      schema: {
        tags: ['admin'],
        summary: 'List messages from the contact form',
        querystring: z.object({
          status: messageStatusSchema.optional(),
          limit: z.coerce.number().int().min(1).max(200).default(50),
          skip: z.coerce.number().int().min(0).default(0),
        }),
        response: { 200: z.object({ items: z.array(messageSchema), total: z.number() }) },
      },
    },
    async (request) => {
      const { status, limit, skip } = request.query
      const filter = status ? { status } : {}

      const [items, total] = await Promise.all([
        MessageModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        MessageModel.countDocuments(filter),
      ])

      return { items: items.map(toMessage), total }
    },
  )

  fastify.patch(
    '/messages/:id',
    {
      schema: {
        tags: ['admin'],
        summary: 'Change a message status',
        params: idParamsSchema,
        body: messageStatusUpdateSchema,
        response: { 200: messageSchema },
      },
    },
    async (request, reply) => {
      const updated = await MessageModel.findByIdAndUpdate(
        request.params.id,
        { status: request.body.status },
        { returnDocument: 'after' },
      ).lean()

      if (!updated) return reply.notFound('Message not found')
      return toMessage(updated)
    },
  )

  fastify.delete(
    '/messages/:id',
    {
      schema: {
        tags: ['admin'],
        summary: 'Delete a message',
        params: idParamsSchema,
        response: { 200: okSchema },
      },
    },
    async (request, reply) => {
      const deleted = await MessageModel.findByIdAndDelete(request.params.id).lean()
      if (!deleted) return reply.notFound('Message not found')
      return { ok: true as const }
    },
  )

  // ─── Profile ──────────────────────────────────────────────────────────────

  fastify.put(
    '/profile',
    {
      schema: {
        tags: ['admin'],
        summary: 'Update the profile and SEO metadata',
        body: profileUpdateSchema,
        response: { 200: profileSchema },
      },
    },
    async (request) => {
      const updated = await ProfileModel.findOneAndUpdate(
        { key: 'default' },
        { $set: request.body },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
      ).lean()

      return toProfile(updated)
    },
  )

  // ─── Technologies ─────────────────────────────────────────────────────────

  fastify.get(
    '/techs',
    {
      schema: {
        tags: ['admin'],
        summary: 'All technologies, including hidden ones',
        response: { 200: z.array(techSchema) },
      },
    },
    async () => {
      const techs = await TechModel.find().sort({ order: 1 }).lean()
      return techs.map(toTech)
    },
  )

  fastify.post(
    '/techs',
    {
      schema: {
        tags: ['admin'],
        summary: 'Add a technology',
        body: techInputSchema,
        response: { 201: techSchema },
      },
    },
    async (request, reply) => {
      const created = await TechModel.create(request.body)
      return reply.code(201).send(toTech(created.toObject()))
    },
  )

  fastify.patch(
    '/techs/:id',
    {
      schema: {
        tags: ['admin'],
        summary: 'Update a technology',
        params: idParamsSchema,
        body: techUpdateSchema,
        response: { 200: techSchema },
      },
    },
    async (request, reply) => {
      const updated = await TechModel.findByIdAndUpdate(
        request.params.id,
        { $set: request.body },
        { returnDocument: 'after' },
      ).lean()

      if (!updated) return reply.notFound('Technology not found')
      return toTech(updated)
    },
  )

  fastify.delete(
    '/techs/:id',
    {
      schema: {
        tags: ['admin'],
        summary: 'Delete a technology',
        params: idParamsSchema,
        response: { 200: okSchema },
      },
    },
    async (request, reply) => {
      const deleted = await TechModel.findByIdAndDelete(request.params.id).lean()
      if (!deleted) return reply.notFound('Technology not found')
      return { ok: true as const }
    },
  )

  // ─── Contact links ────────────────────────────────────────────────────────

  fastify.get(
    '/contact-links',
    {
      schema: {
        tags: ['admin'],
        summary: 'All contact links, including hidden ones',
        response: { 200: z.array(contactLinkSchema) },
      },
    },
    async () => {
      const links = await ContactLinkModel.find().sort({ order: 1 }).lean()
      return links.map(toContactLink)
    },
  )

  fastify.post(
    '/contact-links',
    {
      schema: {
        tags: ['admin'],
        summary: 'Add a contact link',
        body: contactLinkInputSchema,
        response: { 201: contactLinkSchema },
      },
    },
    async (request, reply) => {
      const created = await ContactLinkModel.create(request.body)
      return reply.code(201).send(toContactLink(created.toObject()))
    },
  )

  fastify.patch(
    '/contact-links/:id',
    {
      schema: {
        tags: ['admin'],
        summary: 'Update a contact link',
        params: idParamsSchema,
        body: contactLinkUpdateSchema,
        response: { 200: contactLinkSchema },
      },
    },
    async (request, reply) => {
      const updated = await ContactLinkModel.findByIdAndUpdate(
        request.params.id,
        { $set: request.body },
        { returnDocument: 'after' },
      ).lean()

      if (!updated) return reply.notFound('Contact link not found')
      return toContactLink(updated)
    },
  )

  fastify.delete(
    '/contact-links/:id',
    {
      schema: {
        tags: ['admin'],
        summary: 'Delete a contact link',
        params: idParamsSchema,
        response: { 200: okSchema },
      },
    },
    async (request, reply) => {
      const deleted = await ContactLinkModel.findByIdAndDelete(request.params.id).lean()
      if (!deleted) return reply.notFound('Contact link not found')
      return { ok: true as const }
    },
  )
}
