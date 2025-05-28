<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { Button, message, Select, Space, Switch } from 'ant-design-vue'
import { onMounted, ref, watch } from 'vue'

import ProList from '@/components/pro-list/index.vue'
import ProListItem from '@/components/pro-list-item/index.vue'
import { useDisplayStore } from '@/stores/display'

interface MonitorInfo {
  index: number
  name: string
  width: number
  height: number
  x: number
  y: number
}

const displayStore = useDisplayStore()
const monitors = ref<MonitorInfo[]>([])
const loading = ref(false)

// 获取可用显示器列表
async function getMonitors() {
  try {
    const monitorList = await invoke<MonitorInfo[]>('get_available_monitors')
    monitors.value = monitorList
    message.success('显示器列表已更新')
  } catch (error) {
    console.error('获取显示器列表失败:', error)
    message.error('获取显示器列表失败')
  }
}

// 创建新的窗口实例
async function createWindowInstance(monitorIndex: number) {
  loading.value = true
  try {
    const windowId = await invoke<string>('create_window_on_monitor', { monitorIndex })
    displayStore.addWindowInstance(windowId)
    message.success(`在显示器 ${monitorIndex + 1} 上创建窗口成功`)
  } catch (error) {
    console.error('创建窗口失败:', error)
    message.error('创建窗口失败')
  } finally {
    loading.value = false
  }
}

// 重置所有窗口位置
async function resetWindowPositions() {
  loading.value = true
  try {
    await invoke('reset_window_positions')
    displayStore.clearWindowInstances()
    message.success('窗口位置已重置')
  } catch (error) {
    console.error('重置窗口位置失败:', error)
    message.error('重置窗口位置失败')
  } finally {
    loading.value = false
  }
}

// 监听多屏显示设置变化
watch(() => displayStore.multiScreenEnabled, async (enabled) => {
  // 不管是开启还是关闭，先重置所有窗口状态
  await resetWindowPositions()
  displayStore.clearWindowInstances()

  if (enabled) {
    // 确保状态被正确重置
    displayStore.mainWindowOnPrimaryMonitor = false

    // 如果开启多屏，先确保主显示器有窗口
    if (displayStore.primaryMonitor !== null) {
      try {
        await createWindowInstance(displayStore.primaryMonitor)
        displayStore.mainWindowOnPrimaryMonitor = true
        message.success('主显示器窗口已创建')
      } catch (error) {
        console.error('创建主显示器窗口失败:', error)
        message.error('创建主显示器窗口失败，请重试')
      }
    }

    // 如果有配置副显示器，也创建一个窗口
    if (displayStore.secondaryMonitor !== null) {
      try {
        await createWindowInstance(displayStore.secondaryMonitor)
        message.success('副显示器窗口已创建')
      } catch (error) {
        console.error('创建副显示器窗口失败:', error)
        message.error('创建副显示器窗口失败，请重试')
      }
    }
  } else {
    // 关闭多屏显示时，确保主窗口在主显示器上且状态被正确重置
    displayStore.mainWindowOnPrimaryMonitor = false
    message.success('多屏显示已关闭，所有窗口已重置')
  }
})

// 监听主显示器变化
watch(() => displayStore.primaryMonitor, async (monitorIndex) => {
  if (displayStore.multiScreenEnabled && monitorIndex !== null) {
    // 先重置窗口位置，确保状态一致
    await resetWindowPositions()
    displayStore.clearWindowInstances()
    displayStore.mainWindowOnPrimaryMonitor = false

    try {
      // 在主显示器上创建窗口
      await createWindowInstance(monitorIndex)
      displayStore.mainWindowOnPrimaryMonitor = true

      // 如果有副显示器设置，也创建窗口
      if (displayStore.secondaryMonitor !== null) {
        await createWindowInstance(displayStore.secondaryMonitor)
      }
    } catch (error) {
      console.error('切换主显示器失败:', error)
      message.error('切换主显示器失败，请重试')
    }
  }
})

