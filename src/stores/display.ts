import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDisplayStore = defineStore('display', () => {
  // 多屏显示设置
  const multiScreenEnabled = ref(false)
  const primaryMonitor = ref<number | null>(null)
  const secondaryMonitor = ref<number | null>(null)
  const followCursor = ref(true)
  const showOnAllScreens = ref(false)
  // 跟踪主窗口是否已经移动到主显示器
  const mainWindowOnPrimaryMonitor = ref(false)

  // 窗口实例管理
  const windowInstances = ref<string[]>([])

  // 添加窗口实例
  const addWindowInstance = (windowId: string) => {
    if (!windowInstances.value.includes(windowId)) {
      windowInstances.value.push(windowId)
    }
  }

  // 移除窗口实例
  const removeWindowInstance = (windowId: string) => {
    const index = windowInstances.value.indexOf(windowId)
    if (index > -1) {
      windowInstances.value.splice(index, 1)
    }
  }

  // 清空所有窗口实例
  const clearWindowInstances = () => {
    windowInstances.value = []
  }

  return {
    multiScreenEnabled,
    primaryMonitor,
    secondaryMonitor,
    followCursor,
    showOnAllScreens,
    mainWindowOnPrimaryMonitor,
    windowInstances,
    addWindowInstance,
    removeWindowInstance,
    clearWindowInstances,
  }
}, {
  persist: true,
})
