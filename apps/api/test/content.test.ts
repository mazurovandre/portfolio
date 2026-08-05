import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { contentSchema } from '@portfolio/shared'
import { seed } from '../src/seed/seed.js'
import { startTestApp, type TestContext } from './helpers.js'

describe('GET /api/content', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await startTestApp()
  })

  afterAll(async () => {
    await ctx.stop()
  })

  it('returns 404 with a hint while the database is empty', async () => {
    const response = await ctx.app.inject({ method: 'GET', url: '/api/content' })

    expect(response.statusCode).toBe(404)
    expect(response.json().message).toContain('pnpm seed')
  })

  it('returns the profile, 18 technologies and 3 contact links after seeding', async () => {
    // The seed reuses the mongoose connection the app already opened
    await seed(ctx.app.config.MONGO_URI)

    const response = await ctx.app.inject({ method: 'GET', url: '/api/content' })
    expect(response.statusCode).toBe(200)

    // The response must match the same schema the frontend types itself against
    const content = contentSchema.parse(response.json())

    expect(content.profile.name).toBe('Andrey Mazurov')
    expect(content.profile.seo.title).toContain('Fullstack')
    expect(content.techs).toHaveLength(18)
    expect(content.contactLinks).toHaveLength(3)
  })

  it('returns technologies in the configured order', async () => {
    const content = contentSchema.parse(
      (await ctx.app.inject({ method: 'GET', url: '/api/content' })).json(),
    )

    const orders = content.techs.map((tech) => tech.order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
    expect(content.techs[0]?.name).toBe('React')
  })

  it('seeds idempotently: a second run creates no duplicates', async () => {
    await seed(ctx.app.config.MONGO_URI)

    const content = contentSchema.parse(
      (await ctx.app.inject({ method: 'GET', url: '/api/content' })).json(),
    )

    expect(content.techs).toHaveLength(18)
    expect(content.contactLinks).toHaveLength(3)
  })
})
