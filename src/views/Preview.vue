<template>
  <div class="preview-page">
    <div class="simulator">
      <div class="simulator-actions">
        <el-select v-model="selectedPreset" size="small" style="width: 180px" @change="applyPreset">
          <el-option v-for="p in presets" :key="p.value" :label="p.label" :value="p.value" />
        </el-select>
        <el-input-number v-model="previewWidth" :min="320" size="small" @change="applyCustom" />
        <span class="x-label">x</span>
        <el-input-number v-model="previewHeight" :min="240" size="small" @change="applyCustom" />
        <el-tag size="small" type="info">容器分辨率</el-tag>
      </div>
      <div class="simulator-viewport" ref="simulatorRef">
        <div 
          class="simulator-container" 
          :style="{ 
            width: previewWidth + 'px', 
            height: previewHeight + 'px',
            transform: `scale(${containerScale})`,
            transformOrigin: 'center center'
          }"
        >
          <Canvas :preview="true" />
        </div>
      </div>
    </div>
    <div class="preview-actions">
      <el-button type="primary" circle @click="router.push('/')">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import Canvas from '@/components/Editor/Canvas.vue'
import { useRouter } from 'vue-router'
import { Close } from '@element-plus/icons-vue'
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

const router = useRouter()
const simulatorRef = ref(null)
const containerScale = ref(1)

const presets = [
  { label: '1920 x 1080', value: '1920x1080' },
  { label: '3840 x 2160', value: '3840x2160' },
  { label: '1280 x 720', value: '1280x720' },
  { label: '1600 x 900', value: '1600x900' }
]
const selectedPreset = ref('1920x1080')
const previewWidth = ref(1920)
const previewHeight = ref(1080)

const updateContainerScale = () => {
  if (!simulatorRef.value) return
  
  // Available space in simulator wrapper (minus padding/margins)
  // simulatorRef is now the viewport (flex: 1)
  const wrapperWidth = simulatorRef.value.clientWidth
  const wrapperHeight = simulatorRef.value.clientHeight
  
  // Deduct some padding for aesthetics
  const padding = 40
  const availW = wrapperWidth - padding
  const availH = wrapperHeight - padding
  
  const scaleW = availW / previewWidth.value
  const scaleH = availH / previewHeight.value
  
  // Fit containment
  let scale = Math.min(scaleW, scaleH)
  
  // Don't scale up if it fits (optional, but usually we don't want to blur up)
  // Actually, for "Simulator", seeing it larger is fine if screen is huge.
  // But usually we just want to shrink if it's too big.
  // Let's allow scale < 1, and scale > 1 only if user wants?
  // User said "don't cover entire page", implying it's too big.
  // So scale should be min(1, calculated).
  // But if I have a 4k screen and preview 720p, maybe I want it bigger?
  // Let's just fit it.
  
  containerScale.value = scale
}

const parsePreset = (preset) => {
  const [w, h] = preset.split('x').map(n => parseInt(n, 10))
  return { w, h }
}
const applyPreset = () => {
  const { w, h } = parsePreset(selectedPreset.value)
  previewWidth.value = w
  previewHeight.value = h
  nextTick(updateContainerScale)
}
const applyCustom = () => {
  selectedPreset.value = `${previewWidth.value}x${previewHeight.value}`
  nextTick(updateContainerScale)
}

onMounted(() => {
  window.addEventListener('resize', updateContainerScale)
  nextTick(updateContainerScale)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerScale)
})
</script>

<style scoped>
.preview-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  background-color: #1e1e1e;
  position: relative;
  overflow: hidden;
}

.simulator {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 20px;
  padding: 20px;
  background-image: radial-gradient(#333 1px, transparent 1px);
  background-size: 20px 20px;
  overflow: hidden;
}

.simulator-viewport {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.simulator-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #2d2d2d;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 10;
}

.simulator-container {
  background: #000;
  box-shadow: 0 0 0 1px #333, 0 20px 50px rgba(0,0,0,0.5);
  display: flex;
  transition: width 0.3s, height 0.3s; /* Smooth resize */
}

.x-label {
  color: #909399;
  padding: 0 4px;
}

.preview-actions {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 9999;
}
</style>
