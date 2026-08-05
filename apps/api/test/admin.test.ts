import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MessageModel } from '../src/models/message.js'
import { startTestApp, TEST_ADMIN_TOKEN, type TestContext } from './helpers.js'

const auth = { authorization: `Bearer ${TEST_ADMIN_TOKEN}` }

describe('private /api/admin routes', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await startTestApp()
    await ctx.app.inject({
      method: 'POST',
      url: '/api/messages',
      payload: { name: 'John', email: 'john@example.com', message: 'A message for the admin test.' },
    })
  })

  afterAll(async () => {
    await ctx.stop()
  })

  it('returns 401 without a token', async () => {
    const response = await ctx.app.inject({ method: 'GET', url: '/api/admin/messages' })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 for a wrong token', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/admin/messages',
      headers: { authorization: 'Bearer wrong-token-wrong-token' },
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 when the auth scheme is not Bearer', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/admin/messages',
      headers: { authorization: TEST_ADMIN_TOKEN },
    })
    expect(response.statusCode).toBe(401)
  })

  it('lists messages with a valid token', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/admin/messages',
      headers: auth,
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.total).toBe(1)
    expect(body.items[0].name).toBe('John')
    // Internal fields never leak out
    expect(body.items[0]).not.toHaveProperty('ipHash')
    expect(body.items[0]).not.toHaveProperty('_id')
  })

  it('changes a message status', async () => {
    const created = await MessageModel.findOne().lean()

    const response = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/admin/messages/${created?._id.toString()}`,
      headers: auth,
      payload: { status: 'read' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().status).toBe('read')
  })

  it('rejects a malformed id', async () => {
    const response = await ctx.app.inject({
      method: 'PATCH',
      url: '/api/admin/messages/not-an-id',
      headers: auth,
      payload: { status: 'read' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('updates the profile SEO metadata', async () => {
    const response = await ctx.app.inject({
      method: 'PUT',
      url: '/api/admin/profile',
      headers: auth,
      payload: {
        name: 'Andrey Mazurov',
        headline: 'Fullstack JavaScript Developer',
        copyrightYear: 2026,
        seo: {
          title: 'A new title',
          description: 'A new page description for search results.',
          keywords: ['node.js'],
          ogImage: '/og.png',
        },
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().seo.title).toBe('A new title')

    // The change is immediately visible to the public route — no frontend rebuild
    const content = await ctx.app.inject({ method: 'GET', url: '/api/content' })
    expect(content.json().profile.seo.title).toBe('A new title')
  })
})
