export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // By default the dev server only claims the IPv6 loopback ([::1]), and then
  // http://127.0.0.1:3000 does not answer even though http://localhost:3000
  // works. Binding to IPv4 removes the discrepancy: both addresses respond,
  // and the server still does not face the local network.
  devServer: { host: '127.0.0.1', port: 3000 },

  // SSR is mandatory: the content has to be present in the initial HTML for
  // search crawlers.
  ssr: true,

  modules: ['@nuxt/icon', '@nuxt/fonts', '@nuxtjs/sitemap', '@nuxtjs/robots'],

  css: ['~/assets/css/nocturne.css', '~/assets/css/app.css'],

  runtimeConfig: {
    // Private half: the Fastify address inside the docker network. The API is
    // not published externally and the browser knows nothing about it.
    apiInternalUrl: process.env.API_INTERNAL_URL ?? 'http://localhost:4000',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
    },
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
    name: 'Andrey Mazurov — Fullstack JavaScript Developer',
  },

  // Service JSON routes are closed off with an X-Robots-Tag header (see nitro
  // below) rather than Disallow: blocking the crawl would stop Google from
  // fetching page resources while rendering.

  fonts: {
    // Inter is self-hosted: the design system pulled it from Google Fonts,
    // which is an external render-blocking request and one more third-party
    // domain.
    families: [{ name: 'Inter', provider: 'google', weights: [400, 500, 600, 700] }],
  },

  icon: {
    // Inline SVG rather than a CSS mask: the markup lands in the SSR output,
    // and logos without their own fill can be recoloured by inheritance.
    mode: 'svg',

    // Icons are embedded in the bundle and registered synchronously, so
    // server-side rendering issues no request for their data. A server bundle
    // does not work here: the module reaches it over a relative URL that does
    // not resolve during SSR, then silently falls back to the external
    // api.iconify.design — the icons would depend on the network.
    //
    // This list must cover every `icon` value in the database,
    // see apps/api/src/seed/data/portfolio.json.
    clientBundle: {
      icons: [
        // Hero stack
        'devicon:react',
        'devicon-plain:nextjs',
        'devicon:typescript',
        'devicon:redux',
        'devicon:tailwindcss',
        'devicon:nodejs',
        'devicon:express',
        'devicon:nestjs',
        'devicon-plain:graphql',
        'devicon:postgresql',
        'devicon:mongodb',
        'devicon:redis',
        'devicon:docker',
        'devicon:git',
        'devicon-plain:amazonwebservices',
        'devicon:nginx',
        'devicon-plain:jest',
        'devicon:webpack',
        // Contacts and navigation
        'ph:linkedin-logo',
        'ph:telegram-logo',
        'ph:envelope-simple',
        'ph:github-logo',
        'ph:arrow-down',
        'ph:arrow-up',
      ],
      sizeLimitKb: 512,
    },

    // No calls to the external icon API under any circumstances.
    serverBundle: false,
    fallbackToApi: false,
  },

  nitro: {
    preset: 'node-server',
    routeRules: {
      // The page is cached for an hour and served instantly; the content
      // stays editable in the database without rebuilding the frontend.
      '/': { swr: 3600 },
      // Internal JSON routes should not surface in search results as pages of
      // their own, but they stay crawlable.
      '/api/**': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#161826' },
      ],
      link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    },
  },

  typescript: {
    strict: true,
  },
})
