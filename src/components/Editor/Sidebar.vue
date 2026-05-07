<template>
  <div class="editor-sidebar">
    <el-tabs v-model="activeTab" stretch>
      <el-tab-pane label="组件库" name="components">
        <div class="component-list">
          <div
            v-for="(item, index) in componentList"
            :key="index"
            class="component-item"
            draggable="true"
            @dragstart="handleDragStart($event, item)"
          >
            <el-icon :size="20"><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="图层" name="layers">
        <div class="layer-list">
          <div 
            v-for="comp in sortedComponents" 
            :key="comp.id"
            class="layer-item"
            :class="{ active: store.activeComponentId === comp.id }"
            @click="store.setActiveComponent(comp.id)"
          >
            <el-icon><Menu /></el-icon>
            <span class="layer-name">{{ comp.label || comp.type }}</span>
            <div class="layer-actions">
               <el-tooltip :content="comp.locked ? '解锁' : '锁定'" placement="top" :show-after="500">
                 <el-button link size="small" @click.stop="store.toggleLock(comp.id)">
                   <el-icon v-if="comp.locked"><Lock /></el-icon>
                   <el-icon v-else><Unlock /></el-icon>
                 </el-button>
               </el-tooltip>
               <el-tooltip content="上移图层" placement="top" :show-after="500">
                 <el-button link size="small" @click.stop="moveLayer(comp, 1)">
                   <el-icon><ArrowUp /></el-icon>
                 </el-button>
               </el-tooltip>
               <el-tooltip content="下移图层" placement="top" :show-after="500">
                 <el-button link size="small" @click.stop="moveLayer(comp, -1)">
                   <el-icon><ArrowDown /></el-icon>
                 </el-button>
               </el-tooltip>
            </div>
          </div>
          <div v-if="sortedComponents.length === 0" class="empty-layers">
            暂无图层
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="画布" name="canvas">
        <div class="canvas-settings">
          <el-form label-position="top" size="small">
            <el-form-item label="分辨率预设">
              <el-select v-model="selectedPreset" @change="applyPreset" style="width: 100%">
                <el-option v-for="p in presets" :key="p.value" :label="p.label" :value="p.value" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="适配模式">
              <el-select v-model="adaptMode" @change="applyAdaptMode" style="width: 100%">
                <el-option label="等比缩放 (Contain)" value="contain" />
                <el-option label="居中裁剪 (Cover)" value="cover" />
                <el-option label="拉伸填充 (Fill)" value="stretch" />
              </el-select>
            </el-form-item>

            <el-form-item label="多屏拼接（行 x 列）">
              <div class="splice-row">
                <el-input-number v-model="rows" :min="1" @change="applySplicing" controls-position="right" style="width: auto; flex: 1" />
                <span class="x-label">x</span>
                <el-input-number v-model="cols" :min="1" @change="applySplicing" controls-position="right" style="width: auto; flex: 1" />
              </div>
            </el-form-item>
            
            <div class="current-res-card">
              <div class="res-label">当前画布分辨率</div>
              <div class="res-value">{{ store.canvasConfig.width }} x {{ store.canvasConfig.height }}</div>
              <div class="res-ratio">
                 {{ (store.canvasConfig.width / store.canvasConfig.height).toFixed(2) }} : 1
              </div>
            </div>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="主题" name="theme">
        <ThemePanel />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { componentList } from '@/utils/componentList'
import { ref, computed } from 'vue'
import { useEditorStore } from '@/store/editorStore'
import { Menu, ArrowUp, ArrowDown, Lock, Unlock } from '@element-plus/icons-vue'
import ThemePanel from './ThemePanel.vue'

const store = useEditorStore()
const activeTab = ref('components')

const handleDragStart = (e, item) => {
  e.dataTransfer.setData('component-type', JSON.stringify(item))
}

