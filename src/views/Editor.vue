<template>
  <div class="editor-layout">
    <header class="editor-header">
      <div class="left-section">
        <el-dropdown trigger="click" @command="handleProjectCommand">
          <div class="project-menu-trigger">
            <el-icon :size="20"><Menu /></el-icon>
            <span>项目</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="new">新建项目</el-dropdown-item>
              <el-dropdown-item command="open">打开项目</el-dropdown-item>
              <el-dropdown-item command="save" :disabled="!projectStore.canEdit">保存项目</el-dropdown-item>
              <el-dropdown-item command="save_version" :disabled="!projectStore.canEdit">创建版本</el-dropdown-item>
              <el-dropdown-item command="history">版本历史</el-dropdown-item>
              <el-dropdown-item command="rename" :disabled="!projectStore.canEdit">重命名</el-dropdown-item>
              <el-dropdown-item command="import" divided>导入项目</el-dropdown-item>
              <el-dropdown-item command="export">导出项目</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <div class="logo">大屏可视化生成器</div>
        
        <div class="current-project-info" v-if="projectStore.currentProject">
          <span class="project-name">{{ projectStore.currentProject.name }}</span>
        </div>
      </div>
      
      <div class="center-actions">
        <el-button-group>
          <el-tooltip content="撤销 (Ctrl+Z)" placement="bottom" :show-after="500">
            <el-button 
              type="info" 
              size="small" 
              :disabled="!store.canUndo || !projectStore.canEdit" 
              @click="store.undo"
            >
              <el-icon><ArrowLeft /></el-icon> 撤销
            </el-button>
          </el-tooltip>
          <el-tooltip content="重做 (Ctrl+Y)" placement="bottom" :show-after="500">
            <el-button 
              type="info" 
              size="small" 
              :disabled="!store.canRedo || !projectStore.canEdit" 
              @click="store.redo"
            >
              重做 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </el-tooltip>
        </el-button-group>
      </div>

      <div class="actions">
        <!-- Role Simulator -->
        <el-select 
          v-model="projectStore.currentUserRole" 
          size="small" 
          style="width: 100px; margin-right: 10px"
          @change="handleRoleChange"
        >
          <el-option label="管理员" value="admin" />
          <el-option label="编辑者" value="editor" />
          <el-option label="查看者" value="viewer" />
        </el-select>

        <el-tooltip content="快捷键 & 帮助" placement="bottom">
          <el-button circle size="small" @click="helpVisible = true">
            <el-icon><QuestionFilled /></el-icon>
          </el-button>
        </el-tooltip>

        <el-button size="small" @click="handlePreview">预览</el-button>
        <el-button type="success" size="small" @click="handleSave" :disabled="!projectStore.canEdit">保存</el-button>
      </div>
    </header>

    <!-- Dialogs -->
    <!-- Project List Dialog -->
    <el-dialog v-model="projectListVisible" title="项目列表" width="600px">
      <div class="project-list-actions" style="margin-bottom: 15px;">
        <el-button type="primary" @click="showNewProjectInput">新建项目</el-button>
      </div>
      <el-table :data="projectStore.projects" style="width: 100%" height="300">
        <el-table-column prop="name" label="项目名称" />
        <el-table-column prop="updatedAt" label="最后修改" width="180">
           <template #default="scope">
             {{ new Date(scope.row.updatedAt).toLocaleString() }}
           </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="right">
          <template #default="scope">
            <el-button size="small" @click="loadProject(scope.row.id)" :disabled="projectStore.currentProjectId === scope.row.id">打开</el-button>
            <el-button size="small" type="danger" @click="deleteProject(scope.row.id)" :disabled="!projectStore.canManage">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- New Project Dialog -->
    <el-dialog v-model="newProjectVisible" title="新建项目" width="400px">
      <el-form>
        <el-form-item label="项目名称">
          <el-input v-model="newProjectName" placeholder="请输入项目名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="newProjectVisible = false">取消</el-button>
          <el-button type="primary" @click="createNewProject">创建</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Version History Dialog -->
    <el-dialog v-model="versionHistoryVisible" title="版本历史" width="600px">
      <div class="version-actions" style="margin-bottom: 15px;" v-if="projectStore.canEdit">
        <el-button type="primary" @click="createVersion">创建新版本</el-button>
      </div>
      <el-table :data="currentVersions" style="width: 100%" height="300">
        <el-table-column prop="name" label="版本名称" />
        <el-table-column prop="timestamp" label="创建时间" width="180">
          <template #default="scope">
             {{ new Date(scope.row.timestamp).toLocaleString() }}
           </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="right">
          <template #default="scope">
            <el-popconfirm title="确定要回滚到此版本吗？当前未保存的修改将丢失。" @confirm="rollbackVersion(scope.row)">
              <template #reference>
                <el-button size="small" type="warning" :disabled="!projectStore.canEdit">回滚/切换</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- Help Dialog -->
    <el-dialog v-model="helpVisible" title="帮助 & 快捷键" width="500px">
      <div class="help-content">
        <h4>常用快捷键</h4>
        <el-table :data="[
          { key: 'Ctrl + S', desc: '保存项目' },
          { key: 'Ctrl + Z', desc: '撤销' },
          { key: 'Ctrl + Y', desc: '重做' },
          { key: 'Ctrl + C', desc: '复制组件' },
          { key: 'Ctrl + V', desc: '粘贴组件' },
          { key: 'Delete / Backspace', desc: '删除选中组件' },
        ]" border size="small">
          <el-table-column prop="key" label="按键" width="180">
            <template #default="{ row }"><kbd>{{ row.key }}</kbd></template>
          </el-table-column>
          <el-table-column prop="desc" label="功能" />
        </el-table>
        
        <h4 style="margin-top: 20px;">操作指南</h4>
        <ul style="padding-left: 20px; line-height: 1.8; color: var(--text-secondary);">
          <li>从左侧<b>组件库</b>拖拽组件到画布</li>
          <li>在右侧<b>配置面板</b>修改组件属性</li>
          <li>使用<b>图层面板</b>管理组件层级和锁定状态</li>
          <li>点击顶部<b>项目菜单</b>进行导入导出</li>
        </ul>
      </div>
    </el-dialog>

    <div class="editor-body">
      <Sidebar />
      <Canvas />
      <ConfigPanel />
    </div>
  </div>
