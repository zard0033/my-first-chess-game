<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import pgnViewerStart from '@lichess-org/pgn-viewer'
import '@lichess-org/pgn-viewer/dist/lichess-pgn-viewer.css'

interface Props {
  pgn: string
  orientation?: 'white' | 'black'
  /** @deprecated ignored — pgn-viewer manages highlighted state internally */
  highlighted?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'white',
  highlighted: undefined,
})

const emit = defineEmits<{
  'move-selected': [move: string]
}>()

const containerRef = ref<HTMLElement | null>(null)
let viewer: ReturnType<typeof pgnViewerStart> | null = null

function mountViewer() {
  if (!containerRef.value) return
  containerRef.value.innerHTML = ''
  viewer = null

  if (!props.pgn) return

  try {
    viewer = pgnViewerStart(containerRef.value, {
      pgn: props.pgn,
      orientation: props.orientation,
      keyboardToMove: true,
      showMoves: 'auto',
      showControls: true,
      showPlayers: false,
      drawArrows: false,
    })

    // Intercept toPath so internal user navigation fires move-selected.
    // Capture localViewer to avoid reading the module-level `viewer` var
    // after a remount reassigns it (stale-closure guard).
    const localViewer = viewer
    const originalToPath = localViewer.toPath.bind(localViewer)
    localViewer.toPath = (path, focus) => {
      originalToPath(path, focus)
      const data = localViewer.curData() as unknown as Record<string, unknown> | null | undefined
      if (data && typeof data['uci'] === 'string' && data['uci']) {
        emit('move-selected', data['uci'])
      }
    }
  } catch {
    // Invalid PGN or library init failure — render nothing, no console noise
  }
}

onMounted(mountViewer)

onUnmounted(() => {
  if (containerRef.value) containerRef.value.innerHTML = ''
  viewer = null
})

watch(
  () => [props.pgn, props.orientation],
  mountViewer,
  { flush: 'post' },
)

defineExpose({ getViewer: () => viewer })
</script>

<template>
  <div
    ref="containerRef"
    class="pgn-viewer-wrapper"
    :data-orientation="orientation"
    role="region"
    aria-label="PGN viewer with chess board and move list"
  />
</template>

<style scoped>
.pgn-viewer-wrapper {
  width: 100%;
  min-height: 44px;
}
</style>
