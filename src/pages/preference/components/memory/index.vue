<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { Button, Progress, Statistic } from 'ant-design-vue'
import { onMounted, onUnmounted, ref } from 'vue'

import ProList from '@/components/pro-list/index.vue'
import ProListItem from '@/components/pro-list-item/index.vue'

interface MemoryStatus {
  current_mb: number
  limit_mb: number
  usage_percentage: number
  is_over_limit: boolean
}

const memoryStatus = ref<MemoryStatus>({
  current_mb: 0,
  limit_mb: 300,
  usage_percentage: 0,
  is_over_limit: false,
})

const loading = ref(false)
const cleanupLoading = ref(false)
const lastUpdateTime = ref<string>('')
let unlistenMemoryStatus: (() => void) | null = null
let unlistenMemoryWarning: (() => void) | null = null

// 获取内存状态
async function getMemoryStatus() {
  try {
    loading.value = true
    const status = await invoke<MemoryStatus>('get_memory_status')
    memoryStatus.value = status
    lastUpdateTime.value = new Date().toLocaleTimeString()
  } catch (error) {
    console.error('获取内存状态失败:', error)
  } finally {
    loading.value = false
  }
}

// 触发内存清理
async function triggerMemoryCleanup() {
  try {
    cleanupLoading.value = true
    await invoke<string>('trigger_memory_cleanup')
    // 清理后重新获取状态
    await getMemoryStatus()
  } catch (error) {
    console.error('内存清理失败:', error)
  } finally {
    cleanupLoading.value = false
  }
}

// 获取进度条颜色
function getProgressColor(percentage: number) {
  if (percentage >= 90) return '#ff4d4f' // 红色
  if (percentage >= 70) return '#faad14' // 橙色
  return '#52c41a' // 绿色
}

// 获取状态文本
function getStatusText(status: MemoryStatus) {
  if (status.is_over_limit) {
    return '内存使用超限'
  }
  if (status.usage_percentage >= 80) {
    return '内存使用较高'
  }
  if (status.usage_percentage >= 50) {
    return '内存使用正常'
  }
  return '内存使用良好'
}

// 获取状态颜色
function getStatusColor(status: MemoryStatus) {
  if (status.is_over_limit) return '#ff4d4f'
  if (status.usage_percentage >= 80) return '#faad14'
  return '#52c41a'
}

onMounted(async () => {
  // 初始获取内存状态
  await getMemoryStatus()

  // 监听内存状态更新事件
  unlistenMemoryStatus = await listen<MemoryStatus>('memory-status', (event) => {
    memoryStatus.value = event.payload
    lastUpdateTime.value = new Date().toLocaleTimeString()
  })

  // 监听内存警告事件
  unlistenMemoryWarning = await listen<MemoryStatus>('memory-warning', (event) => {
    console.warn('内存使用警告:', event.payload)
    // 可以在这里添加通知或其他处理逻辑
  })
})

onUnmounted(() => {
  // 清理事件监听器
  if (unlistenMemoryStatus) {
    unlistenMemoryStatus()
  }
  if (unlistenMemoryWarning) {
    unlistenMemoryWarning()
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- 内存监控 -->
    <ProList title="内存监控">
      <ProListItem
        description="当前应用的内存使用情况"
        title="内存状态"
      >
        <div class="memory-status-container">
          <div class="memory-stats">
            <Statistic
              suffix="MB"
              title="当前使用"
              :value="memoryStatus.current_mb"
              :value-style="{ color: getStatusColor(memoryStatus) }"
            />
            <Statistic
              suffix="MB"
              title="限制"
              :value="memoryStatus.limit_mb"
            />
          </div>

          <div class="memory-progress">
            <Progress
              :percent="Math.round(memoryStatus.usage_percentage)"
              :status="memoryStatus.is_over_limit ? 'exception' : 'normal'"
              :stroke-color="getProgressColor(memoryStatus.usage_percentage)"
            />
            <div
              class="status-text"
              :style="{ color: getStatusColor(memoryStatus) }"
            >
              {{ getStatusText(memoryStatus) }}
            </div>
          </div>
        </div>
      </ProListItem>

      <ProListItem
        description="手动刷新内存使用情况"
        title="刷新状态"
      >
        <Button
          :loading="loading"
          @click="getMemoryStatus"
        >
          刷新
        </Button>
      </ProListItem>

      <ProListItem
        description="尝试释放未使用的内存"
        title="内存清理"
      >
        <Button
          :loading="cleanupLoading"
          type="primary"
          @click="triggerMemoryCleanup"
        >
          清理内存
        </Button>
      </ProListItem>

      <ProListItem
        v-if="lastUpdateTime"
        description="最后更新时间"
        title="更新时间"
      >
        <span class="text-gray-500">{{ lastUpdateTime }}</span>
      </ProListItem>
    </ProList>

    <!-- 内存限制说明 -->
    <ProList title="说明">
      <ProListItem
        description="应用内存使用限制为300MB，超过此限制时会发出警告"
        title="内存限制"
      >
        <span class="text-orange-500 font-medium">300 MB</span>
      </ProListItem>

      <ProListItem
        description="系统会每10秒自动检查一次内存使用情况"
        title="监控频率"
      >
        <span class="text-blue-500 font-medium">10 秒</span>
      </ProListItem>

      <ProListItem
        description="当内存使用超过限制时，会在控制台输出警告信息"
        title="警告机制"
      >
        <span class="text-red-500 font-medium">自动警告</span>
      </ProListItem>
    </ProList>
  </div>
</template>

<style scoped>
.memory-status-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 300px;
}

.memory-stats {
  display: flex;
  gap: 24px;
}

.memory-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-text {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.text-gray-500 {
  color: #6b7280;
}

.text-orange-500 {
  color: #f97316;
}

.text-blue-500 {
  color: #3b82f6;
}

.text-red-500 {
  color: #ef4444;
}

.font-medium {
  font-weight: 500;
}
</style>
