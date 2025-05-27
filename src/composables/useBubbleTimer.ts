import { ref, watch } from 'vue'

import { useBubbleStore } from '@/stores/bubble'

export interface TimedMessage {
  id: string
  content: string
  type: 'info' | 'success' | 'warning' | 'error'
  interval: number // 间隔时间（毫秒）
  enabled: boolean
  lastShown: number
}

export function useBubbleTimer() {
  const bubbleStore = useBubbleStore()

  const timedMessages = ref<TimedMessage[]>([
    {
      id: 'welcome',
      content: '欢迎使用 BongoCat！',
      type: 'info',
      interval: 300000, // 5分钟
      enabled: true,
      lastShown: 0,
    },
    {
      id: 'rest-reminder',
      content: '已经工作很久了，记得休息一下眼睛哦～',
      type: 'warning',
      interval: 1800000, // 30分钟
      enabled: true,
      lastShown: 0,
    },
    {
      id: 'hydration',
      content: '记得多喝水保持身体健康！💧',
      type: 'info',
      interval: 3600000, // 1小时
      enabled: true,
      lastShown: 0,
    },
    {
      id: 'stretch',
      content: '久坐容易疲劳，站起来活动活动吧！🤸‍♀️',
      type: 'warning',
      interval: 2700000, // 45分钟
      enabled: true,
      lastShown: 0,
    },
  ])

  const autoMessageEnabled = ref(true)
  let timer: number | null = null

  function startTimer() {
    if (timer) {
      clearInterval(timer)
    }

    timer = setInterval(() => {
      if (!autoMessageEnabled.value || !bubbleStore.enabled) {
        return
      }

      const now = Date.now()

      for (const message of timedMessages.value) {
        if (!message.enabled) continue

        if (now - message.lastShown >= message.interval) {
          bubbleStore.addMessage(message.content, message.type)
          message.lastShown = now
          break // 一次只显示一条定时消息
        }
      }
    }, 60000) // 每分钟检查一次
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function addTimedMessage(message: Omit<TimedMessage, 'id' | 'lastShown'>) {
    const newMessage: TimedMessage = {
      ...message,
      id: Date.now().toString(),
      lastShown: 0,
    }
    timedMessages.value.push(newMessage)
  }

  function removeTimedMessage(id: string) {
    const index = timedMessages.value.findIndex(msg => msg.id === id)
    if (index > -1) {
      timedMessages.value.splice(index, 1)
    }
  }

  function updateTimedMessage(id: string, updates: Partial<TimedMessage>) {
    const message = timedMessages.value.find(msg => msg.id === id)
    if (message) {
      Object.assign(message, updates)
    }
  }

  function resetTimedMessage(id: string) {
    const message = timedMessages.value.find(msg => msg.id === id)
    if (message) {
      message.lastShown = 0
    }
  }

  function resetAllTimedMessages() {
    timedMessages.value.forEach((message) => {
      message.lastShown = 0
    })
  }

  // 监听自动消息开关状态
  watch(autoMessageEnabled, (enabled) => {
    if (enabled) {
      startTimer()
    } else {
      stopTimer()
    }
  }, { immediate: true })

  // 监听气泡框开关状态
  watch(() => bubbleStore.enabled, (enabled) => {
    if (enabled && autoMessageEnabled.value) {
      startTimer()
    } else {
      stopTimer()
    }
  })

  // 组件卸载时清理定时器
  function cleanup() {
    stopTimer()
  }

  return {
    timedMessages,
    autoMessageEnabled,
    addTimedMessage,
    removeTimedMessage,
    updateTimedMessage,
    resetTimedMessage,
    resetAllTimedMessages,
    startTimer,
    stopTimer,
    cleanup,
  }
}
