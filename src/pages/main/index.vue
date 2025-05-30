<script setup lang="ts">
import { convertFileSrc } from '@tauri-apps/api/core'
import { Menu } from '@tauri-apps/api/menu'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useDebounceFn, useEventListener } from '@vueuse/core'
import { onUnmounted, ref, watch } from 'vue'

import { useDevice } from '@/composables/useDevice'
import { useModel } from '@/composables/useModel'
import { useSharedMenu } from '@/composables/useSharedMenu'
import { useCatStore } from '@/stores/cat'
import { useModelStore } from '@/stores/model'
import { join } from '@/utils/path'

const appWindow = getCurrentWebviewWindow()
const { pressedMouses, mousePosition, pressedLeftKeys, pressedRightKeys } = useDevice()
const { backgroundImage, handleDestroy, handleResize, handleMouseDown, handleMouseMove, handleKeyDown } = useModel()
const catStore = useCatStore()
const { getSharedMenu } = useSharedMenu()
const modelStore = useModelStore()

const resizing = ref(false)

onUnmounted(() => {
  handleDestroy()
})

// 双击事件
let lastClickTime = 0
function handleCatDoubleClick() {
  const now = Date.now()
  if (now - lastClickTime < 500) {
    // 双击事件（可以在这里添加其他功能）
    console.warn('桌宠双击')
  }
  lastClickTime = now
}

const handleDebounceResize = useDebounceFn(async () => {
  await handleResize()

  resizing.value = false
}, 100)

useEventListener('resize', () => {
  resizing.value = true

  handleDebounceResize()
})

watch(pressedMouses, handleMouseDown)

watch(mousePosition, handleMouseMove)

watch(pressedLeftKeys, (keys) => {
  handleKeyDown('left', keys.length > 0)
})

watch(pressedRightKeys, (keys) => {
  handleKeyDown('right', keys.length > 0)
})

watch(() => catStore.penetrable, (value) => {
  appWindow.setIgnoreCursorEvents(value)
}, { immediate: true })

function handleWindowDrag() {
  appWindow.startDragging()
}

async function handleContextmenu(event: MouseEvent) {
  event.preventDefault()

  const menu = await Menu.new({
    items: await getSharedMenu(),
  })

  menu.popup()
}

function resolveImagePath(key: string, side: 'left' | 'right' = 'left') {
  return convertFileSrc(join(modelStore.currentModel!.path, 'resources', `${side}-keys`, `${key}.png`))
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div
      class="relative w-full flex-1 overflow-hidden children:(absolute size-full)"
      :class="[catStore.mirrorMode ? '-scale-x-100' : 'scale-x-100']"
      :style="{ opacity: catStore.opacity / 100 }"
      @click="handleCatDoubleClick"
      @contextmenu="handleContextmenu"
      @mousedown="handleWindowDrag"
    >
      <img
        class="h-full w-full object-contain"
        :src="backgroundImage"
      >

      <canvas
        id="live2dCanvas"
        class="h-full w-full"
      />

      <img
        v-for="key in pressedLeftKeys"
        :key="key"
        class="h-full w-full object-contain"
        :src="resolveImagePath(key)"
      >

      <img
        v-for="key in pressedRightKeys"
        :key="key"
        class="h-full w-full object-contain"
        :src="resolveImagePath(key, 'right')"
      >

      <div
        v-show="resizing"
        class="h-full w-full flex items-center justify-center bg-black"
      >
        <span class="text-center text-lg text-white">
          重绘中...
        </span>
      </div>
    </div>
  </div>
</template>