</template>

<script setup>
import Sidebar from '@/components/Editor/Sidebar.vue'
import Canvas from '@/components/Editor/Canvas.vue'
import ConfigPanel from '@/components/Editor/ConfigPanel.vue'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ArrowRight, ArrowDown, Menu, QuestionFilled } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { onMounted, onUnmounted, ref, computed } from 'vue'

const store = useEditorStore()
const projectStore = useProjectStore()
const router = useRouter()

// --- Project UI State ---
const projectListVisible = ref(false)
const newProjectVisible = ref(false)
const versionHistoryVisible = ref(false)
const helpVisible = ref(false)
const newProjectName = ref('')

// Initialize
onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  await projectStore.loadProjects()
  // Check if we have a current project, if not, create default or prompt?
  // For simplicity, if no project is loaded, we might be editing "Untitled" in memory.
  // But let's try to auto-create one if list is empty to avoid confusion.
  if (projectStore.projects.length === 0) {
    // Optionally create a default project
    // const id = projectStore.createProject('我的大屏项目')
    // projectStore.currentProjectId = id
  } else if (!projectStore.currentProjectId) {
    // Maybe load the first one or just let the user be in "Detached" mode?
    // Let's stay in "Detached" mode (default editorStore behavior) until user explicitly opens a project.
    // Or better: Treat current editor content as "Unsaved Project" if not linked.
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// --- Project Commands ---
const handleProjectCommand = (command) => {
  switch (command) {
    case 'new':
      showNewProjectInput()
      break
    case 'open':
      projectListVisible.value = true
      break
    case 'save':
      handleSave()
      break
    case 'save_version':
      versionHistoryVisible.value = true
      break
    case 'history':
      versionHistoryVisible.value = true
      break
    case 'rename':
      handleRename()
      break
    case 'import':
      handleImport()
      break
    case 'export':
      handleExport()
      break
  }
}

// --- Project Logic ---

const showNewProjectInput = () => {
  newProjectName.value = ''
  newProjectVisible.value = true
}

const createNewProject = async () => {
  if (!newProjectName.value.trim()) {
    ElMessage.warning('请输入项目名称')
    return
  }
  
  // Create project
  const id = await projectStore.createProject(newProjectName.value)
  
  // Load it immediately (clears editor)
  projectStore.currentProjectId = id
  const content = await projectStore.getProjectContent(id)
  if (content) store.importProject(content)
  
  newProjectVisible.value = false
  projectListVisible.value = false
  ElMessage.success('项目已创建')
}

const loadProject = async (id) => {
  const content = await projectStore.getProjectContent(id)
  if (content) {
    projectStore.currentProjectId = id
    store.importProject(content)
    projectListVisible.value = false
    ElMessage.success('项目已加载')
  } else {
    ElMessage.error('无法加载项目内容')
  }
}

const deleteProject = (id) => {
  ElMessageBox.confirm('确定要删除该项目吗？此操作不可恢复。', '警告', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    projectStore.deleteProject(id).then((ok) => {
      if (ok) {
        ElMessage.success('项目已删除')
      } else {
        ElMessage.error('删除失败')
      }
    }).catch((e) => {
      ElMessage.error('删除失败: ' + (e?.message || '未知错误'))
    })
  }).catch(() => {})
}

