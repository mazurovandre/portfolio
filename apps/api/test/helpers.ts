import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app.js'

export const TEST_ADMIN_TOKEN = 'test-admin-token-0123456789abcdef'

export interface TestContext {
  app: FastifyInstance
  stop: () => Promise<void>
}

/**
 * Boots the app on top of an in-memory MongoDB. Tests hit it through
 * `app.inject()` — the same code as in production, but without a network socket.
 */
export async function startTestApp(): Promise<TestContext> {
  const mongod = await MongoMemoryServer.create()

  const app = await buildApp({
    config: {
      NODE_ENV: 'test',
      MONGO_URI: mongod.getUri('portfolio-test'),
      ADMIN_TOKEN: TEST_ADMIN_TOKEN,
      IP_HASH_SALT: 'test-salt',
      // Raised on purpose: otherwise the spam guard would cut off the very
      // tests that exercise the form.
      RATE_LIMIT_MAX: 1000,
    },
  })

  await app.ready()

  return {
    app,
    stop: async () => {
      await app.close()
      await mongoose.disconnect()
      await mongod.stop()
    },
  }
}