// 监听副显示器变化
watch(() => displayStore.secondaryMonitor, async (monitorIndex, oldIndex) => {
  if (displayStore.multiScreenEnabled) {
    if (monitorIndex !== null) {
      try {
        // 只创建副显示器的新窗口，不影响主窗口
        await createWindowInstance(monitorIndex)
      } catch (error) {
        console.error('创建副显示器窗口失败:', error)
        message.error('创建副显示器窗口失败，请重试')
      }
    } else if (oldIndex !== null) {
      // 如果用户清除了副显示器设置，重置所有窗口并重新创建主窗口
      await resetWindowPositions()
      displayStore.clearWindowInstances()
      displayStore.mainWindowOnPrimaryMonitor = false

      // 如果主显示器设置有效，重新创建主显示器的窗口
      if (displayStore.primaryMonitor !== null) {
        try {
          await createWindowInstance(displayStore.primaryMonitor)
          displayStore.mainWindowOnPrimaryMonitor = true
        } catch (error) {
          console.error('重新创建主显示器窗口失败:', error)
          message.error('重新创建主显示器窗口失败')
        }
      }
    }
  }
})

onMounted(async () => {
  await getMonitors()

  // 如果是已启用多屏显示的情况，确保窗口状态正确
  if (displayStore.multiScreenEnabled) {
    // 先重置所有窗口，确保状态一致
    await resetWindowPositions()
    displayStore.clearWindowInstances()

    // 确保主窗口在主显示器上
    if (displayStore.primaryMonitor !== null) {
      try {
        await createWindowInstance(displayStore.primaryMonitor)
        displayStore.mainWindowOnPrimaryMonitor = true
        message.success('主显示器窗口已创建')
      } catch (error) {
        console.error('创建主显示器窗口失败:', error)
        message.error('创建主显示器窗口失败')
      }

      // 如果有设置副显示器，也创建窗口
      if (displayStore.secondaryMonitor !== null) {
        try {
          await createWindowInstance(displayStore.secondaryMonitor)
          message.success('副显示器窗口已创建')
        } catch (error) {
          console.error('创建副显示器窗口失败:', error)
          message.error('创建副显示器窗口失败')
        }
      }
    }
  }
})
</script>

<template>
  <ProList title="多屏显示设置">
    <ProListItem title="启用多屏显示">
      <Switch v-model:checked="displayStore.multiScreenEnabled" />
    </ProListItem>

    <ProListItem
      v-if="displayStore.multiScreenEnabled"
      description="选择主要显示的屏幕"
      title="主显示器"
    >
      <Select
        v-model:value="displayStore.primaryMonitor"
        :options="monitors.map(m => ({ label: `${m.name} (${m.width}x${m.height})`, value: m.index }))"
        placeholder="选择显示器"
        style="width: 250px"
      />
    </ProListItem>

    <ProListItem
      v-if="displayStore.multiScreenEnabled"
      description="选择副显示的屏幕（可选）"
      title="副显示器"
    >
      <Select
        v-model:value="displayStore.secondaryMonitor"
        allow-clear
        :options="monitors.map(m => ({ label: `${m.name} (${m.width}x${m.height})`, value: m.index }))"
        placeholder="选择显示器"
        style="width: 250px"
      />
    </ProListItem>

    <ProListItem title="窗口管理">
      <Space>
        <Button
          :loading="loading"
          size="small"
          @click="resetWindowPositions"
        >
          重置窗口位置
        </Button>
        <Button
          size="small"
          @click="getMonitors"
        >
          刷新显示器列表
        </Button>
      </Space>
    </ProListItem>
  </ProList>

  <ProList title="显示选项">
    <ProListItem title="跟随鼠标显示">
      <Switch v-model:checked="displayStore.followCursor" />
    </ProListItem>

    <ProListItem title="所有屏幕显示">
      <Switch v-model:checked="displayStore.showOnAllScreens" />
    </ProListItem>
  </ProList>
</template>
