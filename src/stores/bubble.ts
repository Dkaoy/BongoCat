import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface BubbleMessage {
  id: string
  content: string
  duration: number
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: number
}

export interface ApiConfig {
  enabled: boolean
  url: string
  interval: number
  lastFetch: number
  messageType: 'info' | 'success' | 'warning' | 'error'
  headers: Record<string, string>
  useCustomHeaders: boolean
}

export const useBubbleStore = defineStore('bubble', () => {
  // 基础设置
  const enabled = ref(true)
  const position = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'above-center'>('top-right')
  const autoHide = ref(true)
  const defaultDuration = ref(3000) // 默认显示时长（毫秒）
  const maxMessages = ref(3) // 最大同时显示的消息数量

  // API消息设置
  const apiConfig = ref<ApiConfig>({
    enabled: false,
    url: '',
    interval: 300000, // 5分钟
    lastFetch: 0,
    messageType: 'info',
    headers: {},
    useCustomHeaders: false
  })

  // 样式设置
  const bubbleStyle = ref({
    backgroundColor: '#ffffff',
    textColor: '#333333',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    opacity: 90,
    shadow: true,
    minWidth: 120,
    maxWidth: 250,
  })

  // 动画设置
  const animation = ref({
    enabled: true,
    type: 'slide', // 'slide' | 'fade' | 'bounce'
    duration: 300,
  })

  // 消息队列
  const messages = ref<BubbleMessage[]>([])
  const currentMessage = ref<BubbleMessage | null>(null)

  // 计算属性
  const visibleMessages = computed(() => {
    return messages.value.slice(0, maxMessages.value)
  })

  const bubblePosition = computed(() => {
    const positions = {
      'top-left': { top: '20px', left: '20px' },
      'top-right': { top: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'bottom-right': { bottom: '20px', right: '20px' },
      'above-center': { top: '-60px', left: '50%', transform: 'translateX(-50%)' },
    }
    return positions[position.value]
  })

  // 方法
  function addMessage(content: string, type: BubbleMessage['type'] = 'info', duration?: number) {
    const message: BubbleMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      content,
      type,
      duration: duration ?? defaultDuration.value,
      timestamp: Date.now(),
    }

    messages.value.unshift(message)

    // 限制消息数量
    if (messages.value.length > maxMessages.value * 2) {
      messages.value = messages.value.slice(0, maxMessages.value * 2)
    }

    // 设置自动隐藏
    if (autoHide.value && message.duration > 0) {
      setTimeout(() => {
        removeMessage(message.id)
      }, message.duration)
    }

    return message.id
  }

  function removeMessage(id: string) {
    const index = messages.value.findIndex(msg => msg.id === id)
    if (index > -1) {
      messages.value.splice(index, 1)
    }
  }

  function clearMessages() {
    messages.value = []
    currentMessage.value = null
  }

  // 快捷方法
  function showInfo(content: string, duration?: number) {
    return addMessage(content, 'info', duration)
  }

  function showSuccess(content: string, duration?: number) {
    return addMessage(content, 'success', duration)
  }

  function showWarning(content: string, duration?: number) {
    return addMessage(content, 'warning', duration)
  }

  function showError(content: string, duration?: number) {
    return addMessage(content, 'error', duration)
  }

  // 预设消息
  const presetMessages = ref([
    '你好，我是你的桌面宠物！',
    '今天天气真不错呢～',
    '要不要一起玩游戏？',
    '记得按时休息哦！',
    '你今天过得怎么样？',
    '我在这里陪着你！',
    '有什么需要帮助的吗？',
    '让我们一起加油吧！',
  ])

  function showRandomMessage() {
    const randomMessage = presetMessages.value[Math.floor(Math.random() * presetMessages.value.length)]
    return showInfo(randomMessage)
  }

  return {
    // 状态
    enabled,
    position,
    autoHide,
    defaultDuration,
    maxMessages,
    bubbleStyle,
    animation,
    messages,
    currentMessage,
    presetMessages,
    apiConfig,

    // 计算属性
    visibleMessages,
    bubblePosition,

    // 方法
    addMessage,
    removeMessage,
    clearMessages,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showRandomMessage,
  }
})
