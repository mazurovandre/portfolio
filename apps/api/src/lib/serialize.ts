import type { Types } from 'mongoose'
import type { ContactLink, Profile, Tech, Message } from '@portfolio/shared'
import type { ProfileDoc } from '../models/profile.js'
import type { TechDoc } from '../models/tech.js'
import type { ContactLinkDoc } from '../models/contact-link.js'
import type { MessageDoc } from '../models/message.js'

/**
 * Mongoose documents are never returned as-is: `_id`, `__v` and timestamps
 * are storage details. Here they are unwrapped into the shape described by
 * the schemas in `@portfolio/shared`, which also validate the responses.
 */

/** Result of `.lean()` — a plain object carrying an ObjectId instead of a document. */
type Lean<T> = T & { _id: Types.ObjectId }

export function toTech(doc: Lean<TechDoc>): Tech {
  return {
    id: doc._id.toString(),
    name: doc.name,
    icon: doc.icon,
    order: doc.order,
    visible: doc.visible,
  }
}

export function toContactLink(doc: Lean<ContactLinkDoc>): ContactLink {
  return {
    id: doc._id.toString(),
    label: doc.label,
    value: doc.value,
    href: doc.href,
    icon: doc.icon,
    order: doc.order,
    visible: doc.visible,
  }
}

export function toProfile(doc: Lean<ProfileDoc>): Profile {
  return {
    key: 'default',
    name: doc.name,
    headline: doc.headline,
    ...(doc.bio ? { bio: doc.bio } : {}),
    cvUrl: doc.cvUrl,
    copyrightYear: doc.copyrightYear,
    locale: doc.locale,
    seo: {
      title: doc.seo.title,
      description: doc.seo.description,
      keywords: doc.seo.keywords ?? [],
      ogImage: doc.seo.ogImage,
    },
  }
}

export function toMessage(doc: Lean<MessageDoc>): Message {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    message: doc.message,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
  }
}
