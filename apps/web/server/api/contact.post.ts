import { messageInputSchema } from '@portfolio/shared'

/**
 * Proxies the contact form to Fastify. Validation runs again here so obvious
 * junk never reaches the internal service.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = messageInputSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    })
  }

  try {
    return await apiFetch<{ ok: true }>('/api/messages', {
      method: 'POST',
      body: parsed.data,
      // The backend needs the sender's real IP for its spam guard: without it
      // the rate limiter would count every submission as one client — the
      // Nuxt server.
      headers: {
        'x-forwarded-for': getRequestIP(event, { xForwardedFor: true }) ?? '',
      },
    })
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode ?? 502

    // A 429 from the spam guard is passed through as-is — the form has
    // something meaningful to show for it.
    throw createError({
      statusCode: status === 429 ? 429 : 502,
      statusMessage: status === 429 ? 'Too Many Requests' : 'Bad Gateway',
      message:
        status === 429
          ? 'Too many messages. Please try again later.'
          : 'The message service is temporarily unavailable.',
    })
  }
})
