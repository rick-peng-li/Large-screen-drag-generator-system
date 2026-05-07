import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { cloneDeep } from 'lodash'

const PROJECTS_KEY = 'editor_projects_list'
const PROJECT_CONTENT_PREFIX = 'editor_project_content_'
const IDB_DB_NAME = 'bsp_editor_storage'
const IDB_DB_VERSION = 1
const IDB_STORE = 'kv'

let dbPromise = null

const getDb = () => {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_DB_NAME, IDB_DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

const idbGet = async (key) => {
  const db = await getDb()
  if (!db) return undefined
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly')
    const store = tx.objectStore(IDB_STORE)
    const req = store.get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

const idbSet = async (key, value) => {
  const db = await getDb()
  if (!db) throw new Error('IndexedDB 不可用')
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    const store = tx.objectStore(IDB_STORE)
    const req = store.put(value, key)
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}

const idbDel = async (key) => {
  const db = await getDb()
  if (!db) return false
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    const store = tx.objectStore(IDB_STORE)
    const req = store.delete(key)
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}

const getProjectContentKey = (id) => `project:content:${id}`
const getVersionSnapshotKey = (projectId, versionId) => `project:version:${projectId}:${versionId}`

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [], // List of { id, name, createdAt, updatedAt, versions: [] }
    currentProjectId: null,
    
    // User Role State (Mocking Auth)
    currentUserRole: 'admin', // 'admin', 'editor', 'viewer'
  }),
  
  getters: {
    currentProject: (state) => state.projects.find(p => p.id === state.currentProjectId),
    
    canEdit: (state) => ['admin', 'editor'].includes(state.currentUserRole),
    canManage: (state) => ['admin'].includes(state.currentUserRole),
  },
  
  actions: {
    // --- Project Management ---
    
    async loadProjects() {
      const saved = localStorage.getItem(PROJECTS_KEY)
      if (saved) {
        try {
          this.projects = JSON.parse(saved)
        } catch (e) {
          console.error('Failed to load projects list', e)
          this.projects = []
        }
      }

      let updated = false
      for (const project of this.projects) {
        if (!Array.isArray(project.versions)) continue
        for (const version of project.versions) {
          if (version && version.data && !version.snapshotKey) {
            const snapshotKey = getVersionSnapshotKey(project.id, version.id)
            try {
              await idbSet(snapshotKey, version.data)
              version.snapshotKey = snapshotKey
              delete version.data
              updated = true
            } catch (e) {
              console.error('Failed to migrate version snapshot to IndexedDB', e)
            }
          }
        }
      }
      if (updated) this.saveProjectsList()
    },
    
    saveProjectsList() {
      try {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(this.projects))
      } catch (e) {
        const err = new Error('项目列表保存失败（可能超出存储上限）')
        err.cause = e
        throw err
      }
    },
    
    async createProject(name, initialData = null) {
      const id = uuidv4()
      const now = new Date().toISOString()
      const newProject = {
        id,
        name: name || '未命名项目',
        createdAt: now,
        updatedAt: now,
        versions: [] // Array of { id, name, timestamp, dataSnapshot }
      }
      
      this.projects.push(newProject)
      this.saveProjectsList()
      
      // Save initial content
      const content = initialData || {
        components: [],
        canvasConfig: { width: 1920, height: 1080, backgroundColor: '#f0f2f5' }
      }
      await this.saveProjectContent(id, content)
      
      return id
    },
    
    async deleteProject(id) {
      if (!this.canManage) return false
      
      const index = this.projects.findIndex(p => p.id === id)
      if (index !== -1) {
        this.projects.splice(index, 1)
        this.saveProjectsList()
        localStorage.removeItem(PROJECT_CONTENT_PREFIX + id)
        await idbDel(getProjectContentKey(id))
        if (this.currentProjectId === id) {
          this.currentProjectId = null
        }
        return true
      }
      return false
    },
    
    renameProject(id, newName) {
      if (!this.canEdit) return
      
      const project = this.projects.find(p => p.id === id)
      if (project) {
        project.name = newName
        project.updatedAt = new Date().toISOString()
        this.saveProjectsList()
      }
    },
    
    // --- Content Persistence ---
    
    async getProjectContent(id) {
      try {
        const stored = await idbGet(getProjectContentKey(id))
        if (stored) return stored
      } catch (e) {
        console.error('Failed to load project content from IndexedDB', e)
      }

      const saved = localStorage.getItem(PROJECT_CONTENT_PREFIX + id)
      if (!saved) return null

      try {
        const parsed = JSON.parse(saved)
        try {
          await idbSet(getProjectContentKey(id), parsed)
          localStorage.removeItem(PROJECT_CONTENT_PREFIX + id)
        } catch (e) {
          console.error('Failed to migrate project content to IndexedDB', e)
        }
        return parsed
      } catch (e) {
        console.error('Failed to load project content', e)
        return null
      }
    },
    
    async saveProjectContent(id, data) {
      if (!this.canEdit) return

      try {
        await idbSet(getProjectContentKey(id), cloneDeep(data))
      } catch (e) {
        try {
          localStorage.setItem(PROJECT_CONTENT_PREFIX + id, JSON.stringify(data))
        } catch (e2) {
          const err = new Error('项目保存失败（可能超出浏览器存储上限）')
          err.cause = e2
          throw err
        }
      }
      
      // Update timestamp
      const project = this.projects.find(p => p.id === id)
      if (project) {
        project.updatedAt = new Date().toISOString()
        this.saveProjectsList()
      }
    },
    
    // --- Version Control ---
    
    async createVersion(id, versionName, dataSnapshot) {
      if (!this.canEdit) return
      
      const project = this.projects.find(p => p.id === id)
      if (project) {
        const versionId = uuidv4()
        const snapshotKey = getVersionSnapshotKey(id, versionId)
        await idbSet(snapshotKey, cloneDeep(dataSnapshot))
        const version = {
          id: versionId,
          name: versionName || `Version ${project.versions.length + 1}`,
          timestamp: new Date().toISOString(),
          snapshotKey
        }
        project.versions.unshift(version) // Newest first
        this.saveProjectsList()
      }
    },
    
    getVersion(projectId, versionId) {
      const project = this.projects.find(p => p.id === projectId)
      if (project) {
        return project.versions.find(v => v.id === versionId)
      }
      return null
    },

    async getVersionSnapshot(projectId, versionId) {
      const version = this.getVersion(projectId, versionId)
      if (!version) return null
      if (version.data) return version.data
      const key = version.snapshotKey || getVersionSnapshotKey(projectId, versionId)
      try {
        const stored = await idbGet(key)
        return stored || null
      } catch (e) {
        console.error('Failed to load version snapshot from IndexedDB', e)
        return null
      }
    },
    
    // --- Role Management ---
    setRole(role) {
      this.currentUserRole = role
    }
  }
})
