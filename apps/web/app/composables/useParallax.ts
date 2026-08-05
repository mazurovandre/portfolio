/** Normalised cursor position inside the tracked area. */
export interface ParallaxState {
  x: Ref<number>
  y: Ref<number>
  active: Ref<boolean>
  onMouseMove: (event: MouseEvent) => void
  onMouseLeave: () => void
}

/**
 * Cursor-driven parallax. The defaults (0.5 / 0.2) match the design, so the
 * server render and the first browser frame agree.
 *
 * State updates are pinned to the frame via requestAnimationFrame: mousemove
 * fires more often than the screen can repaint.
 */
export function useParallax(disabled?: Ref<boolean>): ParallaxState {
  const x = ref(0.5)
  const y = ref(0.2)
  const active = ref(false)

  let frame: number | null = null
  let pending: { x: number; y: number } | null = null

  const flush = () => {
    frame = null
    if (!pending) return
    x.value = pending.x
    y.value = pending.y
    active.value = true
    pending = null
  }

  const onMouseMove = (event: MouseEvent) => {
    if (disabled?.value) return

    const target = event.currentTarget as HTMLElement | null
    if (!target) return

    const rect = target.getBoundingClientRect()
    pending = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    }

    frame ??= requestAnimationFrame(flush)
  }

  const onMouseLeave = () => {
    if (frame !== null) {
      cancelAnimationFrame(frame)
      frame = null
    }
    pending = null
    x.value = 0.5
    y.value = 0.2
    active.value = false
  }

  onBeforeUnmount(() => {
    if (frame !== null) cancelAnimationFrame(frame)
  })

  return { x, y, active, onMouseMove, onMouseLeave }
}
