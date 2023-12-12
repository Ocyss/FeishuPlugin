<script lang="ts" setup>
import { generateRandomElement } from 'random-ease'
import { tKey } from '@/keys'

interface Props {
  disableds?: Array<[boolean, string]>
  operate?: boolean
  noHandle?: boolean
  buttons?: Array<[string, (e: MouseEvent) => void]>
}

const props = withDefaults(defineProps<Props>(), {
  noHandle: false,
  operate: false,
})

const emit = defineEmits<{ (e: 'update:click', all?: boolean): void }>()
const t = inject(tKey, () => useI18n().t, true)
const showModal = ref(false)

const disabled = computed(() => {
  const isDisabled = props.disableds?.some(disabled => disabled[0])
  const reasons = props.disableds?.filter(disabled => disabled[0])?.map(disabled => disabled[1])
  return {
    isDisabled,
    reasons,
  }
})
const titles = [
  ['🤔', '🤗', '🫢', '🫡', '🤥', '🤪', '🥰', '🤠', '🥳'],
  [
    'Truly Tedious, Isn\'t It?',
    'Handle with Care: Confidence in Confirmation',
    'One Click Away: Ensuring Accuracy',
    'Moments for Decision-Makers: Serious yet Fun',
    'Illuminating Decisions: Serious, Not Dull',
    'Confirmation Adventure: Every Step Counts',
    'Secretly Important: The Significance of Confirmation',
    'Wisdom Click: Just Tap',
    'Exploring the Button: Serious Fun',
    'Confirmation Isn\'t Child\'s Play: But It Can Be Fun',
    'Confirmation Pro: Meticulous and Enjoyable',
    'The Art of Clicking: Beyond Confirmation',
    'A Bit of Decision-Making: Careful, Not Nervous',
    'Thoughtful Choices: Enjoyable Confirmations',
    'The Final Check: With a Dash of Fun',
    'Tap to Begin: Confirmation\'s Little Secret',
    'Precise Handling: Fun in Confirmation',
    'Master of Details: Confirmed Reason',
    'A Step Away: Serious Confirmation',
    'The Joy of Choosing: Careful and Cheerful',
    'Ultimate Review: Seriously Enjoyable',
  ],
]
const tsy
  = 'Process all: The operation will be performed on all records, up to 5000 records can be processed eachtime, and the speed is faster🚀\n\nProcessing part: The pop - up window allows the user to select operationrecords, and one record is processed at a time, which is slow🚗'
function handleClick() {
  if (props.operate) {
    emit('update:click')
    return
  }
  showModal.value = true
}
</script>

<template>
  <n-space>
    <n-popover
      v-if="!noHandle"
      content-style="width: auto;"
      trigger="hover"
      :disabled="!disabled.isDisabled"
      placement="bottom-start"
      :keep-alive-on-hover="false"
      :show-arrow="false"
    >
      <template #trigger>
        <n-button
          strong
          round
          type="info"
          :disabled="disabled.isDisabled"
          icon-placement="right"
          @click="handleClick"
        >
          {{ t("Handle") }}
          <template #icon>
            <n-icon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 512 512"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="32"
                  d="M262.62 336L342 256l-79.38-80"
                />
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="32"
                  d="M330.97 256H170"
                />
                <path
                  d="M256 448c106 0 192-86 192-192S362 64 256 64S64 150 64 256s86 192 192 192z"
                  fill="none"
                  stroke="currentColor"
                  stroke-miterlimit="10"
                  stroke-width="32"
                />
              </svg>
            </n-icon>
          </template>
          <n-modal
            v-if="!operate"
            v-model:show="showModal"
            preset="card"
            transform-origin="center"
            display-directive="show"
            style="width: 85%; --n-padding-bottom: 12px"
          >
            <div style="white-space: pre-wrap">
              {{ t(tsy) }}
            </div>
            <template #header>
              <div style="font-size: 14px">
                <span style="font-size: 20px">{{ generateRandomElement(titles[0]) }}</span>
                {{ t(generateRandomElement(titles[1])) }}
              </div>
            </template>
            <template #action>
              <n-space justify="end">
                <n-button type="error" size="small" @click="showModal = false">
                  {{ t("cancel") }}
                </n-button>
                <n-button
                  type="info"
                  size="small"
                  @click="
                    () => {
                      showModal = false
                      emit('update:click', true)
                    }
                  "
                >
                  {{ t("Process all") }}
                </n-button>
                <n-popconfirm
                  @positive-click="() => {
                    showModal = false
                    emit('update:click', false)
                  }
                  "
                >
                  <template #trigger>
                    <n-button type="info" size="small">
                      {{ t("Process part") }}
                    </n-button>
                  </template>
                  {{
                    t("Some users will automatically fold when using it, waiting for official fix")
                  }}
                </n-popconfirm>
              </n-space>
            </template>
          </n-modal>
        </n-button>
      </template>
      <n-list clickable>
        <n-list-item v-for="item in disabled.reasons" :key="item">
          {{ t(item) }}
        </n-list-item>
      </n-list>
    </n-popover>
    <n-button v-for="item in buttons" :key="item[0]" strong round type="info" @click="item[1]">
      {{ item[0] }}
    </n-button>
    <slot />
  </n-space>
</template>
