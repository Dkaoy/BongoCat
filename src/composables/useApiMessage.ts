import { fetch } from '@tauri-apps/plugin-http'
import { watch } from 'vue'

import { useBubbleStore } from '@/stores/bubble'
import { formatNetworkError } from '@/utils/network'

export function useApiMessage() {
  const bubbleStore = useBubbleStore()

  let timer: ReturnType<typeof setInterval> | null = null

  // 获取消息并显示
  async function fetchApiMessage() {
    if (!bubbleStore.apiConfig.enabled || !bubbleStore.apiConfig.url || !bubbleStore.enabled) return

    try {
      const now = Date.now()

      // 检查是否到达请求间隔（将秒转换为毫秒）
      if (now - bubbleStore.apiConfig.lastFetch < bubbleStore.apiConfig.interval * 1000) return

      // 更新上次请求时间
      bubbleStore.apiConfig.lastFetch = now

      // 发送请求
      const fetchOptions: any = {
        method: bubbleStore.apiConfig.method,
      }

      // 添加自定义请求头
      if (bubbleStore.apiConfig.useCustomHeaders && Object.keys(bubbleStore.apiConfig.headers).length > 0) {
        fetchOptions.headers = bubbleStore.apiConfig.headers
      }

      // 添加请求体（仅用于POST请求）
      if (bubbleStore.apiConfig.method === 'POST' && bubbleStore.apiConfig.useCustomBody && bubbleStore.apiConfig.body) {
        fetchOptions.body = bubbleStore.apiConfig.body
        // 如果没有设置Content-Type，默认设置为application/json
        if (!fetchOptions.headers || !fetchOptions.headers['Content-Type']) {
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Content-Type': 'application/json',
          }
        }
      }

      const response = await fetch(bubbleStore.apiConfig.url, fetchOptions)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      // 获取响应数据
      const contentType = response.headers.get('content-type') || ''
      let message: string

      if (contentType.includes('application/json')) {
        // JSON 响应
        const jsonData = await response.json()

        // 尝试从常见字段中提取消息
        message = jsonData.message
          || jsonData.content
          || jsonData.text
          || jsonData.joke
          || jsonData.quote
          || jsonData.data?.text
          || jsonData.data?.content
          || jsonData.result?.text
          || jsonData.result?.content

        // 如果没有找到预期字段，尝试使用第一个字符串值
        if (!message) {
          for (const key in jsonData) {
            if (typeof jsonData[key] === 'string' && jsonData[key].length > 0) {
              message = jsonData[key]
              break
            }
          }
        }

        // 最后的回退：转换整个对象为字符串
        if (!message) {
          message = JSON.stringify(jsonData, null, 2).slice(0, 200) // 限制长度
        }
      } else {
        // 文本响应
        message = await response.text()
      }

      // 显示消息（如果内容太长则截断）
      if (message) {
        // 限制消息长度，避免显示过长内容
        if (message.length > 500) {
          message = `${message.slice(0, 497)}...`
        }
        bubbleStore.addMessage(message, bubbleStore.apiConfig.messageType)
      }
    } catch (error) {
      console.error('获取API消息失败:', error)

      // 使用网络错误格式化工具生成友好的错误消息
      const friendlyErrorMessage = formatNetworkError(error)

      bubbleStore.addMessage(friendlyErrorMessage, 'error')
    }
  }

  function startTimer() {
    if (timer) {
      clearInterval(timer)
    }

    // 使用用户配置的间隔时间（秒转换为毫秒）
    const intervalMs = bubbleStore.apiConfig.interval * 1000

    timer = setInterval(() => {
      fetchApiMessage()
    }, intervalMs)

    // 立即执行一次
    fetchApiMessage()
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  // 监听配置变化
  watch(() => bubbleStore.apiConfig.enabled, (enabled) => {
    if (enabled) {
      startTimer()
    } else {
      stopTimer()
    }
  })

  // 监听URL变化
  watch(() => bubbleStore.apiConfig.url, () => {
    if (bubbleStore.apiConfig.enabled) {
      bubbleStore.apiConfig.lastFetch = 0 // 重置上次请求时间，以便立即获取
      fetchApiMessage() // 立即获取一次
    }
  })

  // 监听间隔时间变化
  watch(() => bubbleStore.apiConfig.interval, () => {
    if (bubbleStore.apiConfig.enabled) {
      startTimer() // 重新启动定时器以使用新的间隔时间
    }
  })

  // 监听气泡框开关状态
  watch(() => bubbleStore.enabled, (enabled) => {
    if (enabled && bubbleStore.apiConfig.enabled) {
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
    fetchApiMessage,
    startTimer,
    stopTimer,
    cleanup,
  }
}
