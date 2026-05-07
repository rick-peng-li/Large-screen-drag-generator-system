import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { cloneDeep } from 'lodash'
import { presetThemes } from '@/utils/themes'

const SAVED_STATE_KEY = 'editor_project_data'

export const useEditorStore = defineStore('editor', {
  state: () => {
    // Initial state structure
    const initialState = {
      components: [], 
      activeComponentId: null,
      copiedComponent: null, // For copy/paste
      copiedStyle: null, // For style copy/paste
      canvasConfig: {
        width: 1920,
        height: 1080,
        backgroundColor: '#f0f2f5',
        preset: '1920x1080',
        adaptMode: 'contain',
        splicing: { rows: 1, cols: 1 }
      },
      // Theme State
      currentThemeId: 'default',
      customThemes: [], // User created themes
      // History for undo/redo
      history: [],
      historyIndex: -1
    }

    const saved = localStorage.getItem(SAVED_STATE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Merge saved data
        if (parsed.components) initialState.components = parsed.components
        if (parsed.canvasConfig) initialState.canvasConfig = parsed.canvasConfig
        if (parsed.currentThemeId) initialState.currentThemeId = parsed.currentThemeId
        if (parsed.customThemes) initialState.customThemes = parsed.customThemes
      } catch (e) {
        console.error('Failed to load project', e)
      }
    }
    return initialState
  },
  getters: {
    activeComponent: (state) => {
      return state.components.find(c => c.id === state.activeComponentId) || null
    },
    canUndo: (state) => state.historyIndex > 0,
    canRedo: (state) => state.historyIndex < state.history.length - 1,
    allThemes: (state) => [...presetThemes, ...state.customThemes],
    currentTheme: (state) => {
      const themes = [...presetThemes, ...state.customThemes]
      return themes.find(t => t.id === state.currentThemeId) || presetThemes[0]
    }
  },
  actions: {
    // ... existing actions ...
    
    // Theme Actions
    setTheme(themeId) {
      this.recordSnapshot()
      this.currentThemeId = themeId
      const theme = this.currentTheme
      
      // Apply theme to canvas
      this.canvasConfig.backgroundColor = theme.backgroundColor
      
      // Apply theme to existing components (optional, but requested by "Theme System")
      // We don't want to destructively overwrite all user customizations.
      // But usually "Switch Theme" implies updating charts to use the new palette.
      // ECharts handles this if we pass the theme object to init.
      // For text/containers, we might want to update default colors if they haven't been customized?
      // For now, let's just set the global theme state and canvas background.
      // The components will reactively pick up the theme in their renderers if configured.
      
      this.recordSnapshot()
    },
    
    addCustomTheme(theme) {
      this.customThemes.push(theme)
      // Persist immediately or rely on general state save
    },
    
    // Style Copy/Paste
    copyStyle() {
      if (!this.activeComponent) return
      // Extract style-related properties
      const { style, option, props } = this.activeComponent
      this.copiedStyle = cloneDeep({ style, option, props, type: this.activeComponent.type })
    },
    
    pasteStyle() {
      if (!this.activeComponent || !this.copiedStyle) return
      this.recordSnapshot()
      
      // Apply styles based on type compatibility
      // Basic styles apply to everyone
      if (this.copiedStyle.style) {
        this.activeComponent.style = { ...this.activeComponent.style, ...this.copiedStyle.style }
      }
      
      // Chart options - be careful not to overwrite data, just style
      if (this.activeComponent.type === 'chart' && this.copiedStyle.type === 'chart') {
        // Deep merge is complex, for now let's assume we copy the whole option
        // But the user might want to keep data.
        // Let's copy specific visual properties if possible, or just the whole option for now.
        // User requirement: "Style Reuse". 
        // For ECharts, "style" is mixed with data in "option". 
        // Let's just copy the whole option but warn/notify? 
        // Or better, try to preserve "series.data".
        // Simplest MVP: Copy everything.
        this.activeComponent.option = cloneDeep(this.copiedStyle.option)
      }
      
      this.recordSnapshot()
    },

    // Call this BEFORE making a change that should be undoable

    // Or call it AFTER initialization to set initial state
    recordSnapshot() {
      // If we are in the middle of history and make a change, discard future
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1)
      }
      
      const snapshot = cloneDeep({
        components: this.components,
        canvasConfig: this.canvasConfig
      })
      
      this.history.push(snapshot)
      this.historyIndex++
      
      // Limit history size
      if (this.history.length > 20) {
        this.history.shift()
        this.historyIndex--
      }
    },
    
    undo() {
      if (!this.canUndo) return
      this.historyIndex--
      const state = cloneDeep(this.history[this.historyIndex])
      this.components = state.components
      this.canvasConfig = state.canvasConfig
      this.activeComponentId = null // Clear selection on undo to avoid issues
    },
    
    redo() {
      if (!this.canRedo) return
      this.historyIndex++
      const state = cloneDeep(this.history[this.historyIndex])
      this.components = state.components
      this.canvasConfig = state.canvasConfig
      this.activeComponentId = null
    },

    addComponent(component) {
      this.recordSnapshot() // Record state BEFORE adding (Wait, usually we record AFTER? No, standard is: History = [State0, State1, State2])
      // Actually, if we want to undo TO the previous state, we need the previous state in history.
      // So if history is empty, we should record initial state first.
      if (this.history.length === 0) {
        this.recordSnapshot() // Record initial empty state
      }

      const newComponent = cloneDeep(component)
      newComponent.id = uuidv4()
      newComponent.x = component.x !== undefined ? component.x : 0
      newComponent.y = component.y !== undefined ? component.y : 0
      newComponent.zIndex = this.components.length + 1
      newComponent.rotation = 0
      newComponent.locked = false
      
      // Initialize Data Source Config
      newComponent.dataSource = {
        type: 'static',
        staticData: newComponent.option || newComponent.content || {}, // Initial data
        api: {
          url: '',
          method: 'GET',
          refreshInterval: 5000,
          autoRefresh: false
        },
        websocket: {
          url: ''
        },
        transformation: {
          enable: false,
          mode: 'code',
          code: 'return data',
          visualConfig: {
            rename: {},
            filters: [],
            calculations: [],
            aggregation: {
              enable: false,
              groupBy: [],
              metrics: []
            }
          }
        }
      }

      this.components.push(newComponent)
      this.setActiveComponent(newComponent.id)
      
      this.recordSnapshot() // Record new state
    },
    
    removeComponent(id) {
      if (this.history.length === 0) this.recordSnapshot()
      
      this.components = this.components.filter(c => c.id !== id)
      if (this.activeComponentId === id) {
        this.activeComponentId = null
      }
      
      this.recordSnapshot()
    },
    
    setActiveComponent(id) {
      this.activeComponentId = id
    },
    
    updateComponent(id, payload) {
      // Note: We don't record snapshot here automatically because this might be called frequently (drag)
      // The caller should call recordSnapshot when operation is done
      const component = this.components.find(c => c.id === id)
      if (component) {
        Object.assign(component, payload)
      }
    },
    
    updateCanvasConfig(config) {
      if (this.history.length === 0) this.recordSnapshot()
      Object.assign(this.canvasConfig, config)
      this.recordSnapshot()
    },
    
    saveProject() {
      // Don't save history to local storage to keep it light
      const dataToSave = {
        components: this.components,
        canvasConfig: this.canvasConfig
      }
      try {
        localStorage.setItem(SAVED_STATE_KEY, JSON.stringify(dataToSave))
      } catch (e) {
        const err = new Error('本地自动保存失败（可能超出浏览器存储上限）')
        err.cause = e
        throw err
      }
    },

    importProject(data) {
      if (data.components) {
        this.components = cloneDeep(data.components)
        // Ensure backward compatibility
        this.components.forEach(c => {
          if (c.rotation === undefined) c.rotation = 0
          if (c.locked === undefined) c.locked = false
        })
      }
      if (data.canvasConfig) {
        this.canvasConfig = cloneDeep(data.canvasConfig)
        if (!this.canvasConfig.preset) this.canvasConfig.preset = `${this.canvasConfig.width}x${this.canvasConfig.height}`
        if (!this.canvasConfig.adaptMode) this.canvasConfig.adaptMode = 'contain'
        if (!this.canvasConfig.splicing) this.canvasConfig.splicing = { rows: 1, cols: 1 }
      }
      this.activeComponentId = null
      this.history = []
      this.historyIndex = -1
      this.recordSnapshot() // Initial state for the imported project
      this.saveProject() // Auto-save to local storage
    },

    copyComponent() {
      if (!this.activeComponent) return
      this.copiedComponent = cloneDeep(this.activeComponent)
    },

    pasteComponent() {
      if (!this.copiedComponent) return

      this.recordSnapshot()

      const newComponent = cloneDeep(this.copiedComponent)
      newComponent.id = uuidv4()
      // Offset slightly to be visible
      newComponent.x += 20
      newComponent.y += 20
      newComponent.zIndex = this.components.length + 1
      
      this.components.push(newComponent)
      this.setActiveComponent(newComponent.id)
      
      this.recordSnapshot()
    },

    toggleLock(id) {
      const component = this.components.find(c => c.id === id)
      if (component) {
        component.locked = !component.locked
        // If locking, maybe deselect? Or allow selection but no edit?
        // Let's keep selection to allow unlocking
        this.recordSnapshot()
      }
    }
  }
})
