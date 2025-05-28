import { watch } from 'vue'

import { useBubbleStore } from '@/stores/bubble'

export type ReminderRepeatType = 'once' | 'daily' | 'weekly' | 'workdays' | 'weekends'

export interface ScheduledReminder {
  id: string
  content: string
  type: 'info' | 'success' | 'warning' | 'error'

  // 时间设置
  time: string // HH:mm 格式，如 "09:00"
  date?: string // YYYY-MM-DD 格式，仅对一次性提醒有效
  repeatType: ReminderRepeatType

  // 重复设置（针对每周重复）
  weekDays?: number[] // [1,2,3,4,5] 表示周一到周五，0=周日

  // 状态控制
  enabled: boolean
  lastTriggered?: number // 上次触发的时间戳
  nextTrigger?: number // 下次触发的时间戳（计算得出）
}

// 预设提醒模板
export const reminderTemplates: Omit<ScheduledReminder, 'id' | 'enabled' | 'lastTriggered' | 'nextTrigger'>[] = [
  {
    content: '新的一天开始了，加油工作！💪',
    type: 'info',
    time: '09:00',
    repeatType: 'workdays',
  },
  {
    content: '该休息一下，吃个午饭吧～🍽️',
    type: 'info',
    time: '12:00',
    repeatType: 'workdays',
  },
  {
    content: '辛苦了一天，记得按时下班哦！🌅',
    type: 'success',
    time: '18:00',
    repeatType: 'workdays',
  },
  {
    content: '记得多喝水保持身体健康！💧',
    type: 'info',
    time: '10:00',
    repeatType: 'daily',
  },
  {
    content: '已经工作很久了，站起来活动活动吧！🤸‍♀️',
    type: 'warning',
    time: '15:00',
    repeatType: 'workdays',
  },
]

