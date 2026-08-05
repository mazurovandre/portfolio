<script setup lang="ts">
import type { Tech } from '@portfolio/shared'

const props = defineProps<{
  techs: Tech[]
  /** Normalised cursor position, 0..1 */
  mouseX: number
  mouseY: number
  /** Cursor is inside the hero. While false, the tiles sit on the plain grid. */
  active: boolean
}>()

const COLS = 6
const ROWS = 3
const MAX_SHIFT = 46

/**
 * The deterministic "noise" from the design. A plain Math.random would give
 * a different layout on the server and in the browser and break hydration.
 * Here the position is a pure function of the index, so both renders agree.
 */
function pseudoRandom(index: number, factor: number, magnitude: number): number {
  const seed = Math.sin(index * factor) * magnitude
  return seed - Math.floor(seed)
}

const tiles = computed(() =>
  props.techs.map((tech, i) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)

    const jitterX = (pseudoRandom(i, 12.9898, 43758.5453) - 0.5) * 8
    const jitterY = (pseudoRandom(i, 78.233, 12543.123) - 0.5) * 10
    const depth = 0.6 + pseudoRandom(i, 33.7, 5871.29) * 0.8

    // With no cursor present the offset is zero — centred on both axes.
    const x = props.active ? props.mouseX : 0.5
    const y = props.active ? props.mouseY : 0.5
    const dx = (x - 0.5) * 2 * MAX_SHIFT * depth
    const dy = (y - 0.5) * 2 * MAX_SHIFT * depth

    return {
      key: tech.id,
      name: tech.name,
      icon: tech.icon,
      style: {
        left: `${((col + 0.5) / COLS) * 100 + jitterX}%`,
        top: `${((row + 0.5) / ROWS) * 100 + jitterY}%`,
        transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px)`,
        '--float-delay': `${(i % 5) * 0.6}s`,
      },
    }
  }),
)
</script>

<template>
  <!-- The tiles are decorative: the technology names are duplicated as text
       in HeroSection, so this markup is hidden from assistive technology to
       avoid reading the same stack twice. -->
  <div class="stack-cloud" aria-hidden="true">
    <div v-for="tile in tiles" :key="tile.key" class="stack-icon" :title="tile.name" :style="tile.style">
      <Icon :name="tile.icon" />
    </div>
  </div>
</template>

<style scoped>
.stack-cloud {
  position: absolute;
  inset: 0;
  z-index: 0;
  /* The grid fades towards the edges so tiles never butt up against them. */
  -webkit-mask-image:
    linear-gradient(to bottom, transparent, black 18%, black 82%, transparent),
    linear-gradient(to right, transparent, black 4%, black 96%, transparent);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(to bottom, transparent, black 18%, black 82%, transparent),
    linear-gradient(to right, transparent, black 4%, black 96%, transparent);
  mask-composite: intersect;
}
</style>
