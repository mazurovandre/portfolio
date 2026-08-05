<script setup lang="ts">
import type { Content } from '@portfolio/shared'

// Data is fetched on the server in a single request: the page reaches a
// crawler fully assembled, with no browser-side calls to the API.
const { data } = await useFetch<Content>('/api/content')

const profile = computed(() => data.value?.profile)
const techs = computed(() => data.value?.techs ?? [])
const contactLinks = computed(() => data.value?.contactLinks ?? [])

const { public: publicConfig } = useRuntimeConfig()
const siteUrl = publicConfig.siteUrl.replace(/\/$/, '')

useSeoMeta({
  title: () => profile.value?.seo.title,
  description: () => profile.value?.seo.description,
  author: () => profile.value?.name,
  ogType: 'profile',
  ogTitle: () => profile.value?.seo.title,
  ogDescription: () => profile.value?.seo.description,
  // Same shape as the canonical URL: a trailing-slash mismatch would give
  // a crawler two addresses for one page.
  ogUrl: `${siteUrl}/`,
  ogLocale: () => profile.value?.locale.replace('-', '_'),
  ogImage: () => `${siteUrl}${profile.value?.seo.ogImage ?? '/og.png'}`,
  twitterCard: 'summary_large_image',
  twitterTitle: () => profile.value?.seo.title,
  twitterDescription: () => profile.value?.seo.description,
  twitterImage: () => `${siteUrl}${profile.value?.seo.ogImage ?? '/og.png'}`,
})

// Structured data: the page describes a person, not an organisation.
// sameAs and knowsAbout are built from the same database records that render
// the sections.
const jsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.value?.name,
  jobTitle: profile.value?.headline,
  description: profile.value?.bio ?? profile.value?.seo.description,
  url: siteUrl,
  image: `${siteUrl}${profile.value?.seo.ogImage ?? '/og.png'}`,
  knowsAbout: techs.value.map((tech) => tech.name),
  sameAs: contactLinks.value
    .filter((link) => link.href.startsWith('http'))
    .map((link) => link.href),
  email: contactLinks.value.find((link) => link.href.startsWith('mailto:'))?.href,
}))

useHead({
  // Google ignores keywords, but Yandex still reads it.
  meta: [{ name: 'keywords', content: () => profile.value?.seo.keywords.join(', ') ?? '' }],
  link: [{ rel: 'canonical', href: `${siteUrl}/` }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: () => JSON.stringify(jsonLd.value),
    },
  ],
})

/**
 * The background gradient follows the cursor in the hero but covers the whole
 * page, so its state lives here rather than inside the section.
 */
const reducedMotion = useReducedMotion()
const parallax = useParallax(reducedMotion)

const backgroundStyle = computed(() => ({
  background: [
    `radial-gradient(700px 500px at ${parallax.x.value * 100}% ${parallax.y.value * 100}%,` +
      ' color-mix(in srgb, var(--color-accent-900) 55%, transparent), transparent 60%)',
    `radial-gradient(900px 700px at ${100 - parallax.x.value * 60}% ${100 - parallax.y.value * 40}%,` +
      ' color-mix(in srgb, black 25%, transparent), transparent 55%)',
  ].join(', '),
}))
</script>

<template>
  <div id="top" class="page">
    <div class="page-glow" :style="backgroundStyle" />

    <main>
      <HeroSection
        v-if="profile"
        :name="profile.name"
        :headline="profile.headline"
        :techs="techs"
        :parallax="parallax"
      />

      <ContactSection v-if="profile" :links="contactLinks" :cv-url="profile.cvUrl" />
    </main>

    <footer v-if="profile" class="footer">© {{ profile.copyrightYear }} {{ profile.name }}</footer>
  </div>
</template>

<style scoped>
.page {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  color: var(--color-text);
  font-family: var(--font-body);
}

.page-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.footer {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 clamp(24px, 6vw, 96px) 32px;
  font-size: 13px;
  color: color-mix(in srgb, var(--color-text) 50%, transparent);
}
</style>
