<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { availableMonitors } from '@tauri-apps/api/window'
import { Button, message, Select, Space, Switch } from 'ant-design-vue'
import { computed, onMounted, ref, watch } from 'vue'

import ProList from '@/components/pro-list/index.vue'
import ProListItem from '@/components/pro-list-item/index.vue'
import { useDisplayStore } from '@/stores/display'

interface Monitor {
  name: string
  width: number
  height: number
  index: number
}

const displayStore = useDisplayStore()
const monitors = ref<Monitor[]>([])
const loading = ref(false)
const currentMonitorIndex = ref<number | null>(null)

// 计算副屏幕可选项（排除主屏幕）
const secondaryMonitorOptions = computed(() => {
  return monitors.value.filter(m => m.index !== displayStore.primaryMonitor)
    .map(m => ({ label: `${m.name} (${m.width}x${m.height})`, value: m.index }))
})

// 获取当前窗口所在的显示器索引
async function getCurrentMonitorIndex(): Promise<number> {
  try {
    const appWindow = getCurrentWebviewWindow()
    const position = await appWindow.outerPosition()
    const monitors = await availableMonitors()

    // 查找包含当前窗口位置的显示器
    for (let i = 0; i < monitors.length; i++) {
      const monitor = monitors[i]
      const { position: monitorPos, size: monitorSize } = monitor

      const inBoundsX = position.x >= monitorPos.x && position.x < monitorPos.x + monitorSize.width
      const inBoundsY = position.y >= monitorPos.y && position.y < monitorPos.y + monitorSize.height

      if (inBoundsX && inBoundsY) {
        return i
      }
    }

    // 如果没找到，默认返回主显示器（索引0）
    return 0
  } catch (error) {
    console.error('获取当前显示器失败:', error)
    return 0
  }
}

// 获取可用显示器列表
async function getMonitors() {
  try {
    const monitorList = await invoke<Monitor[]>('get_available_monitors')
    monitors.value = monitorList

    // 获取当前窗口所在的显示器
    currentMonitorIndex.value = await getCurrentMonitorIndex()

    // 如果还没有设置主显示器，或者多屏显示刚启用，设置为当前显示器
    if (displayStore.primaryMonitor === null
      || (displayStore.multiScreenEnabled && displayStore.primaryMonitor !== currentMonitorIndex.value)) {
      displayStore.primaryMonitor = currentMonitorIndex.value
      // 主显示器已设置为当前显示器
    }

    // 获取到显示器列表和当前窗口位置
  } catch (error) {
    console.error('获取显示器列表失败:', error)
    message.error('获取显示器列表失败')
  }
}

// 创建新的窗口实例
async function createWindowInstance(monitorIndex: number, isPrimary = false) {
  loading.value = true
  try {
    const windowId = await invoke<string>('create_window_on_monitor', {
      monitorIndex,
      isPrimary,
    })
    displayStore.addWindowInstance(windowId)
    const _displayType = isPrimary ? '主' : '副'
    // 在显示器上创建窗口成功
  } catch (error) {
    console.error('创建窗口失败:', error)
    const displayType = isPrimary ? '主' : '副'
    message.error(`创建${displayType}显示器窗口失败`)
  } finally {
    loading.value = false
  }
}

// 关闭指定显示器上的窗口
async function closeWindowOnMonitor(monitorIndex: number) {
  try {
    await invoke('close_window_on_monitor', { monitorIndex })
    // 已关闭显示器上的窗口
  } catch (error) {
    console.error('关闭窗口失败:', error)
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
  if (enabled) {
    // 启用多屏显示

    // 获取当前窗口所在的显示器并设置为主显示器
    const currentMonitor = await getCurrentMonitorIndex()
    displayStore.primaryMonitor = currentMonitor
    displayStore.mainWindowOnPrimaryMonitor = false

    // 清空副显示器设置（如果之前设置的副显示器和主显示器相同）
    if (displayStore.secondaryMonitor === currentMonitor) {
      displayStore.secondaryMonitor = null
    }

    // 将现有主窗口移动到主显示器，而不是创建新窗口
    try {
      await invoke('move_main_window_to_monitor', { monitorIndex: displayStore.primaryMonitor })
      displayStore.mainWindowOnPrimaryMonitor = true
      message.success(`多屏显示已启用，主屏幕设置为显示器 ${currentMonitor + 1}`)
    } catch (error) {
      console.error('移动主窗口失败:', error)
      message.error('启用多屏显示失败')
    }

    // 如果有配置副显示器，也创建窗口
    if (displayStore.secondaryMonitor !== null) {
      try {
        await createWindowInstance(displayStore.secondaryMonitor, false)
      } catch (error) {
        console.error('创建副显示器窗口失败:', error)
      }
    }
  } else {
    // 关闭多屏显示
    // 关闭多屏显示时，重置所有窗口
    await resetWindowPositions()
    displayStore.clearWindowInstances()
    displayStore.mainWindowOnPrimaryMonitor = false
    message.success('多屏显示已关闭')
  }
})