const handleRename = () => {
  if (!projectStore.currentProject) return
  ElMessageBox.prompt('请输入新名称', '重命名项目', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: projectStore.currentProject.name
  }).then(({ value }) => {
    projectStore.renameProject(projectStore.currentProjectId, value)
    ElMessage.success('重命名成功')
  }).catch(() => {})
}

// --- Version Control ---

const currentVersions = computed(() => {
  return projectStore.currentProject?.versions || []
})

const createVersion = () => {
  if (!projectStore.currentProjectId) {
    ElMessage.warning('请先保存或打开一个项目')
    return
  }
  
  ElMessageBox.prompt('请输入版本名称 (可选)', '创建版本', {
    confirmButtonText: '创建',
    cancelButtonText: '取消',
  }).then(({ value }) => {
    const snapshot = {
      components: store.components,
      canvasConfig: store.canvasConfig
    }
    projectStore.createVersion(projectStore.currentProjectId, value, snapshot).then(() => {
      ElMessage.success('版本已创建')
    }).catch((e) => {
      ElMessage.error('创建版本失败: ' + (e?.message || '未知错误'))
    })
  }).catch(() => {})
}

const rollbackVersion = async (version) => {
  try {
    const snapshot = await projectStore.getVersionSnapshot(projectStore.currentProjectId, version.id)
    if (!snapshot) {
      ElMessage.error('该版本缺少快照数据')
      return
    }
    store.importProject(snapshot)
    ElMessage.success(`已切换到版本: ${version.name}`)
  } catch (e) {
    ElMessage.error('回滚失败: ' + (e?.message || '未知错误'))
  }
}

// --- Role Management ---
const handleRoleChange = () => {
  // Logic handled in store getters mostly
  // Just notify
  ElMessage.info(`当前身份: ${projectStore.currentUserRole === 'admin' ? '管理员' : projectStore.currentUserRole === 'editor' ? '编辑者' : '查看者'}`)
}


// --- Editor Actions ---

const handleKeydown = (e) => {
  // Check for permissions
  if (!projectStore.canEdit) return

  const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)

  // Save: Ctrl + S
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    handleSave()
    return
  }

  // Undo: Ctrl + Z
  if (e.ctrlKey && e.key === 'z') {
     if (isInput) return
     e.preventDefault()
     if (store.canUndo) {
       store.undo()
       ElMessage.info('已撤销')
     }
     return
  }

  // Redo: Ctrl + Y
  if (e.ctrlKey && e.key === 'y') {
     if (isInput) return
     e.preventDefault()
     if (store.canRedo) {
       store.redo()
       ElMessage.info('已重做')
     }
     return
  }

  // Delete: Delete or Backspace
  if (e.key === 'Delete' || (e.key === 'Backspace' && !isInput)) {
     if (store.activeComponentId) {
       e.preventDefault()
       store.removeComponent(store.activeComponentId)
       ElMessage.success('组件已删除')
     }
     return
  }

  // Check for Ctrl+C
  if (e.ctrlKey && e.key === 'c') {
    // Only copy if not focusing on input/textarea
    if (isInput) return
    e.preventDefault()
    store.copyComponent()
    if (store.activeComponent) {
      ElMessage.info('已复制组件')
    }
  }
  
  // Check for Ctrl+V
  if (e.ctrlKey && e.key === 'v') {
    if (isInput) return
    e.preventDefault()
    store.pasteComponent()
  }
}

const handleSave = async () => {
  if (!projectStore.canEdit) return

  // If no project is linked, ask to create new
  if (!projectStore.currentProjectId) {
    showNewProjectInput()
    return
  }
  
  const data = {
    components: store.components,
    canvasConfig: store.canvasConfig
  }
  try {
    await projectStore.saveProjectContent(projectStore.currentProjectId, data)
    store.saveProject()
    ElMessage.success('项目已保存')
  } catch (e) {
    ElMessage.error('保存失败: ' + (e?.message || '未知错误'))
  }
}

