<script setup lang="ts">
import { emit } from '@tauri-apps/api/event'
import { appLogDir } from '@tauri-apps/api/path'
import { openPath } from '@tauri-apps/plugin-opener'
import { Button } from 'ant-design-vue'
import { onMounted, ref } from 'vue'

import ProList from '@/components/pro-list/index.vue'
import ProListItem from '@/components/pro-list-item/index.vue'
import { GITHUB_LINK, LISTEN_KEY, ORIGINAL_GITHUB_LINK } from '@/constants'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const logDir = ref('')

onMounted(async () => {
  logDir.value = await appLogDir()
})

function handleUpdate() {
  emit(LISTEN_KEY.UPDATE_APP)
}
</script>

<template>
  <ProList title="关于软件">
    <ProListItem
      :description="`版本：v${appStore.version}`"
      :title="appStore.name"
    >
      <Button
        type="primary"
        @click="handleUpdate"
      >
        检查更新
      </Button>

      <template #icon>
        <div class="b b-color-2 rounded-xl b-solid">
          <img
            class="size-12"
            src="/logo.png"
          >
        </div>
      </template>
    </ProListItem>

    <ProListItem title="开源地址">
      <template #description>
        <a :href="GITHUB_LINK">
          {{ GITHUB_LINK }}
        </a>
        <div class="mt-1 text-sm text-gray-500">
          原作者地址：<a :href="ORIGINAL_GITHUB_LINK">{{ ORIGINAL_GITHUB_LINK }}</a>
        </div>
      </template>
    </ProListItem>

    <ProListItem
      :description="logDir"
      title="软件日志"
    >
      <Button @click="openPath(logDir)">
        查看日志
      </Button>
    </ProListItem>
  </ProList>
</template>
