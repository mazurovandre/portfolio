import { z } from 'zod'

/** A contact link (LinkedIn / Telegram / Email) — a round icon in the contacts section. */
export const contactLinkSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(60),
  /** Human-readable form — used in the JSON-LD payload and the link title. */
  value: z.string().min(1).max(200),
  href: z.string().min(1).max(300),
  icon: z
    .string()
    .regex(/^[a-z0-9-]+:[a-z0-9-]+$/, 'Expected an Iconify key, e.g. ph:telegram-logo'),
  order: z.number().int().min(0),
  visible: z.boolean().default(true),
})

export const contactLinkInputSchema = contactLinkSchema.omit({ id: true })
export const contactLinkUpdateSchema = contactLinkInputSchema.partial()

export type ContactLink = z.infer<typeof contactLinkSchema>
export type ContactLinkInput = z.infer<typeof contactLinkInputSchema>
export type ContactLinkUpdate = z.infer<typeof contactLinkUpdateSchema>
