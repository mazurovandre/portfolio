import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

/**
 * Local development reads `.env` from the monorepo root. Inside a container
 * that file does not exist — variables come from docker compose — and the
 * step is skipped.
 */
function loadDotEnv(): void {
  const envPath = fileURLToPath(new URL('../../../.env', import.meta.url))
  if (existsSync(envPath)) process.loadEnvFile(envPath)
}

/**
 * Configuration is read from the environment once at startup and validated.
 * Anything missing crashes the process immediately with a clear message
 * instead of half an hour later on the first request.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  ADMIN_TOKEN: z.string().min(16, 'ADMIN_TOKEN must be at least 16 characters long'),
  IP_HASH_SALT: z.string().min(8, 'IP_HASH_SALT must be at least 8 characters long'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_WINDOW: z.string().default('10 minutes'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
})

export type Config = z.infer<typeof envSchema>

/**
 * @param overrides values layered on top of the environment — tests pass the
 * in-memory Mongo address here. Merging happens inside this function, after
 * `.env` has been read: a snapshot of `process.env` taken by the caller would
 * predate the file being loaded.
 */
export function loadConfig(overrides: Record<string, unknown> = {}): Config {
  loadDotEnv()

  const parsed = envSchema.safeParse({ ...process.env, ...overrides })

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration:\n${issues}`)
  }

  return parsed.data
}
