<route lang="yaml">
name: SNCodeManager
meta:
  title: SNCodeManager
  desc: SNCodeManager boasts a powerful system for managing serial numbers, enabling convenient tracking of inventory movement and supporting various robust validation processes.
  help:
  group:
  tags:
    - Develop
  avatar: s
</route>

<script setup lang="ts">
import { FieldType } from '@lark-base-open/js-sdk'
import { eventBucket, useData } from '@/hooks/useData'
import { useStore } from '@/hooks/useStore'
import { TextFieldToStr } from '@/utils/field'

const { fieldMetaList, fieldName, fieldType, filterFields, getRecords, getTable, layout, t, table, tableId, tableMetaList, viewId, viewMetaList } = useData()
const { store } = useStore()

const storeData = store('data', {
  in: {
    field: '',
    other: [] as string[],
  },
  modle: false,
  out: {} as { [key: string]: { name: string, type: outType, action: number | null, text?: string } },
  storeModle: false,
  verify: {
    delay: 0,
    enable: false,
    length: 10,
    regular: '',
  },
})
const inputVal = ref('')
const recordsSnMap: Record<string, IRecord> = {}
const recordsIdMap: Record<string, IRecord> = {}

const notification = useNotification()
type outType = FieldType.Checkbox | FieldType.DateTime | FieldType.Text
const outActions: Record<outType, { name: string, id: number }[]> = {
  [FieldType.Checkbox]: [{ id: 101, name: '勾选' }, { id: 102, name: '不勾选' }],
  [FieldType.DateTime]: [{ id: 201, name: '出库时间' }],
  [FieldType.Text]: [],
}
let lastRecord: Omit<IRecord, 'recordId'> | null = null

// let verifyTimer: NodeJS.Timeout

// function start(s: string) {
//   console.log(s)
// }

async function main(s: string) {
  // if (storeData.value.verify.enable){
  //   clearTimeout(verifyTimer)
  //   verifyTimer = setTimeout(() => {
  //     start(s)
  //   }, storeData.value.verify.delay)
  // }
  if (!/\n/.test(s))
    return
  s = s.replaceAll('\n', '')
  inputVal.value = ''
  if (!storeData.value.modle) { // 入库
    if (s in recordsSnMap) {
      notification.error({
        content: s + t('  已存在'),
        keepAliveOnHover: true,
        title: t('重复入库'),
      },
      )
    }
    else {
      const record = {
        fields: {
          [storeData.value.in.field]: s as any,
        },
        recordId: undefined as string | undefined,
      }
      storeData.value.in.other.forEach((item) => {
        record.fields[item] = lastRecord?.fields[item]
      })
      lastRecord = record
      const rid = await table.value?.addRecord(record)
      record.recordId = rid
      console.log(record)

      recordsSnMap[s] = record as IRecord
    }
  }
  else { // 出库
    if (s in recordsSnMap) {
      const f = () => notification.error({
        content: s + t(' 当前记录已经出库过啦！！'),
        keepAliveOnHover: true,
        title: t('重复出库'),
      })
      for (const fieldId in storeData.value.out) {
        const t = storeData.value.out[fieldId]
        console.log(t, recordsSnMap[s].fields[fieldId])

        switch (t.action) {
          case 101:
            if (recordsSnMap[s].fields[fieldId] === true) {
              f()
              return
            }
            recordsSnMap[s].fields[fieldId] = true
            break
          case 102:
            if (recordsSnMap[s].fields[fieldId] === false) {
              f()
              return
            }
            recordsSnMap[s].fields[fieldId] = false
            break
          case 201:
            if (recordsSnMap[s].fields[fieldId]) {
              f()
              return
            }
            recordsSnMap[s].fields[fieldId] = Date.now()
            break
          default:
            if (t.text) {
              if (recordsSnMap[s].fields[fieldId] === t.text) {
                f()
                return
              }
              recordsSnMap[s].fields[fieldId] = t.text
            }
        }
      }
      table.value?.setRecord(recordsSnMap[s].recordId, recordsSnMap[s])
    }
    else {
      notification.error({
        content: s + t(' 可能未入库，无法进行出库操作'),
        keepAliveOnHover: true,
        title: t('出库错误'),
      })
    }
  }
}

const noSideSpace = (value: string) => !value.startsWith(' ') && !value.endsWith(' ')

function updateOut(v: string[]) {
  v.forEach((item) => {
    if (!(item in storeData.value.out)) {
      storeData.value.out[item] = {
        action: null,
        name: fieldName(item) as string,
        type: fieldType(item) as outType,
      }
    }
  })
}

async function updataSnField(fieldId: string) {
  for (const id in recordsSnMap) delete recordsSnMap[id]
  for (const id in recordsIdMap) delete recordsIdMap[id]
  await getRecords(async ({ pr, records }) => {
    records.records.forEach((item) => {
      const val = TextFieldToStr(item.fields[fieldId])
      recordsSnMap[val] = item
      recordsIdMap[item.recordId] = item
      lastRecord = item
      pr.add()
    })
  }, true, 5000)
  layout.value?.update(false)
}

