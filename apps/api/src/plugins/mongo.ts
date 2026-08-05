import fp from 'fastify-plugin'
import mongoose from 'mongoose'
import type { FastifyPluginAsync } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    mongo: typeof mongoose
  }
}

interface MongoPluginOptions {
  uri: string
}

/**
 * MongoDB connection via mongoose. The connection closes on `onClose`, so
 * neither tests nor graceful shutdown leave sockets hanging around.
 */
const mongoPlugin: FastifyPluginAsync<MongoPluginOptions> = async (fastify, opts) => {
  mongoose.set('strictQuery', true)

  await mongoose.connect(opts.uri, {
    serverSelectionTimeoutMS: 5_000,
    autoIndex: fastify.config.NODE_ENV !== 'production',
  })

  fastify.log.info('MongoDB connected')
  fastify.decorate('mongo', mongoose)

  fastify.addHook('onClose', async () => {
    await mongoose.disconnect()
  })
}

export default fp(mongoPlugin, { name: 'mongo' })
