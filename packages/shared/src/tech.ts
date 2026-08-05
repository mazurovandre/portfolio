import { z } from 'zod'

/**
 * A technology from the hero-section cloud.
 * `icon` is an Iconify key (`devicon:react`, `ph:code`) rather than a CSS
 * class: icons are inlined as SVG on the server, with no external CDN.
 */
export const techSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(60),
  icon: z.string().regex(/^[a-z0-9-]+:[a-z0-9-]+$/, 'Expected an Iconify key, e.g. devicon:react'),
  order: z.number().int().min(0),
  visible: z.boolean().default(true),
})

export const techInputSchema = techSchema.omit({ id: true })
export const techUpdateSchema = techInputSchema.partial()

export type Tech = z.infer<typeof techSchema>
export type TechInput = z.infer<typeof techInputSchema>
export type TechUpdate = z.infer<typeof techUpdateSchema>