onMounted(async () => {
  await getTable()
  if (storeData.value.in.field)
    await updataSnField(storeData.value.in.field)
  eventBucket.add(table.value!.onRecordDelete(() => {
    if (storeData.value.in.field)
      updataSnField(storeData.value.in.field)
  }))
  eventBucket.add(table.value!.onRecordModify(async ({ data }) => {
    if (storeData.value.in.field) {
      const item = await table.value!.getRecordById(data.recordId) as IRecord
      item.recordId = data.recordId
      const val = TextFieldToStr(item.fields[storeData.value.in.field])
      recordsIdMap[val] = item
      recordsSnMap[data.recordId] = item
    }
  }))
})
</script>

<template>
  <Layout ref="layout">
    <n-space justify="space-between">
      <form-tags v-model:value="tableId" :msg="t('Table')" :tags="tableMetaList" />
      <form-tags v-if="!storeData.storeModle" v-model:value="viewId" :msg="t('View')" :tags="viewMetaList" />
      <form-tags v-else v-model:value="tableId" :msg="t('Table')" :tags="tableMetaList" />
    </n-space>
    <n-space justify="space-between" style="margin-bottom: 15px;">
      <n-switch v-model:value="storeData.modle">
        <template #checked>
          出库
        </template>
        <template #unchecked>
          入库
        </template>
      </n-switch>
      <n-switch v-model:value="storeData.storeModle" :disabled="true">
        <template #checked>
          分数据表模式
        </template>
        <template #unchecked>
          同数据表模式
        </template>
      </n-switch>
    </n-space>
    <n-form size="small">
      <n-collapse display-directive="show" style="--n-title-padding: 8px 0 0 0;--n-item-margin: 8px 0 0 0;">
        <n-collapse-item title="出入库配置" name="1">
          <div v-if="!storeData.modle">
            <form-select
              v-model:value="storeData.in.field"
              :msg="t('入库SN码字段')"
              :options="filterFields(FieldType.Text)"
              @update:value="id => updataSnField(id)"
            />
            <form-select
              v-model:value="storeData.in.other"
              :msg="t('其他字段配置')"
              multiple
              :options="fieldMetaList"
            />
            <form-select
              v-for="item in storeData.in.other"
              :key="item"
              :disabled="true"
              default-value="复制上一条"
              :msg="t(`${fieldName(item)} 字段配置`)"
            />
          </div>
          <div v-else>
            <form-select
              :value="Object.keys(storeData.out)"
              :msg="t('出库展示字段')"
              multiple
              :options="filterFields([FieldType.Text, FieldType.Checkbox, FieldType.DateTime])"
              @update:value="updateOut"
            />
            <template
              v-for="(item, key) in storeData.out"
              :key="key"
            >
              <n-form-item v-if="item.type === FieldType.Text" :label="`${item.name} 字段`">
                <n-input
                  v-model:value="storeData.out[key].text"
                  size="large"
                />
              </n-form-item>
              <form-select
                v-else
                v-model:value="storeData.out[key].action"
                :msg="t(`${item.name} 字段`)"
                :options="outActions[item.type]"
              />
            </template>
          </div>
        </n-collapse-item>
        <n-collapse-item title="SN校验配置" name="2">
          <n-spin :show="true">
            设置校验延迟，录入数据无动作{延迟}秒之后进行校验和出入库操作
            <n-form-item label="开启校验" style="margin: 15px 0;">
              <n-switch v-model:value="storeData.verify.enable" />
            </n-form-item>
            <n-form-item label="校验延迟" style="margin: 15px 0;">
              <n-input-number
                v-model:value="storeData.verify.delay"
                :min="0"
                :max="5"
                :step="0.2"
                style="width: 100%;"
              >
                <template #suffix>
                  秒
                </template>
              </n-input-number>
            </n-form-item>
            <n-form-item label="SN长度验证" style="margin: 15px 0;">
              <n-input-number
                v-model:value="storeData.verify.length"
                style="width: 100%;"
              />
            </n-form-item>
            <n-form-item label="SN正则验证" style="margin: 15px 0;">
              <n-input
                v-model:value="storeData.verify.regular"
                :disabled="true"
              />
            </n-form-item>
            <template #description>
              未完成
            </template>
          </n-spin>
        </n-collapse-item>
      </n-collapse>
    </n-form>
    <n-form-item label="输入SN码" style="margin: 15px 0;">
      <n-input
        v-model:value="inputVal"
        type="textarea"
        :autofocus="false"
        :allow-input="noSideSpace"
        :autosize="{ minRows: 2, maxRows: 4 }"
        @input="main"
      />
    </n-form-item>
  </Layout>
</template>

<i18n locale="zh" lang="json">
{}
</i18n>

<style lang="scss" scoped>
.n-form-item :deep(.n-form-item-feedback-wrapper){
  min-height:5px
}
</style>
