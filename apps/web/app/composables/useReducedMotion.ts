/**
 * Tracks the system "reduce motion" setting.
 * Always false on the server, so the first render matches the normal
 * behaviour; after hydration the value is refined from the real media feature.
 */
export function useReducedMotion() {
  const reduced = ref(false)

  onMounted(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.value = query.matches

    const onChange = (event: MediaQueryListEvent) => {
      reduced.value = event.matches
    }

    query.addEventListener('change', onChange)
    onBeforeUnmount(() => query.removeEventListener('change', onChange))
  })

  return reduced
}
