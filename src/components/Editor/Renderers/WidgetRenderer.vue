<template>
  <div class="widget-renderer" :style="containerStyle">
    <!-- Button/Text based widgets -->
    <component 
      v-if="isButton"
      :is="config.subType" 
      v-bind="mergedProps"
      style="width: 100%; height: 100%;"
    >
      {{ displayContent }}
    </component>

    <!-- Input/Select based widgets (no default slot content usually) -->
    <component 
      v-else
      :is="config.subType" 
      v-bind="mergedProps"
      v-model="modelValue"
      style="width: 100%; height: 100%;"
    >
      <template v-if="config.subType === 'el-select' && mergedProps.options">
        <el-option 
          v-for="opt in mergedProps.options" 
          :key="opt.value" 
          :label="opt.label" 
          :value="opt.value" 
        />
      </template>
    </component>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useDataSource } from '@/composables/useDataSource'

const props = defineProps({
  config: {
    type: Object,
    required: true
  },
  preview: {
    type: Boolean,
    default: false
  }
})

const { data } = useDataSource(props.config)

const modelValue = ref('')

// Sync data to modelValue (for Inputs)
watch(data, (newVal) => {
  if (newVal === null || newVal === undefined) return
  if (typeof newVal !== 'object') {
    modelValue.value = newVal
  } else if (newVal.value !== undefined) {
    modelValue.value = newVal.value
  }
}, { immediate: true })

const isButton = computed(() => {
  return props.config.subType === 'el-button'
})

const displayContent = computed(() => {
  if (data.value && typeof data.value === 'string') return data.value
  if (data.value && data.value.content) return data.value.content
  return props.config.content
})

const mergedProps = computed(() => {
  if (data.value && data.value.props) {
    return { ...props.config.props, ...data.value.props }
  }
  return props.config.props || {}
})

const containerStyle = computed(() => {
  return {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    pointerEvents: props.preview ? 'auto' : 'none',
    ...props.config.style
  }
})
</script>

<style scoped>
.widget-renderer {
  pointer-events: none; /* Prevent interaction during editing usually, but maybe we want to see hover effects? */
}
/* Allow pointer events on the component itself if needed, but for drag-drop editor, 
   usually we block interaction in the canvas so we can drag the wrapper. 
   The wrapper in Canvas.vue handles the drag events. 
   So pointer-events: none is fine for the renderer content to avoid stealing clicks from the wrapper.
*/
</style>
