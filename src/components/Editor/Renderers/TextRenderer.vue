<template>
  <div 
    class="text-container" 
    :style="containerStyle"
  >
    {{ finalDisplay }}
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
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

const isDigitalFlop = computed(() => props.config.key === 'digital-flop')
const animatedNum = ref(0)
const staticContent = ref('')

// Helper to parse number from string/value
const parseNumber = (val) => {
  if (typeof val === 'number') return val
  if (!val) return 0
  const str = String(val)
  // Remove commas and try to parse
  const cleanStr = str.replace(/,/g, '')
  const num = parseFloat(cleanStr)
  return isNaN(num) ? 0 : num
}

// Animation loop
let animationFrameId = null
const animateValue = (start, end) => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  
  const duration = 1500 // 1.5s duration
  const startTime = performance.now()
  
  const tick = (now) => {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Ease Out Quart
    const ease = 1 - Math.pow(1 - progress, 4)
    
    const current = start + (end - start) * ease
    animatedNum.value = current
    
    if (progress < 1) {
      animationFrameId = requestAnimationFrame(tick)
    } else {
      animatedNum.value = end
    }
  }
  
  animationFrameId = requestAnimationFrame(tick)
}

// Watch for data source changes
watch(() => {
  if (data.value !== null && data.value !== undefined) {
    return data.value
  }
  return props.config.content
}, (newVal, oldVal) => {
  if (isDigitalFlop.value) {
    const start = oldVal === undefined ? 0 : animatedNum.value
    const end = parseNumber(newVal)
    animateValue(start, end)
  } else {
    staticContent.value = typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal)
  }
}, { immediate: true })

const finalDisplay = computed(() => {
  if (isDigitalFlop.value) {
    // Format number with commas
    return Math.floor(animatedNum.value).toLocaleString()
  }
  return staticContent.value
})

const containerStyle = computed(() => {
  return {
    ...props.config.style,
  }
})
</script>

<style scoped>
.text-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  white-space: pre-wrap;
}
</style>
