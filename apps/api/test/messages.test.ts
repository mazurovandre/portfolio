import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MessageModel } from '../src/models/message.js'
import { startTestApp, type TestContext } from './helpers.js'

const validBody = {
  name: 'John',
  email: 'John@Example.COM',
  message: 'Hello, I would like to discuss a project.',
}

describe('POST /api/messages', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await startTestApp()
  })

  afterAll(async () => {
    await ctx.stop()
  })

  it('stores a valid message and normalises the email', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/messages',
      payload: validBody,
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({ ok: true })

    const saved = await MessageModel.findOne({ name: 'John' }).lean()
    expect(saved?.email).toBe('john@example.com')
    expect(saved?.status).toBe('new')
    // The raw IP is never stored — only a salted hash
    expect(saved?.ipHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('rejects an empty body with a per-field breakdown', async () => {
    const response = await ctx.app.inject({ method: 'POST', url: '/api/messages', payload: {} })

    expect(response.statusCode).toBe(400)
    const body = response.json()
    expect(body.error).toBe('Bad Request')
    expect(body.details.map((d: { path: string }) => d.path).sort()).toEqual([
      'email',
      'message',
      'name',
    ])
  })

  it('rejects a malformed email and a too-short message', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/messages',
      payload: { name: 'John', email: 'not-an-email', message: 'hi' },
    })

    expect(response.statusCode).toBe(400)
    const paths = response.json().details.map((d: { path: string }) => d.path)
    expect(paths).toContain('email')
    expect(paths).toContain('message')
  })

  it('silently drops a bot that filled the honeypot', async () => {
    const before = await MessageModel.countDocuments()

    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/messages',
      payload: { ...validBody, name: 'Bot', website: 'http://spam.example' },
    })

    // The bot gets a success-shaped answer, but nothing reaches the database
    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({ ok: true })
    expect(await MessageModel.countDocuments()).toBe(before)
  })
})
