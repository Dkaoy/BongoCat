<script setup lang="ts">
import type { ReminderRepeatType } from '@/composables/useScheduledReminders'

import { Button, Input, InputNumber, Select, Slider, Switch } from 'ant-design-vue'
import { ref } from 'vue'

import ProList from '@/components/pro-list/index.vue'
import ProListItem from '@/components/pro-list-item/index.vue'
import { useApiMessage } from '@/composables/useApiMessage'
import { useScheduledReminders } from '@/composables/useScheduledReminders'
import { useBubbleStore } from '@/stores/bubble'

const bubbleStore = useBubbleStore()

// 定时提醒功能
const {
  scheduledReminders,
  reminderEnabled,
  reminderTemplates,
  addScheduledReminder,
  removeScheduledReminder,
  updateScheduledReminder,
  addFromTemplate,
  formatNextTrigger,
  addTestReminder,
} = useScheduledReminders()

// API config comes directly from the bubble store
const apiConfig = bubbleStore.apiConfig

const newPresetMessage = ref('')

// 定时提醒相关状态
const newScheduledReminder = ref<{
  content: string
  type: 'info' | 'success' | 'warning' | 'error'
  time: string
  date: string
  repeatType: ReminderRepeatType
  weekDays: number[]
  enabled: boolean
}>({
  content: '',
  type: 'info',
  time: '09:00',
  date: '',
  repeatType: 'daily',
  weekDays: [],
  enabled: true,
})

// Header management
const newHeaderKey = ref('')
const newHeaderValue = ref('')
const isFetching = ref(false)

function formatLastFetchTime(timestamp: number) {
  if (!timestamp) return '从未'
  const date = new Date(timestamp)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

function addHeader() {
  if (newHeaderKey.value.trim()) {
    // Use Vue's reactivity system to update the headers object
    bubbleStore.apiConfig.headers = {
      ...bubbleStore.apiConfig.headers,
      [newHeaderKey.value.trim()]: newHeaderValue.value,
    }

    // Reset input fields
    newHeaderKey.value = ''
    newHeaderValue.value = ''
  }
}

function removeHeader(key: string) {
  const updatedHeaders = { ...bubbleStore.apiConfig.headers }
  delete updatedHeaders[key]
  bubbleStore.apiConfig.headers = updatedHeaders
}

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
  { label: '上方居中', value: 'above-center' },
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

  // 重置API设置
  bubbleStore.apiConfig.enabled = false
  bubbleStore.apiConfig.url = ''
  bubbleStore.apiConfig.interval = 300000
  bubbleStore.apiConfig.lastFetch = 0
  bubbleStore.apiConfig.messageType = 'info'
  bubbleStore.apiConfig.headers = {}
  bubbleStore.apiConfig.useCustomHeaders = false

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

// 定时提醒相关选项
const repeatTypeOptions = [
  { label: '一次性提醒', value: 'once' },
  { label: '每天', value: 'daily' },
  { label: '工作日', value: 'workdays' },
  { label: '周末', value: 'weekends' },
  { label: '自定义每周', value: 'weekly' },
]

const weekDayOptions = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 0 },
]

// 定时提醒相关函数
function addScheduledReminderToList() {
  if (newScheduledReminder.value.content.trim()) {
    addScheduledReminder({
      content: newScheduledReminder.value.content.trim(),
      type: newScheduledReminder.value.type,
      time: newScheduledReminder.value.time,
      date: newScheduledReminder.value.date || undefined,
      repeatType: newScheduledReminder.value.repeatType,
      weekDays: newScheduledReminder.value.weekDays.length > 0 ? newScheduledReminder.value.weekDays : undefined,
      enabled: newScheduledReminder.value.enabled,
    })

    // 重置表单
    newScheduledReminder.value = {
      content: '',
      type: 'info',
      time: '09:00',
      date: '',
      repeatType: 'daily',
      weekDays: [],
      enabled: true,
    }
  }
}

function getRepeatTypeLabel(repeatType: string, weekDays?: number[]) {
  switch (repeatType) {
    case 'once': return '一次性'
    case 'daily': return '每天'
    case 'workdays': return '工作日'
    case 'weekends': return '周末'
    case 'weekly': {
      if (!weekDays || weekDays.length === 0) return '自定义'
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return weekDays.map(day => dayNames[day]).join('、')
    }
    default: return '未知'
  }
}

