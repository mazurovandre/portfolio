import { Schema, model } from 'mongoose'

export interface ContactLinkDoc {
  label: string
  value: string
  href: string
  icon: string
  order: number
  visible: boolean
}

const contactLinkSchema = new Schema<ContactLinkDoc>(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
    href: { type: String, required: true },
    icon: { type: String, required: true },
    order: { type: Number, required: true, index: true },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'contactLinks' },
)

contactLinkSchema.index({ label: 1 }, { unique: true })

export const ContactLinkModel = model<ContactLinkDoc>('ContactLink', contactLinkSchema)