// Sort by z-index descending (top layers first)
const sortedComponents = computed(() => {
  return [...store.components].sort((a, b) => b.zIndex - a.zIndex)
})

const moveLayer = (component, direction) => {
  const newZ = (component.zIndex || 0) + direction
  if (newZ < 0) return
  
  store.updateComponent(component.id, { zIndex: newZ })
  store.recordSnapshot()
}

const presets = [
  { label: '1920 x 1080 (FHD)', value: '1920x1080' },
  { label: '3840 x 2160 (4K)', value: '3840x2160' },
  { label: '1280 x 720 (HD)', value: '1280x720' },
  { label: '1600 x 900', value: '1600x900' }
]

const selectedPreset = ref(store.canvasConfig.preset || '1920x1080')
const adaptMode = ref(store.canvasConfig.adaptMode || 'contain')
const rows = ref(store.canvasConfig.splicing?.rows || 1)
const cols = ref(store.canvasConfig.splicing?.cols || 1)

const parsePreset = (preset) => {
  const [w, h] = preset.split('x').map(n => parseInt(n, 10))
  return { w, h }
}

const applyPreset = () => {
  const { w, h } = parsePreset(selectedPreset.value)
  const width = w * cols.value
  const height = h * rows.value
  store.updateCanvasConfig({ width, height, preset: selectedPreset.value })
}

const applySplicing = () => {
  const { w, h } = parsePreset(selectedPreset.value)
  const width = w * cols.value
  const height = h * rows.value
  store.updateCanvasConfig({ width, height, splicing: { rows: rows.value, cols: cols.value } })
}

const applyAdaptMode = () => {
  store.updateCanvasConfig({ adaptMode: adaptMode.value })
}
</script>

<style scoped>
.editor-sidebar {
  width: 250px;
  height: 100%;
  border-right: 1px solid var(--border-color);
  background: var(--bg-panel);
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__header) {
  margin: 0;
  background-color: var(--bg-darker);
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-tabs__nav) {
  width: 100%;
  display: flex;
  justify-content: space-evenly; /* Even spacing around items */
}

:deep(.el-tabs__item) {
  color: var(--text-secondary);
  height: 48px;
  line-height: 48px;
  flex: 1; /* Make each tab take equal width */
  text-align: center;
  padding: 0 4px !important; /* Reduce padding to avoid squeezing */
}

:deep(.el-tabs__item.is-active) {
  color: var(--primary-color);
}

:deep(.el-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-tab-pane) {
  height: 100%;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.component-list, .layer-list, .canvas-settings {
  overflow-y: auto;
  height: 100%;
  padding: 16px;
}

.canvas-settings {
  /* specific canvas settings if needed */
}

.current-res-card {
  background: var(--bg-darker);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px;
  text-align: center;
  margin-top: 24px;
}

.res-label {
  color: var(--text-secondary);
  font-size: 12px;
  margin-bottom: 8px;
}

.res-value {
  color: var(--primary-color);
  font-size: 18px;
  font-weight: bold;
  font-family: monospace;
  letter-spacing: 1px;
}

.res-ratio {
  color: var(--text-secondary);
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.7;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-dark);
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s;
  color: var(--text-primary);
}

.component-item:hover {
  border-color: var(--primary-color);
  background-color: var(--bg-darker);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.layer-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 4px;
  background-color: var(--bg-dark);
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary);
  justify-content: space-between;
  border: 1px solid transparent;
}

.layer-item:hover {
  background-color: var(--bg-darker);
  color: var(--text-primary);
}

.layer-item.active {
  background-color: rgba(64, 158, 255, 0.15);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.layer-name {
  flex: 1;
  margin-left: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.empty-layers {
  text-align: center;
  color: var(--text-secondary);
  padding: 20px 0;
  font-size: 13px;
}
.splice-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.x-label {
  color: var(--text-secondary);
}
.current-res {
  font-weight: 600;
  color: var(--text-primary);
}
</style>
