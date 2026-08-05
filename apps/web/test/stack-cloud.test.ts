import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { Tech } from '@portfolio/shared'
import StackCloud from '../app/components/StackCloud.vue'

const techs: Tech[] = Array.from({ length: 18 }, (_, i) => ({
  id: `id-${i}`,
  name: `Tech ${i}`,
  icon: 'ph:code',
  order: i,
  visible: true,
}))

describe('StackCloud', () => {
  it('lays tiles out deterministically, so server and client renders match', async () => {
    const first = await mountSuspended(StackCloud, {
      props: { techs, mouseX: 0.5, mouseY: 0.2, active: false },
    })
    const second = await mountSuspended(StackCloud, {
      props: { techs, mouseX: 0.5, mouseY: 0.2, active: false },
    })

    // Positions are a pure function of the index — otherwise hydration breaks
    expect(first.html()).toBe(second.html())
  })

  it('leaves tiles unshifted while there is no cursor', async () => {
    const wrapper = await mountSuspended(StackCloud, {
      props: { techs, mouseX: 0.9, mouseY: 0.9, active: false },
    })

    const tiles = wrapper.findAll('.stack-icon')
    expect(tiles).toHaveLength(18)
    for (const tile of tiles) {
      expect(tile.attributes('style')).toContain('translate(0px, 0px)')
    }
  })

  it('shifts tiles with the cursor, each at its own depth', async () => {
    const wrapper = await mountSuspended(StackCloud, {
      props: { techs, mouseX: 1, mouseY: 1, active: true },
    })

    const shifts = wrapper.findAll('.stack-icon').map((tile) => {
      const match = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(tile.attributes('style') ?? '')
      return match ? Number(match[1]) : 0
    })

    expect(shifts.every((shift) => shift > 0)).toBe(true)
    // Varying depth is what makes it parallax — otherwise the layer moves as one
    expect(new Set(shifts).size).toBeGreaterThan(1)
    // The largest shift is bounded by maxShift times the maximum depth
    expect(Math.max(...shifts)).toBeLessThanOrEqual(46 * 1.4)
  })

  it('marks the cloud decorative: the names are duplicated as text in the hero', async () => {
    const wrapper = await mountSuspended(StackCloud, {
      props: { techs, mouseX: 0.5, mouseY: 0.5, active: false },
    })

    expect(wrapper.find('.stack-cloud').attributes('aria-hidden')).toBe('true')
  })
})
