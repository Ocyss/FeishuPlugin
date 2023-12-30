<route lang="yaml">
name: AutoRun
meta:
  title: AutoRun
  desc: AutoRun allows automatic execution of specified operations on records, offering powerful configuration capabilities that aggregate the functionalities of all plugins for automatic operations on new records.
  help:
  group:
  tags:
    - Develop
  avatar: R
</route>

<script setup lang="ts">
import DateOperations from '../DateOperations/index.vue'
import FieldExtraction from '../FieldExtraction/index.vue'
import { useStore } from '@/hooks/useStore'
import { useData } from '@/hooks/useData'
import formTags from '@/components/forms/form-tags.vue'

const {
  fieldName,
  getTable,
  layout,
  message,
  t,
  tableId,
  tableMetaList,
  viewId,
  viewMetaList,
} = useData()
const { store } = useStore()

enum ActionType {
  DateOperations = 'Date/Time Tools',
  FieldExtraction = 'Field Extractor',
  IDcardWithdrawal = 'ID Info Extractor',
  Phonearea = 'Phone Location Lookup',
  UrlToImg = 'Web to Attachment',
  ChineseToNumber = 'Code Scanner',
  QRCodeParser = 'chineseToNumber',
}
interface autoRun {
  title: string
  autorun: boolean
  stat: 'run' | 'stop' | 'error'
  count: number
  total: number
  lastRunAt: Date
  createAt: Date
  action: { id: number, action: ActionType, conf: any, weights: number }[]
  desc: string
}

const modelData = reactive<autoRun>({
  action: [],
  autorun: true,
  count: 0,
  createAt: new Date(),
  desc: '',
  lastRunAt: new Date(),
  stat: 'stop',
  title: '',
  total: 0,
})

const actionShowModal = ref(false)
const taskShowModal = ref(false)
const action = ref(null)
const actionOptions = [
  { id: ActionType.DateOperations, name: t('Date/Time Tools') },
  { id: ActionType.FieldExtraction, name: t('Field Extractor') },
  { id: ActionType.IDcardWithdrawal, disabled: true, name: t('ID Info Extractor') },
  { id: ActionType.Phonearea, disabled: true, name: t('Phone Location Lookup') },
  { id: ActionType.UrlToImg, disabled: true, name: t('Web to Attachment') },
  { id: ActionType.ChineseToNumber, disabled: true, name: t('Code Scanner') },
  { id: ActionType.QRCodeParser, disabled: true, name: t('chineseToNumber') },
]

const storeData = store<Record<string, autoRun>>('datas', {})

function tableName(id: string) {
  return tableMetaList.value.find(item => item.id === id)?.name
}

function save(type: ActionType, v: any) {
  modelData.action.push({ id: Date.now(), action: type, conf: v, weights: 200 })
  actionShowModal.value = false
  message.info('保存成功')
}

onMounted(() => {
  getTable()
})
</script>

