import { CheckMenuItem, MenuItem, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu'
import { range } from 'es-toolkit'

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
        items: await Promise.all([
          MenuItem.new({
            text: '你好！',
            action: () => bubbleStore.showInfo('你好！'),
          }),
          MenuItem.new({
            text: '今天天气真不错～',
            action: () => bubbleStore.showInfo('今天天气真不错～'),
          }),
          MenuItem.new({
            text: '要一起玩游戏吗？',
            action: () => bubbleStore.showInfo('要一起玩游戏吗？'),
          }),
          MenuItem.new({
            text: '记得按时休息哦！',
            action: () => bubbleStore.showWarning('记得按时休息哦！'),
          }),
        ]),
      }),
    ])
  }

  return {
    getSharedMenu,
  }
}
