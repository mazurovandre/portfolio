import { Schema, model } from 'mongoose'
import type { Profile } from '@portfolio/shared'

export type ProfileDoc = Profile

const seoSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    keywords: { type: [String], default: [] },
    ogImage: { type: String, default: '/og.png' },
  },
  { _id: false },
)

const profileSchema = new Schema<ProfileDoc>(
  {
    // Singleton: the unique key guarantees exactly one document.
    key: { type: String, required: true, unique: true, default: 'default' },
    name: { type: String, required: true },
    headline: { type: String, required: true },
    bio: { type: String },
    cvUrl: { type: String, default: '/cv.pdf' },
    copyrightYear: { type: Number, required: true },
    locale: { type: String, default: 'en-US' },
    seo: { type: seoSchema, required: true },
  },
  { timestamps: true, collection: 'profiles' },
)

export const ProfileModel = model<ProfileDoc>('Profile', profileSchema)