const toBase64 = (bytes) => {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

const fromBase64 = (b64) => {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

const deriveAesKey = async ({ password, salt, iterations }) => {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

const encryptProjectContent = async ({ password, content }) => {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const iterations = 120000
  const key = await deriveAesKey({ password, salt, iterations })
  const plaintext = new TextEncoder().encode(JSON.stringify(content))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return {
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations, salt: toBase64(salt) },
    alg: { name: 'AES-GCM', iv: toBase64(iv) },
    ciphertext: toBase64(new Uint8Array(ciphertext))
  }
}

const decryptProjectContent = async ({ password, cryptoPack }) => {
  const salt = fromBase64(cryptoPack.kdf.salt)
  const iv = fromBase64(cryptoPack.alg.iv)
  const iterations = cryptoPack.kdf.iterations
  const key = await deriveAesKey({ password, salt, iterations })
  const ciphertext = fromBase64(cryptoPack.ciphertext)
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  const text = new TextDecoder().decode(new Uint8Array(plainBuf))
  return JSON.parse(text)
}

const handleExport = async () => {
  const data = {
    meta: {
      type: 'BSP_PROJECT',
      version: '1.0',
      projectName: projectStore.currentProject?.name || 'Untitled',
      exportedAt: new Date().toISOString()
    },
    content: {
      components: store.components,
      canvasConfig: store.canvasConfig
    }
  }
  try {
    const { value: password } = await ElMessageBox.prompt('请输入导出密码', '导出项目', {
      confirmButtonText: '导出',
      cancelButtonText: '取消',
      inputType: 'password',
      inputPlaceholder: '用于加密导出的项目文件',
      inputValidator: (val) => (val && val.length >= 6 ? true : '密码至少 6 位')
    })

    const cryptoPack = await encryptProjectContent({ password, content: data.content })
    const filePayload = { meta: data.meta, crypto: cryptoPack }

    const blob = new Blob([JSON.stringify(filePayload)], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${data.meta.projectName}.bsp`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('项目已导出为加密 .bsp 文件')
  } catch (e) {
    if (e === 'cancel' || e?.message === 'cancel') return
    ElMessage.error('导出失败: ' + (e?.message || '未知错误'))
  }
}

const handleImport = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,.bsp'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const result = e.target.result
        let data
        
        // Try parsing as JSON first (Legacy support)
        try {
          data = JSON.parse(result)
        } catch (jsonErr) {
          // If failed, try decoding Base64 (BSP format)
          try {
             const decoded = decodeURIComponent(escape(atob(result)))
             data = JSON.parse(decoded)
          } catch (b64Err) {
             throw new Error('无法识别的文件格式')
          }
        }
        
        // Handle BSP format structure
        if (data?.meta?.type === 'BSP_PROJECT' && data?.crypto?.ciphertext) {
          const { value: password } = await ElMessageBox.prompt('请输入导入密码', '导入项目', {
            confirmButtonText: '导入',
            cancelButtonText: '取消',
            inputType: 'password',
            inputPlaceholder: '用于解密项目文件',
            inputValidator: (val) => (val && val.length >= 6 ? true : '密码至少 6 位')
          })
          const content = await decryptProjectContent({ password, cryptoPack: data.crypto })
          store.importProject(content)
          ElMessage.success(`已导入项目: ${data.meta.projectName}`)
        } else if (data.meta && data.meta.type === 'BSP_PROJECT') {
           store.importProject(data.content)
           ElMessage.success(`已导入项目: ${data.meta.projectName}`)
        } else {
           // Legacy JSON
           store.importProject(data)
           ElMessage.success('已导入旧版项目数据')
        }
        
      } catch (err) {
        console.error(err)
        ElMessage.error('导入失败: ' + err.message)
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

const handlePreview = () => {
  router.push('/preview')
}
</script>

<style scoped>
.editor-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-darker);
}

.editor-header {
  height: 60px; /* Increased height for better spacing */
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  position: relative;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 300px;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(90deg, var(--primary-color), #409eff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.5px;
  position: relative;
  margin-left: 24px; /* Separate distance from project menu */
}

.project-menu-trigger {
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  transition: all 0.3s;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}

.project-menu-trigger:hover {
  background-color: var(--bg-darker);
  color: var(--primary-color);
}

.current-project-info {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-darker);
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.center-actions {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

kbd {
  background-color: #eee;
  border-radius: 3px;
  border: 1px solid #b4b4b4;
  box-shadow: 0 1px 1px rgba(0,0,0,.2), 0 2px 0 0 rgba(255,255,255,.7) inset;
  color: #333;
  display: inline-block;
  font-size: .85em;
  font-weight: 700;
  line-height: 1;
  padding: 2px 4px;
  white-space: nowrap;
}
</style>
