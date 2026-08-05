import type { Content } from '@portfolio/shared'
import fallback from '../../app/data/fallback.json'

/**
 * Page content. If the API or the database is unavailable, serve the snapshot
 * committed to the repository: a crawler gets valid HTML and a 200 rather
 * than a 500 — a downed backend must not push the page out of the index.
 */
export default defineCachedEventHandler(
  async (event): Promise<Content> => {
    try {
      return await apiFetch<Content>('/api/content')
    } catch (error) {
      console.error('[content] API unavailable, serving the fallback snapshot:', error)
      setResponseHeader(event, 'x-content-source', 'fallback')
      return fallback as Content
    }
  },
  {
    // Short cache: the content changes rarely, and SSR of every page should
    // not hit the backend again.
    maxAge: 60,
    name: 'content',
    getKey: () => 'default',
  },
)
