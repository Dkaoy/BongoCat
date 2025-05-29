import type { Event } from '@tauri-apps/api/event'

import { invoke } from '@tauri-apps/api/core'
import { PhysicalPosition, PhysicalSize } from '@tauri-apps/api/dpi'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { availableMonitors } from '@tauri-apps/api/window'
import { isNumber } from 'es-toolkit/compat'
import { onMounted, ref } from 'vue'

import { useAppStore } from '@/stores/app'

export type WindowState = Record<string, Partial<PhysicalPosition & PhysicalSize> | undefined>

const appWindow = getCurrentWebviewWindow()
const { label } = appWindow

export function useWindowState() {
  const appStore = useAppStore()
  const isRestored = ref(false)

  onMounted(() => {
    appWindow.onMoved(onChange)

    appWindow.onResized(onChange)
  })

  const onChange = async (event: Event<PhysicalPosition | PhysicalSize>) => {
    const minimized = await appWindow.isMinimized()

    if (minimized) return

    appStore.windowState[label] ??= {}

    Object.assign(appStore.windowState[label], event.payload)

    // 如果是多屏显示窗口，保存位置到后端
    if (label.startsWith('monitor_')) {
      const match = label.match(/monitor_(\d+)/)
      if (match) {
        const monitorIndex = Number.parseInt(match[1])
        const { x, y, width, height } = appStore.windowState[label]

        if (isNumber(x) && isNumber(y) && isNumber(width) && isNumber(height)) {
          try {
            await invoke('save_window_position', {
              monitorIndex,
              x,
              y,
              width,
              height,
            })
          } catch (error) {
            console.error('保存窗口位置失败:', error)
          }
        }
      }
    }
  }

  const restoreState = async () => {
    const { x, y, width, height } = appStore.windowState[label] ?? {}

    if (isNumber(x) && isNumber(y)) {
      const monitors = await availableMonitors()

      const monitor = monitors.find((monitor) => {
        const { position, size } = monitor

        const inBoundsX = x >= position.x && x <= position.x + size.width
        const inBoundsY = y >= position.y && y <= position.y + size.height

        return inBoundsX && inBoundsY
      })

      if (monitor) {
        await appWindow.setPosition(new PhysicalPosition(x, y))
      }
    }

    if (width && height) {
      await appWindow.setSize(new PhysicalSize(width, height))
    }

    isRestored.value = true
  }

  return {
    isRestored,
    restoreState,
  }
}
