<template>
  <div ref="chartRef" class="chart-container" style="width: 100%; height: 100%;"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import 'echarts-gl'
import 'echarts-liquidfill'
import { useDataSource } from '@/composables/useDataSource'
import { useEditorStore } from '@/store/editorStore'

// Shared state for map loading to avoid duplicate fetches
const registeredMaps = new Set()
const mapLoadingPromises = {}

const loadMap = (mapName) => {
  if (registeredMaps.has(mapName)) return Promise.resolve()
  if (mapLoadingPromises[mapName]) return mapLoadingPromises[mapName]

  if (mapName === 'china') {
    mapLoadingPromises[mapName] = fetch('/maps/china.json')
      .then(r => {
        if (!r.ok) throw new Error('Network response was not ok')
        return r.json()
      })
      .then(json => {
        echarts.registerMap('china', json)
        registeredMaps.add('china')
      })
      .catch(err => {
        console.error('Failed to load China map:', err)
        // Try fallback to remote if local fails (optional, but good practice)
        return fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
          .then(r => r.json())
          .then(json => {
             echarts.registerMap('china', json)
             registeredMaps.add('china')
          })
          .catch(e => {
             console.error('Fallback China map failed:', e)
             echarts.registerMap('china', { type: 'FeatureCollection', features: [] })
             registeredMaps.add('china')
          })
      })
      .finally(() => {
        delete mapLoadingPromises[mapName]
      })
    return mapLoadingPromises[mapName]
  }

  if (mapName === 'world') {
    mapLoadingPromises[mapName] = fetch('/maps/world.json')
      .then(r => {
        if (!r.ok) throw new Error('Network response was not ok')
        return r.json()
      })
      .then(json => {
        echarts.registerMap('world', json)
        registeredMaps.add('world')
      })
      .catch(err => {
        console.error('Failed to load World map:', err)
        // Fallback or empty
        echarts.registerMap('world', { type: 'FeatureCollection', features: [] })
        registeredMaps.add('world')
      })
      .finally(() => {
        delete mapLoadingPromises[mapName]
      })
    return mapLoadingPromises[mapName]
  }
  
  return Promise.resolve()
}

const checkAndRegisterMap = async (option) => {
  if (!option) return
  
  let mapName = option.geo?.map
  if (!mapName && option.series) {
    const mapSeries = option.series.find(s => s.type === 'map')
    if (mapSeries) mapName = mapSeries.map
  }

  if (mapName) {
    await loadMap(mapName)
  }
}

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

const store = useEditorStore()
const chartRef = ref(null)
let chartInstance = null

const { data, loading, error } = useDataSource(props.config)

const registerCurrentTheme = () => {
  const theme = store.currentTheme
  if (theme) {
    const echartsTheme = {
      color: theme.palette,
      backgroundColor: 'transparent',
      textStyle: {
        color: theme.textColor
      },
      title: {
        textStyle: {
          color: theme.textColor
        }
      },
      legend: {
        textStyle: {
          color: theme.textColor
        }
      },
      // Axis lines usually need contrast
      valueAxis: {
        axisLine: {
          lineStyle: {
            color: theme.textColor
          }
        },
        axisLabel: {
            color: theme.textColor
        }
      },
      categoryAxis: {
        axisLine: {
          lineStyle: {
            color: theme.textColor
          }
        },
        axisLabel: {
            color: theme.textColor
        }
      }
    }
    echarts.registerTheme(theme.id, echartsTheme)
    return theme.id
  }
  return undefined
}

const initChart = async () => {
  if (chartRef.value) {
    const themeName = registerCurrentTheme()
    
    // Ensure map data is loaded before init if needed
    if (props.config.option) {
      await checkAndRegisterMap(props.config.option)
    }
    
    if (!chartRef.value) return // Component might be unmounted

    chartInstance = echarts.init(chartRef.value, themeName)
    // Initialize with base option
    if (props.config.option) {
      chartInstance.setOption(props.config.option)
    }
    // Apply dynamic data if already available
    if (data.value) {
      chartInstance.setOption(data.value)
    }
  }
}

watch(() => store.currentThemeId, () => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  initChart()
})

// Watch base config changes
watch(() => props.config.option, async (newVal) => {
  if (chartInstance && newVal) {
    // Check if new option requires a map
    await checkAndRegisterMap(newVal)
    
    // If we re-init heavily, we might lose state, but setOption is safe.
    // However, if theme changed, we already disposed.
    // If option changed, just update.
    chartInstance.setOption(newVal)
  }
}, { deep: true })

// Watch dynamic data changes
watch(data, (newVal) => {
  if (chartInstance && newVal) {
    try {
      chartInstance.setOption(newVal)
    } catch (e) {
      console.error('Chart update failed', e)
    }
  }
}, { deep: true })

watch(() => [props.config.width, props.config.height], () => {
  if (chartInstance) {
    chartInstance.resize()
  }
})

onMounted(() => {
  initChart()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
})
</script>

<style scoped>
.chart-container {
  overflow: hidden;
}
</style>
