// The end-to-end test boots a real Nuxt server, so it runs in the node
// environment rather than the browser-flavoured 'nuxt' one from the config.
// @vitest-environment node
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

/**
 * The core check behind the indexing requirement: a crawler must receive
 * finished HTML. Fastify is deliberately not running here — the page has to
 * fall back to its snapshot and still serve complete markup.
 */
describe('SSR output of the home page', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('..', import.meta.url)),
    server: true,
    browser: false,
  })

  it('serves content in the initial HTML, with no JavaScript involved', async () => {
    const html = await $fetch<string>('/')

    expect(html).toContain('Andrey Mazurov')
    expect(html).toContain('Fullstack JavaScript Developer')
    // The stack is present as text, not only as graphics
    expect(html).toContain('PostgreSQL')
    // The form is rendered on the server
    expect(html).toContain('name="message"')
  })

  it('contains exactly one h1 plus the section headings', async () => {
    const html = await $fetch<string>('/')

    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(html).toContain('>Contacts<')
    expect(html).toContain('>Technologies<')
  })

  it('contains valid JSON-LD with the Person schema', async () => {
    const html = await $fetch<string>('/')
    const match = /application\/ld\+json[^>]*>(.*?)<\/script>/s.exec(html)

    expect(match).not.toBeNull()

    const jsonLd = JSON.parse(match![1]!)
    expect(jsonLd['@type']).toBe('Person')
    expect(jsonLd.name).toBe('Andrey Mazurov')
    expect(jsonLd.knowsAbout).toContain('TypeScript')
    expect(jsonLd.sameAs.length).toBeGreaterThan(0)
  })

  it('contains a canonical link, lang and Open Graph tags', async () => {
    const html = await $fetch<string>('/')

    expect(html).toMatch(/<html[^>]*lang="en"/)
    expect(html).toMatch(/rel="canonical"/)
    expect(html).toMatch(/property="og:title"/)
    expect(html).toMatch(/property="og:image"/)
  })

  it('inlines icons as SVG, with no calls to external CDNs', async () => {
    const html = await $fetch<string>('/')

    expect(html.match(/<svg/g)?.length ?? 0).toBeGreaterThan(15)
    expect(html).not.toContain('unpkg.com')
    expect(html).not.toContain('cdn.jsdelivr.net')
    expect(html).not.toContain('fonts.googleapis.com')
  })

  it('serves sitemap.xml with the home page URL', async () => {
    const sitemap = await $fetch<string>('/sitemap.xml')

    expect(sitemap).toContain('<urlset')
    expect(sitemap).toContain('<loc>')
  })
})
