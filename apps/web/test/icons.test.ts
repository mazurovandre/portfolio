// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Content } from '@portfolio/shared'

import phIcons from '@iconify-json/ph/icons.json'
import deviconIcons from '@iconify-json/devicon/icons.json'
import deviconPlainIcons from '@iconify-json/devicon-plain/icons.json'

interface IconifyCollection {
  icons: Record<string, unknown>
  aliases?: Record<string, unknown>
}

const collections: Record<string, IconifyCollection> = {
  ph: phIcons as IconifyCollection,
  devicon: deviconIcons as IconifyCollection,
  'devicon-plain': deviconPlainIcons as IconifyCollection,
}

function iconExists(key: string): boolean {
  const [prefix, name] = key.split(':')
  const collection = prefix ? collections[prefix] : undefined
  if (!collection || !name) return false
  return name in collection.icons || name in (collection.aliases ?? {})
}

async function readJson<T>(relativePath: string): Promise<T> {
  const path = fileURLToPath(new URL(relativePath, import.meta.url))
  return JSON.parse(await readFile(path, 'utf8')) as T
}

/**
 * A non-existent Iconify key breaks neither the build nor the render — the
 * icon simply comes out as an empty SVG. That is only visible by eye, so the
 * keys are checked automatically instead.
 */
describe('icon keys', () => {
  it('every icon in the seed data exists in the installed collections', async () => {
    const seed = await readJson<Content>('../../api/src/seed/data/portfolio.json')

    const missing = [
      ...seed.techs.filter((tech) => !iconExists(tech.icon)).map((tech) => tech.icon),
      ...seed.contactLinks.filter((link) => !iconExists(link.icon)).map((link) => link.icon),
    ]

    expect(missing).toEqual([])
  })

  it('the fallback snapshot has not drifted from the seed data', async () => {
    const seed = await readJson<Content>('../../api/src/seed/data/portfolio.json')
    const fallback = await readJson<Content>('../app/data/fallback.json')

    expect(fallback.techs.map((t) => t.icon)).toEqual(seed.techs.map((t) => t.icon))
    expect(fallback.contactLinks.map((c) => c.icon)).toEqual(seed.contactLinks.map((c) => c.icon))
    expect(fallback.profile.name).toBe(seed.profile.name)
  })

  it('every icon in the seed data is embedded in the client bundle', async () => {
    const seed = await readJson<Content>('../../api/src/seed/data/portfolio.json')
    const config = await readFile(
      fileURLToPath(new URL('../nuxt.config.ts', import.meta.url)),
      'utf8',
    )

    // Otherwise the icon renders empty: there is nowhere to fetch it from,
    // since fallbackToApi is disabled on purpose.
    const used = [...seed.techs.map((t) => t.icon), ...seed.contactLinks.map((c) => c.icon)]
    const notBundled = used.filter((icon) => !config.includes(`'${icon}'`))

    expect(notBundled).toEqual([])
  })
})
