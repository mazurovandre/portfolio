<script setup lang="ts">
import type { ContactLink } from '@portfolio/shared'

defineProps<{
  links: ContactLink[]
  cvUrl: string
}>()
</script>

<template>
  <section id="contacts" class="contacts" aria-labelledby="contacts-title">
    <!-- The design gives this section no visible heading, but the document
         outline breaks without one: the h2 is hidden visually, not removed. -->
    <h2 id="contacts-title" class="visually-hidden">Contacts</h2>

    <div class="links">
      <a
        v-for="link in links"
        :key="link.id"
        class="icon-link"
        :href="link.href"
        :title="`${link.label}: ${link.value}`"
        :aria-label="`${link.label}: ${link.value}`"
        :rel="link.href.startsWith('http') ? 'noopener me' : undefined"
        :target="link.href.startsWith('http') ? '_blank' : undefined"
      >
        <Icon :name="link.icon" />
      </a>

      <a :href="cvUrl" target="_blank" rel="noopener" class="btn btn-ghost">Open CV</a>
    </div>

    <ContactForm />
  </section>
</template>

<style scoped>
.contacts {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 80px clamp(24px, 6vw, 96px) 96px;
}

.links {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 48px;
}
</style>
