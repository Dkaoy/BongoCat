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

  // 窗口实例管理 - 使用Map存储显示器索引到窗口ID的映射
  const windowInstances = ref<Record<number, string>>({})

  // 添加窗口实例
  const addWindowInstance = (windowId: string) => {
    // 从窗口ID中提取显示器索引
    const match = windowId.match(/monitor_(\d+)/)
    if (match) {
      const monitorIndex = Number.parseInt(match[1])
      windowInstances.value[monitorIndex] = windowId
      // 已添加窗口实例
    }
  }

  // 移除窗口实例
  const removeWindowInstance = (windowId: string) => {
    // 查找并移除对应的窗口实例
    for (const [monitorIndex, id] of Object.entries(windowInstances.value)) {
      if (id === windowId) {
        delete windowInstances.value[Number.parseInt(monitorIndex)]
        // 已移除窗口实例
        break
      }
    }
  }

  // 根据显示器索引移除窗口实例
  const removeWindowByMonitor = (monitorIndex: number) => {
    if (windowInstances.value[monitorIndex]) {
      const _windowId = windowInstances.value[monitorIndex]
      delete windowInstances.value[monitorIndex]
      // 已移除显示器上的窗口
    }
  }

  // 获取指定显示器的窗口ID
  const getWindowByMonitor = (monitorIndex: number): string | null => {
    return windowInstances.value[monitorIndex] || null
  }

  // 清空所有窗口实例
  const clearWindowInstances = () => {
    windowInstances.value = {}
    // 已清空所有窗口实例
  }

  // 获取所有活跃的窗口实例
  const getActiveWindows = (): Array<{ monitorIndex: number, windowId: string }> => {
    return Object.entries(windowInstances.value).map(([index, id]) => ({
      monitorIndex: Number.parseInt(index),
      windowId: id,
    }))
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
    removeWindowByMonitor,
    getWindowByMonitor,
    clearWindowInstances,
    getActiveWindows,
  }
}, {
  persist: true,
})
