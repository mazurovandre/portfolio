<script setup lang="ts">
import type { Tech } from '@portfolio/shared'
import type { ParallaxState } from '~/composables/useParallax'

// The parallax state is created on the page: it drives not only the tile
// cloud but also the background gradient that extends beyond the hero.
defineProps<{
  name: string
  headline: string
  techs: Tech[]
  parallax: ParallaxState
}>()
</script>

<template>
  <section
    class="hero"
    aria-labelledby="hero-title"
    @mousemove="parallax.onMouseMove"
    @mouseleave="parallax.onMouseLeave"
  >
    <StackCloud
      :techs="techs"
      :mouse-x="parallax.x.value"
      :mouse-y="parallax.y.value"
      :active="parallax.active.value"
    />

    <!-- A blurring layer over the tiles: the text stays readable and the
         stack stays in the background. -->
    <div class="hero-veil" />

    <div class="hero-content">
      <h1 id="hero-title" class="hero-title">{{ name }}</h1>
      <span class="hero-headline">{{ headline }}</span>

      <!-- The stack is duplicated as text: in the design it exists only as
           graphics, and for search crawlers these are keywords. -->
      <h2 class="visually-hidden">Technologies</h2>
      <ul class="visually-hidden">
        <li v-for="tech in techs" :key="tech.id">{{ tech.name }}</li>
      </ul>
    </div>

    <ScrollToggle />
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  z-index: 1;
  min-height: 92vh;
  display: flex;
  align-items: center;
  padding: 0 clamp(24px, 6vw, 96px);
  overflow: hidden;
}

.hero-veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  background:
    radial-gradient(
      46% 62% at 26% 50%,
      color-mix(in srgb, var(--color-bg) 62%, transparent) 45%,
      transparent 100%
    ),
    linear-gradient(to right, color-mix(in srgb, var(--color-bg) 55%, transparent) 0%, transparent 55%);
  mask-image:
    radial-gradient(50% 68% at 26% 50%, black 55%, transparent 100%),
    linear-gradient(to right, black 0%, black 40%, transparent 62%);
  mask-composite: add;
  -webkit-mask-composite: source-over;
}

.hero-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  text-align: left;
}

.hero-title {
  font-family: var(--font-heading);
  font-weight: var(--font-heading-weight);
  font-size: clamp(40px, 6vw, 76px);
  line-height: 1.08;
  letter-spacing: -0.015em;
  margin: 0;
}

/* The subtitle with a short accent rule on the left — a signature of the system. */
.hero-headline {
  position: relative;
  display: inline-block;
  font-size: 17px;
  line-height: 28px;
  letter-spacing: 0.02em;
  color: var(--color-accent-300);
  margin-top: 16px;
  padding-left: 24px;
}
.hero-headline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 16px;
  height: 1px;
  background: var(--color-accent);
}
</style>
