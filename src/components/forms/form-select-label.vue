<script lang="ts" setup>
const props = withDefaults(defineProps<Props>(), {
  msg: '',
  tooltip: false,
})
interface Props {
  msg: string
  tooltip?: boolean
}
</script>

<template>
  <n-tooltip
    v-if="props.tooltip"
    trigger="click"
    arrow-point-to-center
  >
    <template #trigger>
      <div style="display: flex;align-items: center;">
        <span @click.stop.prevent="">{{ props.msg }}</span>
        <n-icon
          size="20"
          style="margin-left: 8px;cursor: pointer;"
        >
          <svg
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
          >
            <path
              d="M512 64C264.608 64 64 264.608 64 512s200.608 448 448 448 448-200.608 448-448S759.392 64 512 64z m0 820C306.608 884 140 717.392 140 512S306.608 140 512 140 884 306.608 884 512 717.392 884 512 884z"
              p-id="4023"
            />
            <path
              d="M464 336a48 48 0 1 0 96 0 48 48 0 0 0-96 0zM536 448h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8v-272c0-4.4-3.6-8-8-8z"
              p-id="4024"
            />
          </svg>
        </n-icon>
      </div>
    </template>

    <slot />
  </n-tooltip>
  <span v-else>{{ props.msg }}</span>
</template>

<style lang="scss" scoped></style>
