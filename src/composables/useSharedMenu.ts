import { CheckMenuItem, MenuItem, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu'
import { range } from 'es-toolkit'

import { useScheduledReminders } from '@/composables/useScheduledReminders'
import { hideWindow, showWindow } from '@/plugins/window'
import { useBubbleStore } from '@/stores/bubble'
import { useCatStore } from '@/stores/cat'
import { isMac } from '@/utils/platform'

export function useSharedMenu() {
  const catStore = useCatStore()
  const bubbleStore = useBubbleStore()

  const getScaleMenuItems = async () => {
    const options = range(50, 151, 25)

    const items = options.map((item) => {
      return CheckMenuItem.new({
        text: item === 100 ? '默认' : `${item}%`,
        checked: catStore.scale === item,
        action: () => {
          catStore.scale = item
        },
      })
    })

    if (!options.includes(catStore.scale)) {
      items.unshift(CheckMenuItem.new({
        text: `${catStore.scale}%`,
        checked: true,
        enabled: false,
      }))
    }

    return Promise.all(items)
  }

  const getOpacityMenuItems = async () => {
    const options = range(25, 101, 25)

    const items = options.map((item) => {
      return CheckMenuItem.new({
        text: `${item}%`,
        checked: catStore.opacity === item,
        action: () => {
          catStore.opacity = item
        },
      })
    })

    if (!options.includes(catStore.opacity)) {
      items.unshift(CheckMenuItem.new({
        text: `${catStore.opacity}%`,
        checked: true,
        enabled: false,
      }))
    }

    return Promise.all(items)
  }

  const getSharedMenu = async () => {
    return await Promise.all([
      MenuItem.new({
        text: '偏好设置...',
        accelerator: isMac ? 'Cmd+,' : '',
        action: () => showWindow('preference'),
      }),
      MenuItem.new({
        text: catStore.visible ? '隐藏猫咪' : '显示猫咪',
        action: () => {
          if (catStore.visible) {
            hideWindow('main')
          } else {
            showWindow('main')
          }

          catStore.visible = !catStore.visible
        },
      }),
      PredefinedMenuItem.new({ item: 'Separator' }),
      CheckMenuItem.new({
        text: '窗口穿透',
        checked: catStore.penetrable,
        action: () => {
          catStore.penetrable = !catStore.penetrable
        },
      }),
      Submenu.new({
        text: '窗口尺寸',
        items: await getScaleMenuItems(),
      }),
      Submenu.new({
        text: '不透明度',
        items: await getOpacityMenuItems(),
      }),
      PredefinedMenuItem.new({ item: 'Separator' }),
      CheckMenuItem.new({
        text: '启用气泡框',
        checked: bubbleStore.enabled,
        action: () => {
          bubbleStore.enabled = !bubbleStore.enabled
        },
      }),
      MenuItem.new({
        text: '显示随机消息',
        action: () => {
          bubbleStore.showRandomMessage()
        },
      }),
      Submenu.new({
        text: '快捷消息',
        items: await Promise.all(
          bubbleStore.presetMessages.length > 0
            ? bubbleStore.presetMessages.slice(0, 8).map(message =>
                MenuItem.new({
                  text: message.length > 20 ? `${message.substring(0, 17)}...` : message,
                  action: () => bubbleStore.showInfo(message),
                }),
              )
            : [
                MenuItem.new({
                  text: '暂无预设消息',
                  enabled: false,
                  action: () => {},
                }),
                MenuItem.new({
                  text: '前往设置添加',
                  action: () => showWindow('preference'),
                }),
              ],
        ),
      }),
      Submenu.new({
        text: '定时提醒',
        items: await Promise.all([
          CheckMenuItem.new({
            text: '启用定时提醒',
            checked: bubbleStore.reminderEnabled,
            action: () => {
              bubbleStore.reminderEnabled = !bubbleStore.reminderEnabled
            },
          }),
          PredefinedMenuItem.new({ item: 'Separator' }),
          MenuItem.new({
            text: '添加工作提醒',
            action: () => {
              // 快速添加工作日9点提醒
              const { addScheduledReminder } = useScheduledReminders()
              addScheduledReminder({
                content: '新的一天开始了，加油工作！💪',
                type: 'info',
                time: '09:00',
                repeatType: 'workdays',
                enabled: true,
              })
              bubbleStore.showSuccess('工作提醒已添加')
            },
          }),
          MenuItem.new({
            text: '添加休息提醒',
            action: () => {
              // 快速添加每天下午3点休息提醒
              const { addScheduledReminder } = useScheduledReminders()
              addScheduledReminder({
                content: '该休息一下，放松放松吧～☕',
                type: 'warning',
                time: '15:00',
                repeatType: 'daily',
                enabled: true,
              })
              bubbleStore.showSuccess('休息提醒已添加')
            },
          }),
          MenuItem.new({
            text: '管理提醒设置',
            action: () => showWindow('preference'),
          }),
        ]),
      }),
    ])
  }

  return {
    getSharedMenu,
  }
}
