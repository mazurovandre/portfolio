<script setup lang="ts">
/**
 * The "Contacts ↓ / Home ↑" toggle at the bottom of the hero.
 *
 * In the design the state was tracked with a scroll listener and the
 * scrolling itself was written on setInterval — a workaround for the preview
 * host, where animation frames never run. In a browser both jobs have native
 * answers: IntersectionObserver and scroll-behavior.
 */
const atContacts = ref(false)

let observer: IntersectionObserver | null = null

onMounted(() => {
  const target = document.getElementById('contacts')
  if (!target) return

  observer = new IntersectionObserver(
    ([entry]) => {
      atContacts.value = entry?.isIntersecting ?? false
    },
    // The section counts as reached once it occupies the top half of the screen.
    { rootMargin: '-50% 0px 0px 0px' },
  )

  observer.observe(target)
})

onBeforeUnmount(() => observer?.disconnect())

function onClick(event: MouseEvent) {
  // Without JavaScript the element stays an ordinary anchor and still works.
  event.preventDefault()

  const goingToContacts = !atContacts.value
  const target = goingToContacts ? document.getElementById('contacts') : document.body

  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <a class="scroll-toggle" :href="atContacts ? '#top' : '#contacts'" @click="onClick">
    <Icon v-if="atContacts" name="ph:arrow-up" />
    <span>{{ atContacts ? 'Home' : 'Contacts' }}</span>
    <Icon v-if="!atContacts" name="ph:arrow-down" />
  </a>
</template>

<style scoped>
.scroll-toggle {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  letter-spacing: 0.02em;
  color: var(--color-accent-300);
}
.scroll-toggle:hover {
  color: var(--color-accent);
}
</style>
