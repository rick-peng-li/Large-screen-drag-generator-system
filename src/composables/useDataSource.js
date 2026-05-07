import { ref, watch, onUnmounted } from 'vue'
import axios from 'axios'
import { generateMockData } from '@/utils/mockData'
import { processData } from '@/utils/dataProcessor'

export function useDataSource(config) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  let pollTimer = null
  let ws = null
  let mockTimer = null

  // Transform data based on user code
  const transformData = (rawData) => {
    try {
      return processData(rawData, config.dataSource?.transformation, config)
    } catch (err) {
      console.error('Data transformation failed:', err)
      error.value = 'Transformation Error: ' + err.message
      return rawData
    }
  }

  const fetchData = async () => {
    if (!config.dataSource) return

    const { type, api } = config.dataSource
    
    if (type === 'api' && api) {
      // If URL is empty, do nothing or handle as error?
      // For now, if no URL, we can't fetch.
      if (!api.url) return

      loading.value = true
      error.value = null
      
      try {
        // Mock API Request (Since backend is not available)
        // const response = await axios({
        //     url: api.url,
        //     method: api.method || 'GET'
        // })
        
        // Simulate Network Delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Use Mock Data
        const mockResponse = generateMockData(config)
        data.value = transformData(mockResponse)
      } catch (err) {
        error.value = err.message
        console.error('Fetch Error:', err)
      } finally {
        loading.value = false
      }
    }
  }

  const initWebSocket = () => {
    if (ws) ws.close()
    if (mockTimer) clearInterval(mockTimer)
    
    const { websocket } = config.dataSource
    if (!websocket || !websocket.url) return

    // MOCK MODE: Simulate WebSocket with interval
    try {
        // Simulate connection success
        console.log(`[Mock WS] Connected to ${websocket.url}`)
        
        mockTimer = setInterval(() => {
            const mockMsg = generateMockData(config)
            data.value = transformData(mockMsg)
        }, 3000) // Push every 3 seconds
        
    } catch (err) {
      error.value = 'WebSocket Connection Failed'
    }
  }

  const refresh = () => {
    const { type } = config.dataSource || {}
    if (type === 'api') {
      fetchData()
    } else if (type === 'static') {
      // For static data, we don't apply transformation, 
      // because static data is assumed to be already prepared/transformed by the user via the "Apply" button in ConfigPanel.
      data.value = config.dataSource.staticData || config.option || config.content
    }
  }

  // Watch for config changes
  watch(() => config.dataSource, (newVal, oldVal) => {
    // Clear previous timers/sockets
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
    if (mockTimer) {
      clearInterval(mockTimer)
      mockTimer = null
    }

    if (!newVal) return

    if (newVal.type === 'api') {
      fetchData()
      if (newVal.api && newVal.api.autoRefresh && newVal.api.refreshInterval > 0) {
        pollTimer = setInterval(fetchData, newVal.api.refreshInterval)
      }
    } else if (newVal.type === 'websocket') {
      initWebSocket()
    } else if (newVal.type === 'static') {
      // Use initial static data
      refresh()
    }
  }, { deep: true, immediate: true })

  // Also watch staticData specifically for changes in Static mode
  watch(() => config.dataSource?.staticData, (newVal) => {
    if (config.dataSource?.type === 'static') {
        data.value = newVal
    }
  }, { deep: true })

  onUnmounted(() => {
    if (pollTimer) clearInterval(pollTimer)
    if (ws) ws.close()
    if (mockTimer) clearInterval(mockTimer)
  })

  return {
    data,
    loading,
    error,
    refresh
  }
}
