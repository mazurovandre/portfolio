import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { contactLinkInputSchema, profileSchema, techInputSchema } from '@portfolio/shared'
import { z } from 'zod'
import { loadConfig } from '../config.js'
import { ProfileModel } from '../models/profile.js'
import { TechModel } from '../models/tech.js'
import { ContactLinkModel } from '../models/contact-link.js'

const seedFileSchema = z.object({
  profile: profileSchema,
  techs: z.array(techInputSchema),
  contactLinks: z.array(contactLinkInputSchema),
})

/**
 * Fills the database with the content from `data/portfolio.json`.
 *
 * The script is idempotent: everything goes through upserts on natural keys
 * (profile.key, tech.name, contactLink.label), and the `messages` collection
 * is never touched — re-running it against production is safe.
 */
export async function seed(uri: string): Promise<void> {
  const dataPath = fileURLToPath(new URL('./data/portfolio.json', import.meta.url))
  const raw: unknown = JSON.parse(await readFile(dataPath, 'utf8'))
  const data = seedFileSchema.parse(raw)

  await mongoose.connect(uri)

  await ProfileModel.updateOne({ key: 'default' }, { $set: data.profile }, { upsert: true })

  for (const tech of data.techs) {
    await TechModel.updateOne({ name: tech.name }, { $set: tech }, { upsert: true })
  }

  for (const link of data.contactLinks) {
    await ContactLinkModel.updateOne({ label: link.label }, { $set: link }, { upsert: true })
  }

  console.log(
    `Done: profile, ${data.techs.length} technologies, ${data.contactLinks.length} contact links.`,
  )
}

// Run as a CLI (`pnpm seed`), but not when imported from tests.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const config = loadConfig()

  seed(config.MONGO_URI)
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      console.error('Seed failed:', error)
      process.exit(1)
    })
}
