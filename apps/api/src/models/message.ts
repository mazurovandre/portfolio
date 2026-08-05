import { Schema, model } from 'mongoose'
import type { MessageStatus } from '@portfolio/shared'

export interface MessageDoc {
  name: string
  email: string
  message: string
  status: MessageStatus
  /** sha256(salt + IP) — the raw address is never stored, but duplicates stay visible. */
  ipHash?: string
  userAgent?: string
  createdAt: Date
  updatedAt: Date
}

const messageSchema = new Schema<MessageDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'read', 'archived'], default: 'new', index: true },
    ipHash: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true, collection: 'messages' },
)

messageSchema.index({ createdAt: -1 })

export const MessageModel = model<MessageDoc>('Message', messageSchema)
