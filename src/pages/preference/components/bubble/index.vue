<script setup lang="ts">
import { Button, Input, InputNumber, Select, Slider, Switch } from 'ant-design-vue'
import { ref } from 'vue'

import ProList from '@/components/pro-list/index.vue'
import ProListItem from '@/components/pro-list-item/index.vue'
import { useBubbleTimer } from '@/composables/useBubbleTimer'
import { useBubbleStore } from '@/stores/bubble'

const bubbleStore = useBubbleStore()
const {
  timedMessages,
  autoMessageEnabled,
  addTimedMessage: addNewTimedMessage,
  removeTimedMessage,
} = useBubbleTimer()

const newPresetMessage = ref('')
const newTimedMessage = ref({
  content: '',
  type: 'info' as const,
  interval: 300000,
  enabled: true,
})

function addPresetMessage() {
  if (newPresetMessage.value.trim()) {
    bubbleStore.presetMessages.push(newPresetMessage.value.trim())
    newPresetMessage.value = ''
  }
}

function removePresetMessage(index: number) {
  bubbleStore.presetMessages.splice(index, 1)
}

function testBubble() {
  bubbleStore.showInfo('这是一条测试消息！')
}

function testAllTypes() {
  setTimeout(() => bubbleStore.showInfo('信息类型消息'), 100)
  setTimeout(() => bubbleStore.showSuccess('成功类型消息'), 600)
  setTimeout(() => bubbleStore.showWarning('警告类型消息'), 1100)
  setTimeout(() => bubbleStore.showError('错误类型消息'), 1600)
}

function clearAllMessages() {
  bubbleStore.clearMessages()
}

const positionOptions = [
  { label: '左上角', value: 'top-left' },
  { label: '右上角', value: 'top-right' },
  { label: '左下角', value: 'bottom-left' },
  { label: '右下角', value: 'bottom-right' },
]

const animationOptions = [
  { label: '滑入', value: 'slide' },
  { label: '淡入', value: 'fade' },
  { label: '弹跳', value: 'bounce' },
]

function durationFormatter(value?: number) {
  return value ? `${value}ms` : '0ms'
}

function opacityFormatter(value?: number) {
  return `${value}%`
}

function resetToDefault() {
  // 重置为默认设置
  bubbleStore.enabled = true
  bubbleStore.position = 'top-right'
  bubbleStore.autoHide = true
  bubbleStore.defaultDuration = 3000
  bubbleStore.maxMessages = 3

  bubbleStore.bubbleStyle = {
    backgroundColor: '#ffffff',
    textColor: '#333333',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    opacity: 90,
    shadow: true,
    minWidth: 120,
    maxWidth: 250,
  }

  bubbleStore.animation = {
    enabled: true,
    type: 'slide',
    duration: 300,
  }
}

function addTimedMessageToList() {
  if (newTimedMessage.value.content.trim()) {
    addNewTimedMessage({
      content: newTimedMessage.value.content.trim(),
      type: newTimedMessage.value.type,
      interval: newTimedMessage.value.interval,
      enabled: newTimedMessage.value.enabled,
    })
    newTimedMessage.value = {
      content: '',
      type: 'info',
      interval: 300000,
      enabled: true,
    }
  }
}

function formatInterval(ms: number) {
  if (ms >= 3600000) {
    return `${Math.round(ms / 3600000)}小时`
  } else if (ms >= 60000) {
    return `${Math.round(ms / 60000)}分钟`
  } else {
    return `${Math.round(ms / 1000)}秒`
  }
}

const timedMessageTypeOptions = [
  { label: '信息', value: 'info' },
  { label: '成功', value: 'success' },
  { label: '警告', value: 'warning' },
  { label: '错误', value: 'error' },
]
</script>

