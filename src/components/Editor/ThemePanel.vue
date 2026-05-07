<template>
  <div class="theme-panel">
    <div class="section-title">预设主题</div>
    <div class="theme-grid">
      <div 
        v-for="theme in presetThemes" 
        :key="theme.id"
        class="theme-item"
        :class="{ active: store.currentThemeId === theme.id }"
        @click="applyTheme(theme.id)"
      >
        <div class="theme-preview" :style="{ background: theme.backgroundColor }">
          <div class="color-dots">
            <span v-for="color in theme.palette.slice(0, 4)" :key="color" :style="{ background: color }"></span>
          </div>
        </div>
        <div class="theme-name">{{ theme.name }}</div>
      </div>
    </div>

    <div class="section-title" style="margin-top: 20px;">
      自定义主题
      <el-button link type="primary" size="small" @click="showCreateDialog = true" style="float: right;">
        <el-icon><Plus /></el-icon> 新建
      </el-button>
    </div>
    
    <div class="theme-grid">
      <div 
        v-for="theme in store.customThemes" 
        :key="theme.id"
        class="theme-item"
        :class="{ active: store.currentThemeId === theme.id }"
        @click="applyTheme(theme.id)"
      >
        <div class="theme-preview" :style="{ background: theme.backgroundColor }">
          <div class="color-dots">
            <span v-for="color in theme.palette.slice(0, 4)" :key="color" :style="{ background: color }"></span>
          </div>
        </div>
        <div class="theme-name">{{ theme.name }}</div>
      </div>
      <div v-if="store.customThemes.length === 0" class="empty-text">
        暂无自定义主题
      </div>
    </div>

    <!-- Create Theme Dialog -->
    <el-dialog v-model="showCreateDialog" title="新建主题" width="400px">
      <el-form label-position="top">
        <el-form-item label="主题名称">
          <el-input v-model="newTheme.name" />
        </el-form-item>
        <el-form-item label="背景颜色">
          <el-color-picker v-model="newTheme.backgroundColor" show-alpha />
        </el-form-item>
        <el-form-item label="文字颜色">
          <el-color-picker v-model="newTheme.textColor" />
        </el-form-item>
        <el-form-item label="配色方案 (JSON Array)">
          <el-input v-model="newThemePaletteStr" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="createTheme">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useEditorStore } from '@/store/editorStore'
import { presetThemes } from '@/utils/themes'
import { Plus } from '@element-plus/icons-vue'
import { v4 as uuidv4 } from 'uuid'

const store = useEditorStore()
const showCreateDialog = ref(false)

const newTheme = ref({
  name: '我的主题',
  backgroundColor: '#ffffff',
  textColor: '#333333',
  palette: ['#5470c6', '#91cc75', '#fac858', '#ee6666']
})

const newThemePaletteStr = computed({
  get: () => JSON.stringify(newTheme.value.palette),
  set: (val) => {
    try {
      newTheme.value.palette = JSON.parse(val)
    } catch (e) {
      // ignore
    }
  }
})

const applyTheme = (id) => {
  store.setTheme(id)
}

const createTheme = () => {
  const theme = {
    ...newTheme.value,
    id: uuidv4()
  }
  store.addCustomTheme(theme)
  store.setTheme(theme.id)
  showCreateDialog.value = false
}
</script>

<style scoped>
.theme-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.section-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.theme-item {
  cursor: pointer;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s;
}

.theme-item:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.theme-item.active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-light);
}

.theme-preview {
  height: 60px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-dots {
  display: flex;
  gap: 4px;
}

.color-dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.2);
}

.theme-name {
  padding: 8px;
  font-size: 12px;
  text-align: center;
  background: var(--bg-darker);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-text {
  grid-column: span 2;
  text-align: center;
  color: var(--text-secondary);
  font-size: 12px;
  padding: 20px 0;
}
</style>