<template>
  <Layout ref="layout">
    <n-blockquote style="margin-bottom: 15px">
      <div style="margin-bottom: 8px">
        支持:
      </div>
      <n-space>
        <n-tag :bordered="false">
          {{ t('Date/Time Tools') }}
        </n-tag>
        <n-tag :bordered="false">
          {{ t('Field Extractor') }}
        </n-tag>
        <n-tag :bordered="false">
          {{ t('ID Info Extractor') }}
        </n-tag>
        <n-tag :bordered="false">
          {{ t('Phone Location Lookup') }}
        </n-tag>
        <n-tag :bordered="false">
          {{ t('Web to Attachment') }}
        </n-tag>
        <n-tag :bordered="false">
          {{ t('Code Scanner') }}
        </n-tag>
        <n-tag :bordered="false">
          {{ t('chineseToNumber') }}
        </n-tag>
      </n-space>
    </n-blockquote>

    <n-modal
      v-model:show="taskShowModal"
      transform-origin="center"
      preset="dialog"
      title="创建自动化任务"
      positive-text="添加"
      negative-text="取消"
      style="width: 100vw;height: 100vh;max-width: 100vw;--n-padding:10px"
      @positive-click="() => { storeData[tableId!] = toRaw(modelData);message.success('任务添加成功') }"
    >
      <n-scrollbar class="content" style="height: 87vh">
        <n-space justify="space-between">
          <form-tags v-model:value="tableId" :msg="t('Table')" :tags="tableMetaList" />
          <form-tags v-model:value="viewId" :msg="t('View')" :tags="viewMetaList" />
        </n-space>
        <n-modal
          v-model:show="actionShowModal"
          transform-origin="center"
          preset="dialog"
          title="创建动作"
          style="width: 90vw;min-height: 40vh;max-width: 90vw;--n-padding:10px"
        >
          <form-select v-model:value="action" :msg="t('选择动作')" :options="actionOptions" />
          <DateOperations
            v-if="action === ActionType.DateOperations" auto-run
            @save="(v) => save(ActionType.DateOperations, v)"
          />
          <FieldExtraction
            v-if="action === ActionType.FieldExtraction" auto-run
            @save="(v) => save(ActionType.FieldExtraction, v)"
          />
          <DateOperations
            v-if="action === ActionType.IDcardWithdrawal" auto-run
            @save="(v) => console.log(v)"
          />
          <DateOperations
            v-if="action === ActionType.Phonearea" auto-run
            @save="(v) => console.log(v)"
          />
          <DateOperations
            v-if="action === ActionType.UrlToImg" auto-run
            @save="(v) => console.log(v)"
          />
          <DateOperations
            v-if="action === ActionType.ChineseToNumber" auto-run
            @save="(v) => console.log(v)"
          />
          <DateOperations
            v-if="action === ActionType.QRCodeParser" auto-run
            @save="(v) => console.log(v)"
          />
          <template #action>
            <div />
          </template>
        </n-modal>
        <n-list hoverable clickable bordered>
          <template #header>
            <n-form size="small" label-placement="left" label-width="auto">
              <n-form-item label="任务名：">
                <n-input v-model:value="modelData.title" />
              </n-form-item>
              <!-- <n-form-item label="描述：">
                <n-input v-model:value="modelData.desc" />
              </n-form-item> -->
              <n-space justify="space-between">
                <n-form-item label="自动运行：">
                  <n-switch v-model:value="modelData.autorun" />
                </n-form-item>
                <n-button @click="actionShowModal = true">
                  添加动作
                </n-button>
              </n-space>
            </n-form>
          </template>
          <n-list-item v-for="item in modelData.action" :key="item.id">
            <n-tag type="info">
              {{ fieldName(item.conf.input) }}
            </n-tag> => {{ t(item.action) }} => <n-tag type="success">
              {{ fieldName(item.conf.output) }}
            </n-tag>
          </n-list-item>
        </n-list>
      </n-scrollbar>
    </n-modal>
    <n-list hoverable clickable bordered>
      <template #header>
        <n-button @click="taskShowModal = true">
          添加任务
        </n-button>
        每个数据表只能添加一个自动运行任务
      </template>
      <n-list-item v-for="(_, id) in storeData" :key="id">
        {{ tableName(id) }}
        <n-thing>
          <template #avatar>
            <n-avatar />
          </template>
          <template #header>
            货币
          </template>
          <template #header-extra>
            <n-button circle size="small" />
          </template>
          货币是为了提高交易效率而用于交换的中介商品。货币有多种形式，如贝壳粮食等自然物、金属纸张等加工品、银行卡信用卡等磁条卡、移动支付加密货币等APP。
        </n-thing>
      </n-list-item>
    </n-list>
  </Layout>
</template>

<i18n locale="zh" lang="json">
{}
</i18n>

<style lang="scss" scoped>
.content * {
  user-select: none;
}
</style>
