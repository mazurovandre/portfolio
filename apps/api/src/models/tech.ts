import { Schema, model } from 'mongoose'

export interface TechDoc {
  name: string
  icon: string
  order: number
  visible: boolean
}

const techSchema = new Schema<TechDoc>(
  {
    name: { type: String, required: true },
    icon: { type: String, required: true },
    order: { type: Number, required: true, index: true },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'techs' },
)

// The technology name is the natural key: the seed script upserts on it,
// which is what makes re-running the script idempotent.
techSchema.index({ name: 1 }, { unique: true })

export const TechModel = model<TechDoc>('Tech', techSchema)