// 主显示器现在由系统自动设置，不再监听手动变化

// 监听副显示器变化
watch(() => displayStore.secondaryMonitor, async (monitorIndex, oldIndex) => {
  if (displayStore.multiScreenEnabled) {
    // 验证不能选择主显示器
    if (monitorIndex !== null && monitorIndex === displayStore.primaryMonitor) {
      message.error('副显示器不能选择主显示器')
      displayStore.secondaryMonitor = oldIndex // 恢复之前的选择
      return
    }

    // 如果有旧的副显示器，先关闭它
    if (oldIndex !== null && oldIndex !== monitorIndex) {
      await closeWindowOnMonitor(oldIndex)
    }

    if (monitorIndex !== null) {
      try {
        // 创建新的副显示器窗口
        await createWindowInstance(monitorIndex, false)
        // 副显示器已设置
      } catch (error) {
        console.error('创建副显示器窗口失败:', error)
        message.error('创建副显示器窗口失败')
      }
    }
  }
})

onMounted(async () => {
  await getMonitors()

  // 如果是已启用多屏显示的情况，确保窗口状态正确
  if (displayStore.multiScreenEnabled) {
    // 获取当前窗口所在的显示器并设置为主显示器
    const currentMonitor = await getCurrentMonitorIndex()
    const oldPrimaryMonitor = displayStore.primaryMonitor
    displayStore.primaryMonitor = currentMonitor

    // 如果主显示器发生了变化，需要重新创建窗口
    if (oldPrimaryMonitor !== currentMonitor) {
      // 主显示器已更新

      // 先重置所有窗口，确保状态一致
      await resetWindowPositions()
      displayStore.clearWindowInstances()

      // 如果副显示器和新的主显示器相同，清空副显示器设置
      if (displayStore.secondaryMonitor === currentMonitor) {
        displayStore.secondaryMonitor = null
      }
    }

    // 将现有主窗口移动到当前显示器上，而不是创建新窗口
    try {
      await invoke('move_main_window_to_monitor', { monitorIndex: displayStore.primaryMonitor })
      displayStore.mainWindowOnPrimaryMonitor = true
      // 主窗口已移动到当前显示器
    } catch (error) {
      console.error('移动主窗口失败:', error)
    }

    // 如果有设置副显示器，也创建窗口
    if (displayStore.secondaryMonitor !== null && displayStore.secondaryMonitor !== displayStore.primaryMonitor) {
      try {
        await createWindowInstance(displayStore.secondaryMonitor, false)
        // 副显示器窗口已创建
      } catch (error) {
        console.error('创建副显示器窗口失败:', error)
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
      description="当前小猫所在的屏幕（自动设置，不可修改）"
      title="主显示器"
    >
      <Select
        v-model:value="displayStore.primaryMonitor"
        disabled
        :options="monitors.map(m => ({ label: `${m.name} (${m.width}x${m.height})`, value: m.index }))"
        placeholder="自动检测"
        style="width: 250px"
      />
    </ProListItem>

    <ProListItem
      v-if="displayStore.multiScreenEnabled"
      description="选择副显示的屏幕（可选，不能选择主屏幕）"
      title="副显示器"
    >
      <Select
        v-model:value="displayStore.secondaryMonitor"
        allow-clear
        :options="secondaryMonitorOptions"
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