async function fetchApiMessage() {
  if (!bubbleStore.apiConfig.url) {
    bubbleStore.showWarning('请先设置API地址')
    return
  }

  // 设置正在获取状态
  isFetching.value = true

  // 临时设置lastFetch为0，以确保能立即发送请求
  bubbleStore.apiConfig.lastFetch = 0

  try {
    bubbleStore.showInfo('正在获取API消息...')

    // 调用API请求
    const { fetchApiMessage: fetchMessage } = useApiMessage()
    await fetchMessage()

    // 更新最后获取时间以便显示
    bubbleStore.apiConfig.lastFetch = Date.now()
  } catch (error) {
    console.error('测试API消息失败:', error)
    bubbleStore.showError(`测试API消息失败: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    // 恢复取消获取状态
    isFetching.value = false
  }
}

// 缺失的选项和工具函数
const reminderTypeOptions = [
  { label: '信息', value: 'info' },
  { label: '成功', value: 'success' },
  { label: '警告', value: 'warning' },
  { label: '错误', value: 'error' },
]

function testReminder() {
  const timeString = addTestReminder()
  bubbleStore.showSuccess(`已添加测试提醒，将在${timeString}触发`)
}
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

    <!-- 定时提醒管理 -->
    <ProList title="定时提醒管理">
      <ProListItem
        description="开启后，桌宠将在指定时间自动显示提醒消息"
        title="启用定时提醒"
      >
        <Switch v-model:checked="reminderEnabled" />
      </ProListItem>

      <ProListItem
        description="从预设模板快速添加常用提醒，或测试提醒功能"
        title="预设提醒模板"
      >
        <div class="space-y-2">
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="template in reminderTemplates"
              :key="template.content"
              size="small"
              @click="addFromTemplate(template)"
            >
              {{ template.content.substring(0, 10) }}...
            </Button>
          </div>
          <div class="flex gap-2">
            <Button
              size="small"
              type="primary"
              @click="testReminder"
            >
              测试提醒 (1分钟后)
            </Button>
          </div>
        </div>
      </ProListItem>

      <ProListItem
        description="添加自定义的定时提醒"
        title="添加定时提醒"
      >
        <div class="space-y-3">
          <div class="flex gap-2">
            <Input
              v-model:value="newScheduledReminder.content"
              placeholder="输入提醒内容..."
              style="width: 200px"
            />
            <Select
              v-model:value="newScheduledReminder.type"
              :options="reminderTypeOptions"
              style="width: 80px"
            />
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm">提醒时间：</span>
            <Input
              v-model:value="newScheduledReminder.time"
              placeholder="HH:mm"
              style="width: 80px"
            />
            <span class="text-sm">重复模式：</span>
            <Select
              v-model:value="newScheduledReminder.repeatType"
              :options="repeatTypeOptions"
              style="width: 120px"
            />
          </div>

          <div
            v-if="newScheduledReminder.repeatType === 'once'"
            class="flex items-center gap-2"
          >
            <span class="text-sm">提醒日期：</span>
            <Input
              v-model:value="newScheduledReminder.date"
              placeholder="YYYY-MM-DD"
              style="width: 120px"
            />
          </div>

          <div
            v-if="newScheduledReminder.repeatType === 'weekly'"
            class="space-y-2"
          >
            <span class="text-sm">选择星期几：</span>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="option in weekDayOptions"
                :key="option.value"
                class="flex cursor-pointer items-center gap-1"
              >
                <input
                  v-model="newScheduledReminder.weekDays"
                  type="checkbox"
                  :value="option.value"
                >
                <span class="text-sm">{{ option.label }}</span>
              </label>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Button
              type="primary"
              @click="addScheduledReminderToList"
            >
              添加提醒
            </Button>
          </div>
        </div>
      </ProListItem>

      <ProListItem
        description="管理所有定时提醒"
        title="定时提醒列表"
      >
        <div class="max-h-48 overflow-y-auto space-y-2">
          <div
            v-for="reminder in scheduledReminders"
            :key="reminder.id"
            class="flex items-center justify-between rounded bg-gray-50 p-2"
          >
            <div class="flex-1">
              <div class="text-sm">
                {{ reminder.content }}
              </div>
              <div class="text-xs text-gray-500">
                {{ reminder.time }} · {{ getRepeatTypeLabel(reminder.repeatType, reminder.weekDays) }} · {{ reminder.type }}
                <br>
                <span class="text-blue-600">下次提醒: {{ formatNextTrigger(reminder) }}</span>
                <Switch
                  v-model:checked="reminder.enabled"
                  class="ml-2"
                  size="small"
                  @change="updateScheduledReminder(reminder.id, { enabled: reminder.enabled })"
                />
              </div>
            </div>
            <Button
              danger
              size="small"
              type="text"
              @click="removeScheduledReminder(reminder.id)"
            >
              删除
            </Button>
          </div>

          <div
            v-if="scheduledReminders.length === 0"
            class="py-4 text-center text-gray-500"
          >
            暂无定时提醒，请添加一些提醒
          </div>
        </div>
      </ProListItem>
    </ProList>

    <!-- API消息设置 -->
    <ProList title="API消息设置">
      <ProListItem
        description="开启后，桌宠将从外部API获取消息进行显示"
        title="启用API消息"
      >
        <Switch v-model:checked="apiConfig.enabled" />
      </ProListItem>

      <ProListItem
        description="设置获取消息的API地址"
        title="API地址"
      >
        <Input
          v-model:value="apiConfig.url"
          placeholder="请输入API地址..."
          style="width: 300px"
        />
      </ProListItem>

      <ProListItem
        description="设置获取消息的时间间隔"
        title="请求间隔"
      >
        <InputNumber
          v-model:value="apiConfig.interval"
          addon-after="毫秒"
          :max="3600000"
          :min="60000"
          :step="60000"
          style="width: 150px"
        />
      </ProListItem>

      <ProListItem
        description="设置API消息的类型"
        title="消息类型"
      >
        <Select
          v-model:value="apiConfig.messageType"
          :options="reminderTypeOptions"
          style="width: 100px"
        />
      </ProListItem>

      <ProListItem
        description="启用自定义请求头部（用于API密钥等）"
        title="自定义请求头"
      >
        <Switch v-model:checked="apiConfig.useCustomHeaders" />
      </ProListItem>

      <ProListItem
        v-if="apiConfig.useCustomHeaders"
        description="添加API请求头部（格式：Key: Value）"
        title="请求头设置"
      >
        <div class="space-y-3">
          <div
            v-for="(headerValue, headerKey) in apiConfig.headers"
            :key="headerKey"
            class="flex items-center gap-2"
          >
            <div class="w-[300px] flex overflow-hidden border rounded">
              <div class="flex items-center border-r bg-gray-100 px-2 py-1 text-sm">
                {{ headerKey }}
              </div>
              <input
                class="flex-1 px-2 py-1 outline-none"
                :value="headerValue"
                @input="(e) => { apiConfig.headers[headerKey] = (e.target as HTMLInputElement).value }"
              >
            </div>
            <Button
              danger
              size="small"
              @click="() => removeHeader(headerKey)"
            >
              删除
            </Button>
          </div>

          <div class="flex gap-2">
            <Input
              v-model:value="newHeaderKey"
              placeholder="Header Key"
              style="width: 140px"
            />
            <Input
              v-model:value="newHeaderValue"
              placeholder="Header Value"
              style="width: 160px"
            />
            <Button
              :disabled="!newHeaderKey"
              type="primary"
              @click="addHeader"
            >
              添加
            </Button>
          </div>
        </div>
      </ProListItem>

      <ProListItem
        description="API状态和上次获取信息"
        title="API状态"
      >
        <div class="flex items-center gap-2">
          <div
            v-if="isFetching"
            class="flex items-center text-sm text-blue-500"
          >
            <span class="i-solar:loading-bold mr-2 animate-spin" />
            正在获取消息...
          </div>
          <div
            v-else
            class="text-sm"
          >
            <span
              v-if="apiConfig.lastFetch > 0"
              class="text-gray-500"
            >
              上次更新: {{ formatLastFetchTime(apiConfig.lastFetch) }}
            </span>
            <span
              v-else
              class="text-gray-500"
            >尚未获取消息</span>
          </div>
        </div>
      </ProListItem>

      <ProListItem
        description="立即从API获取一条消息"
        title="测试API"
      >
        <Button
          :disabled="!apiConfig.url || isFetching"
          @click="fetchApiMessage"
        >
          获取消息
        </Button>
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
