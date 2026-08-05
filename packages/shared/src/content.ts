import { z } from 'zod'
import { profileSchema } from './profile.js'
import { techSchema } from './tech.js'
import { contactLinkSchema } from './contact-link.js'

/**
 * Response of GET /api/content — everything the page needs in a single
 * request, so server-side rendering makes exactly one call to the API.
 */
export const contentSchema = z.object({
  profile: profileSchema,
  techs: z.array(techSchema),
  contactLinks: z.array(contactLinkSchema),
})

export type Content = z.infer<typeof contentSchema>
