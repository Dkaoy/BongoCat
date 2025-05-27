<script setup lang="ts">
import { convertFileSrc } from '@tauri-apps/api/core'
import { Menu } from '@tauri-apps/api/menu'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useDebounceFn, useEventListener } from '@vueuse/core'
import { onMounted, onUnmounted, ref, watch } from 'vue'

import BubbleComponent from '@/components/bubble/index.vue'
import { useApiMessage } from '@/composables/useApiMessage'
import { useBubbleTimer } from '@/composables/useBubbleTimer'
import { useDevice } from '@/composables/useDevice'
import { useModel } from '@/composables/useModel'
import { useSharedMenu } from '@/composables/useSharedMenu'
import { useBubbleStore } from '@/stores/bubble'
import { useCatStore } from '@/stores/cat'
import { useModelStore } from '@/stores/model'
import { join } from '@/utils/path'

const appWindow = getCurrentWebviewWindow()
const { pressedMouses, mousePosition, pressedLeftKeys, pressedRightKeys } = useDevice()
const { backgroundImage, handleDestroy, handleResize, handleMouseDown, handleMouseMove, handleKeyDown } = useModel()
const catStore = useCatStore()
const bubbleStore = useBubbleStore()
const { cleanup: cleanupBubbleTimer } = useBubbleTimer()
const { cleanup: cleanupApiMessage } = useApiMessage() 
const { getSharedMenu } = useSharedMenu()
const modelStore = useModelStore()

const resizing = ref(false)

onUnmounted(() => {
  handleDestroy()
  cleanupBubbleTimer()
  cleanupApiMessage()
})

// 气泡框交互
let lastClickTime = 0
function handleCatDoubleClick() {
  const now = Date.now()
  if (now - lastClickTime < 500) {
    // 双击时显示随机消息
    bubbleStore.showRandomMessage()
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

// 在主页面加载时显示欢迎消息
function showWelcomeMessage() {
  setTimeout(() => {
    bubbleStore.showInfo('你好！我是你的桌面小猫咪 🐱')
  }, 1000)
}

onMounted(() => {
  if (bubbleStore.enabled) {
    showWelcomeMessage()
  }
  
  // 如果API消息功能已启用，立即获取一条消息
  const { fetchApiMessage, startTimer } = useApiMessage();
  if (bubbleStore.enabled && bubbleStore.apiConfig.enabled && bubbleStore.apiConfig.url) {
    fetchApiMessage();
    startTimer(); // 启动定时获取API消息
  }
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 上方区域，为气泡提供空间 -->
    <div
      v-if="bubbleStore.position === 'above-center'"
      class="h-16 min-h-16 w-full flex items-center justify-center"
    >
      <!-- 气泡将在此区域上方显示 -->
    </div>

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

    <!-- 气泡框组件 -->
    <BubbleComponent />
  </div>
</template>