export function useScheduledReminders() {
  const bubbleStore = useBubbleStore()

  let timer: number | null = null

  // 计算下次提醒时间
  function calculateNextTrigger(reminder: ScheduledReminder): number {
    const now = new Date()
    const [hours, minutes] = reminder.time.split(':').map(Number)

    switch (reminder.repeatType) {
      case 'once': {
        // 一次性提醒：返回指定日期时间
        if (!reminder.date) return 0
        const targetDate = new Date(`${reminder.date}T${reminder.time}:00`)
        return targetDate.getTime()
      }

      case 'daily': {
        // 每日提醒：如果今天时间已过，设置为明天
        const today = new Date(now)
        today.setHours(hours, minutes, 0, 0)

        if (today.getTime() > now.getTime()) {
          return today.getTime()
        } else {
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          return tomorrow.getTime()
        }
      }

      case 'workdays': {
        // 工作日提醒：查找下一个工作日
        return findNextWorkday(now, hours, minutes)
      }

      case 'weekends': {
        // 周末提醒：查找下一个周末
        return findNextWeekend(now, hours, minutes)
      }

      case 'weekly': {
        // 自定义每周：查找下一个指定星期几
        if (!reminder.weekDays || reminder.weekDays.length === 0) return 0
        return findNextWeekDay(now, reminder.weekDays, hours, minutes)
      }

      default:
        return 0
    }
  }

  // 查找下一个工作日
  function findNextWorkday(now: Date, hours: number, minutes: number): number {
    const target = new Date(now)
    target.setHours(hours, minutes, 0, 0)

    // 如果今天是工作日且时间还没到
    const currentDay = now.getDay()
    if (currentDay >= 1 && currentDay <= 5 && target.getTime() > now.getTime()) {
      return target.getTime()
    }

    // 寻找下一个工作日
    let daysToAdd = 1
    let nextDay = (currentDay + 1) % 7

    while (nextDay === 0 || nextDay === 6) { // 跳过周末
      daysToAdd++
      nextDay = (nextDay + 1) % 7
    }

    target.setDate(target.getDate() + daysToAdd)
    return target.getTime()
  }

  // 查找下一个周末
  function findNextWeekend(now: Date, hours: number, minutes: number): number {
    const target = new Date(now)
    target.setHours(hours, minutes, 0, 0)

    const currentDay = now.getDay()

    // 如果今天是周六且时间还没到
    if (currentDay === 6 && target.getTime() > now.getTime()) {
      return target.getTime()
    }

    // 如果今天是周日且时间还没到
    if (currentDay === 0 && target.getTime() > now.getTime()) {
      return target.getTime()
    }

    // 寻找下一个周六
    let daysToAdd = 6 - currentDay
    if (daysToAdd <= 0) daysToAdd += 7

    target.setDate(target.getDate() + daysToAdd)
    return target.getTime()
  }

  // 查找下一个指定星期几
  function findNextWeekDay(now: Date, weekDays: number[], hours: number, minutes: number): number {
    const target = new Date(now)
    target.setHours(hours, minutes, 0, 0)

    const currentDay = now.getDay()
    const sortedWeekDays = [...weekDays].sort((a, b) => a - b)

    // 检查今天是否在指定星期几中，且时间还没到
    if (sortedWeekDays.includes(currentDay) && target.getTime() > now.getTime()) {
      return target.getTime()
    }

    // 寻找下一个指定星期几
    for (let i = 1; i <= 7; i++) {
      const nextDay = (currentDay + i) % 7
      if (sortedWeekDays.includes(nextDay)) {
        target.setDate(target.getDate() + i)
        return target.getTime()
      }
    }

    return 0
  }

  // 格式化下次提醒时间显示
  function formatNextTrigger(reminder: ScheduledReminder): string {
    const nextTrigger = calculateNextTrigger(reminder)
    if (nextTrigger === 0) return '无效时间'

    const now = new Date()
    const targetDate = new Date(nextTrigger)
    const diffDays = Math.floor((targetDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

    if (diffDays === 0) {
      return `今天 ${reminder.time}`
    } else if (diffDays === 1) {
      return `明天 ${reminder.time}`
    } else if (diffDays < 7) {
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return `${weekDays[targetDate.getDay()]} ${reminder.time}`
    } else {
      return `${targetDate.getMonth() + 1}月${targetDate.getDate()}日 ${reminder.time}`
    }
  }

  // 检查定时提醒
  function checkScheduledReminders() {
    if (!bubbleStore.reminderEnabled || !bubbleStore.enabled) return

    const now = Date.now()

    bubbleStore.scheduledReminders.forEach((reminder) => {
      if (!reminder.enabled) return

      const nextTrigger = calculateNextTrigger(reminder)
      if (nextTrigger === 0) return

      // 允许1分钟的误差范围
      const timeDiff = now - nextTrigger
      if (timeDiff >= 0 && timeDiff < 60000) {
        // 检查是否在最近1分钟内已经触发过
        if (!reminder.lastTriggered || now - reminder.lastTriggered > 60000) {
          // 显示提醒消息
          bubbleStore.addMessage(reminder.content, reminder.type)

          // 添加调试信息
          if (reminder.content.includes('测试提醒')) {
            bubbleStore.addMessage(`调试：提醒已触发，时间差: ${timeDiff}ms`, 'info')
          }

          // 更新触发状态
          reminder.lastTriggered = now

          // 如果是一次性提醒，禁用它
          if (reminder.repeatType === 'once') {
            reminder.enabled = false
          }
        }
      }
    })
  }

  // 启动定时器
  function startTimer() {
    if (timer) {
      clearInterval(timer)
    }

    timer = setInterval(() => {
      checkScheduledReminders()
    }, 10000) as unknown as number // 每10秒检查一次，便于测试

    // 立即检查一次
    checkScheduledReminders()
  }

  // 停止定时器
  function stopTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  // 添加提醒
  function addScheduledReminder(reminder: Omit<ScheduledReminder, 'id' | 'lastTriggered' | 'nextTrigger'>) {
    const newReminder: ScheduledReminder = {
      ...reminder,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      lastTriggered: 0,
      nextTrigger: calculateNextTrigger(reminder as ScheduledReminder),
    }

    bubbleStore.scheduledReminders.push(newReminder)
    return newReminder.id
  }

  // 删除提醒
  function removeScheduledReminder(id: string) {
    const index = bubbleStore.scheduledReminders.findIndex(reminder => reminder.id === id)
    if (index > -1) {
      bubbleStore.scheduledReminders.splice(index, 1)
    }
  }

  // 更新提醒
  function updateScheduledReminder(id: string, updates: Partial<ScheduledReminder>) {
    const reminder = bubbleStore.scheduledReminders.find(r => r.id === id)
    if (reminder) {
      Object.assign(reminder, updates)
      reminder.nextTrigger = calculateNextTrigger(reminder)
    }
  }

  // 从模板添加提醒
  function addFromTemplate(template: typeof reminderTemplates[0]) {
    return addScheduledReminder({
      ...template,
      enabled: true,
    })
  }

  // 测试函数 - 添加一个1分钟后的提醒
  function addTestReminder() {
    const now = new Date()
    const testTime = new Date(now.getTime() + 60000) // 1分钟后
    const timeString = testTime.toTimeString().slice(0, 5) // HH:mm格式
    const dateString = testTime.toISOString().split('T')[0] // YYYY-MM-DD格式

    addScheduledReminder({
      content: '🎉 测试提醒！这是一个1分钟后的测试消息',
      type: 'info',
      time: timeString,
      date: dateString, // 添加日期字段
      repeatType: 'once',
      enabled: true,
    })

    return timeString
  }

  // 监听提醒开关状态
  watch(() => bubbleStore.reminderEnabled, (enabled) => {
    if (enabled) {
      startTimer()
    } else {
      stopTimer()
    }
  }, { immediate: true })

  // 监听气泡框开关状态
  watch(() => bubbleStore.enabled, (enabled) => {
    if (enabled && bubbleStore.reminderEnabled) {
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
    scheduledReminders: bubbleStore.scheduledReminders,
    reminderEnabled: bubbleStore.reminderEnabled,
    reminderTemplates,
    addScheduledReminder,
    removeScheduledReminder,
    updateScheduledReminder,
    addFromTemplate,
    formatNextTrigger,
    calculateNextTrigger,
    startTimer,
    stopTimer,
    cleanup,
    addTestReminder, // 暴露测试函数
  }
}
