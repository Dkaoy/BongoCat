<script setup lang="ts">
import { computed } from 'vue'

import { useBubbleStore } from '@/stores/bubble'

const bubbleStore = useBubbleStore()

const bubbleClasses = computed(() => {
  return [
    'bubble-container',
    `position-${bubbleStore.position}`,
    bubbleStore.animation.enabled ? `animate-${bubbleStore.animation.type}` : '',
    bubbleStore.position === 'above-center' ? 'above-center-position' : '',
  ]
})

const bubbleContainerStyle = computed(() => ({
  position: 'fixed' as const,
  zIndex: 1000,
  pointerEvents: (bubbleStore.enabled ? 'auto' : 'none') as 'auto' | 'none',
  width: 'auto',
  height: 'auto',
  ...bubbleStore.bubblePosition,
}))

function getMessageTypeIcon(type: string) {
  const icons: Record<string, string> = {
    info: 'i-solar:info-circle-bold',
    success: 'i-solar:check-circle-bold',
    warning: 'i-solar:danger-triangle-bold',
    error: 'i-solar:close-circle-bold',
  }
  return icons[type] || icons.info
}

function getMessageTypeColor(type: string) {
  const colors: Record<string, string> = {
    info: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
  }
  return colors[type] || colors.info
}

function handleMessageClick(messageId: string) {
  bubbleStore.removeMessage(messageId)
}
</script>

<template>
  <Transition name="bubble-container">
    <div
      v-if="bubbleStore.enabled && bubbleStore.visibleMessages.length > 0"
      class="bubble-container"
      :class="bubbleClasses"
      :style="bubbleContainerStyle"
    >
      <TransitionGroup
        class="messages-wrapper"
        name="bubble-message"
        tag="div"
      >
        <div
          v-for="message in bubbleStore.visibleMessages"
          :key="message.id"
          class="bubble-message"
          :style="{
            backgroundColor: bubbleStore.bubbleStyle.backgroundColor,
            color: bubbleStore.bubbleStyle.textColor,
            borderRadius: `${bubbleStore.bubbleStyle.borderRadius}px`,
            padding: `${bubbleStore.bubbleStyle.padding}px`,
            fontSize: `${bubbleStore.bubbleStyle.fontSize}px`,
            opacity: bubbleStore.bubbleStyle.opacity / 100,
            minWidth: `${bubbleStore.bubbleStyle.minWidth}px`,
            maxWidth: `${bubbleStore.bubbleStyle.maxWidth}px`,
            marginBottom: '8px',
            cursor: 'pointer',
            userSelect: 'none',
            wordBreak: 'break-word',
            boxShadow: bubbleStore.bubbleStyle.shadow
              ? '0 4px 12px rgba(0, 0, 0, 0.15)'
              : 'none',
            border: `2px solid ${getMessageTypeColor(message.type)}`,
            transition: 'all 0.3s ease',
          }"
          @click="handleMessageClick(message.id)"
        >
          <div class="flex items-start gap-2">
            <div
              class="mt-0.5 flex-shrink-0 text-4"
              :class="getMessageTypeIcon(message.type)"
              :style="{ color: getMessageTypeColor(message.type) }"
            />
            <div class="flex-1">
              <div class="message-content">
                {{ message.content }}
              </div>
              <div
                v-if="bubbleStore.autoHide && message.duration > 0"
                class="progress-bar"
                :style="{
                  animation: `progress ${message.duration}ms linear`,
                  backgroundColor: getMessageTypeColor(message.type),
                }"
              />
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Transition>
</template>

<style scoped>
.bubble-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.messages-wrapper {
  display: flex;
  flex-direction: column;
}

.bubble-message {
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.bubble-message:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2) !important;
}

.progress-bar {
  height: 2px;
  margin-top: 6px;
  border-radius: 1px;
  transform-origin: left;
}

@keyframes progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* 容器动画 */
.bubble-container-enter-active,
.bubble-container-leave-active {
  transition: all 0.3s ease;
}

.bubble-container-enter-from,
.bubble-container-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 消息动画 */
.bubble-message-enter-active {
  transition: all 0.3s ease;
}

.bubble-message-leave-active {
  transition: all 0.3s ease;
}

.bubble-message-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.bubble-message-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

.bubble-message-move {
  transition: transform 0.3s ease;
}

/* 位置样式 */
.position-top-left .bubble-message-enter-from {
  transform: translateX(-100px);
}

.position-top-right .bubble-message-enter-from {
  transform: translateX(100px);
}

.position-bottom-left .bubble-message-enter-from {
  transform: translateX(-100px);
}

.position-bottom-right .bubble-message-enter-from {
  transform: translateX(100px);
}

/* 上方中央位置样式 */
.position-above-center .bubble-message-enter-from {
  transform: translateY(-30px);
}

.above-center-position {
  /* 使气泡框在上方水平居中 */
  position: absolute !important;
  top: 5px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  z-index: 2000 !important;
}

/* 动画类型 */
.animate-fade .bubble-message-enter-from {
  transform: scale(0.8);
  opacity: 0;
}

.animate-bounce .bubble-message-enter-active {
  animation: bounce-in 0.5s ease;
}

@keyframes bounce-in {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  70% {
    transform: scale(0.9);
    opacity: 0.9;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