<template>
  <div class="space-y-6">
    <!-- 基础设置 -->
    <ProList title="基础设置">
      <ProListItem
        description="开启后，桌宠将能够显示气泡消息"
        title="启用气泡框"
      >
        <Switch v-model:checked="bubbleStore.enabled" />
      </ProListItem>

      <ProListItem
        description="设置气泡框在屏幕上的显示位置"
        title="显示位置"
      >
        <Select
          v-model:value="bubbleStore.position"
          :options="positionOptions"
          style="width: 120px"
        />
      </ProListItem>

      <ProListItem
        description="启用后，消息将在指定时间后自动消失"
        title="自动隐藏"
      >
        <Switch v-model:checked="bubbleStore.autoHide" />
      </ProListItem>

      <ProListItem
        description="消息自动隐藏的时间（毫秒）"
        :disabled="!bubbleStore.autoHide"
        title="默认显示时长"
      >
        <Slider
          v-model:value="bubbleStore.defaultDuration"
          :formatter="durationFormatter"
          :max="10000"
          :min="1000"
          :step="500"
          style="width: 200px"
        />
      </ProListItem>

      <ProListItem
        description="同时显示的最大消息数量"
        title="最大消息数"
      >
        <InputNumber
          v-model:value="bubbleStore.maxMessages"
          :max="10"
          :min="1"
          style="width: 80px"
        />
      </ProListItem>
    </ProList>

    <!-- 样式设置 -->
    <ProList title="样式设置">
      <ProListItem
        description="气泡框的背景颜色"
        title="背景颜色"
      >
        <input
          v-model="bubbleStore.bubbleStyle.backgroundColor"
          style="width: 60px; height: 32px; border: 1px solid #d9d9d9; border-radius: 6px;"
          type="color"
        >
      </ProListItem>

      <ProListItem
        description="气泡框内文字的颜色"
        title="文字颜色"
      >
        <input
          v-model="bubbleStore.bubbleStyle.textColor"
          style="width: 60px; height: 32px; border: 1px solid #d9d9d9; border-radius: 6px;"
          type="color"
        >
      </ProListItem>

      <ProListItem
        description="气泡框的圆角程度"
        title="圆角大小"
      >
        <InputNumber
          v-model:value="bubbleStore.bubbleStyle.borderRadius"
          addon-after="px"
          :max="50"
          :min="0"
          style="width: 100px"
        />
      </ProListItem>

      <ProListItem
        description="气泡框内容的内边距"
        title="内边距"
      >
        <InputNumber
          v-model:value="bubbleStore.bubbleStyle.padding"
          addon-after="px"
          :max="30"
          :min="4"
          style="width: 100px"
        />
      </ProListItem>

      <ProListItem
        description="气泡框内文字的大小"
        title="字体大小"
      >
        <InputNumber
          v-model:value="bubbleStore.bubbleStyle.fontSize"
          addon-after="px"
          :max="24"
          :min="10"
          style="width: 100px"
        />
      </ProListItem>

      <ProListItem
        description="气泡框的透明度"
        title="透明度"
      >
        <Slider
          v-model:value="bubbleStore.bubbleStyle.opacity"
          :formatter="opacityFormatter"
          :max="100"
          :min="10"
          style="width: 200px"
        />
      </ProListItem>

      <ProListItem
        description="为气泡框添加阴影效果"
        title="阴影效果"
      >
        <Switch v-model:checked="bubbleStore.bubbleStyle.shadow" />
      </ProListItem>

      <ProListItem
        description="气泡框的最小宽度"
        title="最小宽度"
      >
        <InputNumber
          v-model:value="bubbleStore.bubbleStyle.minWidth"
          addon-after="px"
          :max="300"
          :min="80"
          style="width: 120px"
        />
      </ProListItem>

      <ProListItem
        description="气泡框的最大宽度"
        title="最大宽度"
      >
        <InputNumber
          v-model:value="bubbleStore.bubbleStyle.maxWidth"
          addon-after="px"
          :max="500"
          :min="150"
          style="width: 120px"
        />
      </ProListItem>
    </ProList>

    <!-- 动画设置 -->
    <ProList title="动画设置">
      <ProListItem
        description="开启气泡框的显示和隐藏动画"
        title="启用动画"
      >
        <Switch v-model:checked="bubbleStore.animation.enabled" />
      </ProListItem>

      <ProListItem
        description="选择气泡框的动画效果"
        :disabled="!bubbleStore.animation.enabled"
        title="动画类型"
      >
        <Select
          v-model:value="bubbleStore.animation.type"
          :options="animationOptions"
          style="width: 120px"
        />
      </ProListItem>

      <ProListItem
        description="动画播放的时间"
        :disabled="!bubbleStore.animation.enabled"
        title="动画时长"
      >
        <InputNumber
          v-model:value="bubbleStore.animation.duration"
          addon-after="ms"
          :max="1000"
          :min="100"
          :step="50"
          style="width: 120px"
        />
      </ProListItem>
    </ProList>

    <!-- 预设消息管理 -->
    <ProList title="预设消息管理">
      <ProListItem
        description="添加自定义的预设消息"
        title="添加新消息"
      >
        <div class="flex gap-2">
          <Input
            v-model:value="newPresetMessage"
            placeholder="输入新的预设消息..."
            style="width: 200px"
            @press-enter="addPresetMessage"
          />
          <Button
            type="primary"
            @click="addPresetMessage"
          >
            添加
          </Button>
        </div>
      </ProListItem>

      <ProListItem
        description="管理所有预设消息"
        title="预设消息列表"
      >
        <div class="max-h-48 overflow-y-auto space-y-2">
          <div
            v-for="(message, index) in bubbleStore.presetMessages"
            :key="index"
            class="flex items-center justify-between rounded bg-gray-50 p-2"
          >
            <span class="flex-1 text-sm">{{ message }}</span>
            <Button
              danger
              size="small"
              type="text"
              @click="removePresetMessage(index)"
            >
              删除
            </Button>
          </div>
        </div>
      </ProListItem>
    </ProList>

    <!-- 定时消息管理 -->
    <ProList title="定时消息管理">
      <ProListItem
        description="开启后，桌宠将按设定间隔自动显示消息"
        title="启用定时消息"
      >
        <Switch v-model:checked="autoMessageEnabled" />
      </ProListItem>

      <ProListItem
        description="添加自定义的定时消息"
        title="添加定时消息"
      >
        <div class="space-y-3">
          <div class="flex gap-2">
            <Input
              v-model:value="newTimedMessage.content"
              placeholder="输入定时消息内容..."
              style="width: 200px"
            />
            <Select
              v-model:value="newTimedMessage.type"
              :options="timedMessageTypeOptions"
              style="width: 80px"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm">间隔时间：</span>
            <InputNumber
              v-model:value="newTimedMessage.interval"
              addon-after="毫秒"
              :max="86400000"
              :min="60000"
              :step="60000"
              style="width: 140px"
            />
            <Button
              type="primary"
              @click="addTimedMessageToList"
            >
              添加
            </Button>
          </div>
        </div>
      </ProListItem>

      <ProListItem
        description="管理所有定时消息"
        title="定时消息列表"
      >
        <div class="max-h-48 overflow-y-auto space-y-2">
          <div
            v-for="message in timedMessages"
            :key="message.id"
            class="flex items-center justify-between rounded bg-gray-50 p-2"
          >
            <div class="flex-1">
              <div class="text-sm">
                {{ message.content }}
              </div>
              <div class="text-xs text-gray-500">
                {{ formatInterval(message.interval) }} · {{ message.type }}
                <Switch
                  v-model:checked="message.enabled"
                  class="ml-2"
                  size="small"
                />
              </div>
            </div>
            <Button
              danger
              size="small"
              type="text"
              @click="removeTimedMessage(message.id)"
            >
              删除
            </Button>
          </div>
        </div>
      </ProListItem>
    </ProList>

    <!-- 测试和操作 -->
    <ProList title="测试和操作">
      <ProListItem
        description="测试气泡框的显示效果"
        title="测试功能"
      >
        <div class="flex gap-2">
          <Button @click="testBubble">
            测试消息
          </Button>
          <Button @click="testAllTypes">
            测试所有类型
          </Button>
          <Button @click="bubbleStore.showRandomMessage()">
            随机消息
          </Button>
        </div>
      </ProListItem>

      <ProListItem
        description="清除当前显示的所有消息"
        title="清除消息"
      >
        <Button @click="clearAllMessages">
          清除所有消息
        </Button>
      </ProListItem>

      <ProListItem
        description="将所有设置恢复为默认值"
        title="重置设置"
      >
        <Button
          danger
          @click="resetToDefault"
        >
          重置为默认
        </Button>
      </ProListItem>
    </ProList>
  </div>
</template>

<style scoped>
.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-2 {
  gap: 0.5rem;
}

.flex-1 {
  flex: 1;
}

.text-sm {
  font-size: 0.875rem;
}

.p-2 {
  padding: 0.5rem;
}

.bg-gray-50 {
  background-color: #f9fafb;
}

.rounded {
  border-radius: 0.375rem;
}

.max-h-48 {
  max-height: 12rem;
}

.overflow-y-auto {
  overflow-y: auto;
}
</style>
