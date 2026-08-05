import { contentSchema } from '@portfolio/shared'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { ProfileModel } from '../models/profile.js'
import { TechModel } from '../models/tech.js'
import { ContactLinkModel } from '../models/contact-link.js'
import { toContactLink, toProfile, toTech } from '../lib/serialize.js'

/**
 * The only public GET the page needs. Three collections are fetched in
 * parallel and returned as a single object, so server-side rendering makes
 * exactly one call to the API per render.
 */
export const contentRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    '/api/content',
    {
      schema: {
        tags: ['content'],
        summary: 'All public page content in a single response',
        response: { 200: contentSchema },
      },
    },
    async (_request, reply) => {
      const [profile, techs, contactLinks] = await Promise.all([
        ProfileModel.findOne({ key: 'default' }).lean(),
        TechModel.find({ visible: true }).sort({ order: 1 }).lean(),
        ContactLinkModel.find({ visible: true }).sort({ order: 1 }).lean(),
      ])

      if (!profile) {
        return reply.notFound('Profile not found — run `pnpm seed`')
      }

      return {
        profile: toProfile(profile),
        techs: techs.map(toTech),
        contactLinks: contactLinks.map(toContactLink),
      }
    },
  )
}
