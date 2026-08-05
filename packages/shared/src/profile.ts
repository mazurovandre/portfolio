import { z } from 'zod'

/**
 * Page SEO metadata. Stored in the database alongside the profile so that
 * editing the title or description does not require a frontend rebuild.
 */
export const seoSchema = z.object({
  title: z.string().min(1).max(70),
  description: z.string().min(1).max(200),
  keywords: z.array(z.string().min(1)).max(30).default([]),
  ogImage: z.string().min(1).default('/og.png'),
})

/** The profile is a singleton: the collection always holds exactly one document with key = 'default'. */
export const profileSchema = z.object({
  key: z.literal('default').default('default'),
  name: z.string().min(1).max(120),
  headline: z.string().min(1).max(160),
  bio: z.string().max(2000).optional(),
  cvUrl: z.string().min(1).default('/cv.pdf'),
  copyrightYear: z.number().int().min(2000).max(2100),
  locale: z.string().min(2).max(10).default('en-US'),
  seo: seoSchema,
})

/** Body of PUT /api/admin/profile — every field is optional and `key` cannot change. */
export const profileUpdateSchema = profileSchema.omit({ key: true }).partial()

export type Seo = z.infer<typeof seoSchema>
export type Profile = z.infer<typeof profileSchema>
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
