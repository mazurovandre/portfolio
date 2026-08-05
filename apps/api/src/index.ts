import { buildApp } from './app.js'

async function main(): Promise<void> {
  const app = await buildApp()

  // Graceful shutdown: docker/k8s send SIGTERM, and the Mongo connection has
  // to close before the process exits (see the onClose hook in the mongo plugin).
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      app.log.info({ signal }, 'Shutting down the server')
      void app.close().then(() => process.exit(0))
    })
  }

  await app.listen({ host: app.config.API_HOST, port: app.config.API_PORT })
}

main().catch((error: unknown) => {
  console.error('Failed to start the API:', error)
  process.exit(1)
})
