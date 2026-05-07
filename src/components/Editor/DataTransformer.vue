<template>
  <div class="data-transformer">
    <div class="transformer-header">
      <el-radio-group v-model="config.mode" size="small">
        <el-radio-button value="code">代码模式</el-radio-button>
        <el-radio-button value="visual">可视化模式</el-radio-button>
      </el-radio-group>
    </div>

    <!-- Data Guide & Preview Toggle -->
    <div class="guide-section">
       <el-alert
         v-if="guideText"
         :title="guideText.title"
         :description="guideText.desc"
         type="info"
         show-icon
         :closable="false"
         style="margin-bottom: 8px"
       />
       <div class="preview-toggle">
          <el-button size="small" link @click="showPreview = !showPreview">
            {{ showPreview ? '隐藏数据预览' : '显示数据预览' }}
          </el-button>
       </div>
    </div>

    <!-- Live Preview Panel -->
    <div v-if="showPreview" class="preview-panel">
      <div class="preview-col">
        <div class="preview-title">输入数据 (API/Mock)</div>
        <pre class="json-viewer">{{ JSON.stringify(sampleData, null, 2) }}</pre>
      </div>
      <div class="preview-arrow">→</div>
      <div class="preview-col">
        <div class="preview-title">输出数据 (应用到组件)</div>
        <pre class="json-viewer highlight">{{ transformError || JSON.stringify(previewTransformed, null, 2) }}</pre>
      </div>
    </div>

    <div v-if="config.mode === 'code'" class="code-mode">
      <div class="code-help">参数 data 为原始数据，请返回处理后的数据</div>
      <el-input 
        v-model="config.code" 
        type="textarea" 
        :rows="10" 
        placeholder="return data.map(item => ...)"
        class="code-input"
      />
    </div>

    <div v-else class="visual-mode">
      <el-collapse v-model="activeNames">
        <!-- 0. 数据提取 -->
        <el-collapse-item title="0. 数据提取" name="extract">
           <div class="help-text">如果API返回包含在对象中（如 { code: 200, data: [...] }），请指定数组所在的路径。</div>
           <div class="mapping-item">
             <span class="label">数据路径:</span>
             <el-input v-model="config.visualConfig.dataPath" placeholder="例如: data.list 或 result" size="small" />
           </div>
        </el-collapse-item>

        <!-- 1. 字段重命名 -->
        <el-collapse-item title="1. 字段重命名" name="rename">
          <div v-for="(target, source, index) in config.visualConfig.rename" :key="index" class="rename-item">
            <el-select 
                v-model="renameKeys[index]" 
                placeholder="原字段名" 
                size="small" 
                allow-create 
                filterable 
                default-first-option
                @change="updateRenameKey(source, index)"
                style="flex: 1"
            >
               <el-option v-for="field in availableFields" :key="field" :label="field" :value="field" />
            </el-select>
            <span class="arrow">→</span>
            <el-input v-model="config.visualConfig.rename[source]" placeholder="新字段名" size="small" style="flex: 1" />
            <el-button type="danger" link icon="Delete" @click="removeRename(source)" />
          </div>
          <el-button class="add-btn" icon="Plus" size="small" @click="addRename">添加重命名</el-button>
        </el-collapse-item>

        <!-- 2. 数据过滤 -->
        <el-collapse-item title="2. 数据过滤" name="filter">
          <div v-for="(filter, index) in config.visualConfig.filters" :key="index" class="filter-item">
            <el-select 
                v-model="filter.field" 
                placeholder="字段名" 
                size="small" 
                allow-create 
                filterable 
                default-first-option
                style="flex: 2"
            >
               <el-option v-for="field in availableFields" :key="field" :label="field" :value="field" />
            </el-select>
            <el-select v-model="filter.operator" placeholder="操作符" size="small" style="flex: 1; min-width: 80px">
              <el-option label="等于" value="==" />
              <el-option label="不等于" value="!=" />
              <el-option label="大于" value=">" />
              <el-option label="小于" value="<" />
              <el-option label="包含" value="includes" />
            </el-select>
            <el-input v-model="filter.value" placeholder="值" size="small" style="flex: 2" />
            <el-button type="danger" link icon="Delete" @click="removeFilter(index)" />
          </div>
          <el-button class="add-btn" icon="Plus" size="small" @click="addFilter">添加过滤条件</el-button>
        </el-collapse-item>

        <!-- 3. 计算字段 -->
        <el-collapse-item title="3. 计算字段" name="calculate">
          <div class="help-text">支持简单的 JS 表达式，如: price * count</div>
          <div v-for="(calc, index) in config.visualConfig.calculations" :key="index" class="calc-item">
            <el-input v-model="calc.targetField" placeholder="新字段名" size="small" style="flex: 1" />
            <span class="eq">=</span>
            <el-input v-model="calc.expression" placeholder="表达式 (例如: a + b)" size="small" style="flex: 2" />
            <el-button type="danger" link icon="Delete" @click="removeCalculation(index)" />
          </div>
          <el-button class="add-btn" icon="Plus" size="small" @click="addCalculation">添加计算字段</el-button>
        </el-collapse-item>

        <!-- 4. 数据聚合 -->
        <el-collapse-item title="4. 数据聚合" name="aggregate">
          <el-switch v-model="config.visualConfig.aggregation.enable" active-text="启用聚合" size="small" style="margin-bottom: 16px"/>
          <div v-if="config.visualConfig.aggregation.enable">
            <div class="agg-section">
              <div class="label">分组字段 (Group By):</div>
              <div v-for="(field, index) in config.visualConfig.aggregation.groupBy" :key="'g'+index" class="group-item">
                <el-select 
                    v-model="config.visualConfig.aggregation.groupBy[index]" 
                    placeholder="选择字段"
                    size="small" 
                    allow-create 
                    filterable 
                    default-first-option
                    style="flex: 1"
                >
                   <el-option v-for="f in availableFields" :key="f" :label="f" :value="f" />
                </el-select>
                <el-button type="danger" link icon="Delete" @click="removeGroupBy(index)" />
              </div>
              <el-button class="add-btn" icon="Plus" size="small" @click="addGroupBy">添加分组字段</el-button>
            </div>
            
            <div class="agg-section">
              <div class="label">指标 (Metrics):</div>
              <div v-for="(metric, index) in config.visualConfig.aggregation.metrics" :key="'m'+index" class="metric-item">
                <el-select 
                    v-model="metric.field" 
                    placeholder="字段" 
                    size="small" 
                    allow-create 
                    filterable 
                    default-first-option
                    style="flex: 2"
                >
                   <el-option v-for="f in availableFields" :key="f" :label="f" :value="f" />
                </el-select>
                <el-select v-model="metric.type" placeholder="函数" size="small" style="flex: 1; min-width: 80px">
                  <el-option label="求和 (Sum)" value="sum" />
                  <el-option label="计数 (Count)" value="count" />
                  <el-option label="平均 (Avg)" value="avg" />
                  <el-option label="最大 (Max)" value="max" />
                  <el-option label="最小 (Min)" value="min" />
                </el-select>
                <el-input v-model="metric.alias" placeholder="别名" size="small" style="flex: 1" />
                <el-button type="danger" link icon="Delete" @click="removeMetric(index)" />
              </div>
              <el-button class="add-btn" icon="Plus" size="small" @click="addMetric">添加指标</el-button>
            </div>
          </div>
        </el-collapse-item>

        <!-- 5. 组件映射 -->
        <el-collapse-item title="5. 组件映射" name="mapping" v-if="componentType === 'chart'">
           <div class="help-text">将处理后的数据映射到图表坐标轴或数据项</div>
           
           <div class="mapping-item">
             <span class="label">映射模式:</span>
             <el-radio-group v-model="config.visualConfig.mapping.mode" size="small">
                <el-radio-button value="axis">坐标轴 (柱/折线)</el-radio-button>
                <el-radio-button value="item">数据项 (饼图)</el-radio-button>
             </el-radio-group>
           </div>

           <div v-if="config.visualConfig.mapping.mode === 'axis'">
             <div class="mapping-item">
               <span class="label">维度 (X轴):</span>
               <el-select 
                    v-model="config.visualConfig.mapping.dimension" 
                    placeholder="选择字段 (例如: date)" 
                    size="small" 
                    allow-create 
                    filterable 
                    default-first-option
                >
                   <el-option v-for="f in availableFieldsAfterAgg" :key="f" :label="f" :value="f" />
                </el-select>
             </div>
             <div class="mapping-item">
               <span class="label">度量 (Y轴):</span>
               <el-select 
                    v-model="config.visualConfig.mapping.measure" 
                    placeholder="选择字段 (例如: value)" 
                    size="small" 
                    allow-create 
                    filterable 
                    default-first-option
                >
                   <el-option v-for="f in availableFieldsAfterAgg" :key="f" :label="f" :value="f" />
                </el-select>
             </div>
           </div>

           <div v-if="config.visualConfig.mapping.mode === 'item'">
             <div class="mapping-item">
               <span class="label">名称字段:</span>
               <el-select 
                    v-model="config.visualConfig.mapping.nameField" 
                    placeholder="选择字段 (例如: name)" 
                    size="small" 
                    allow-create 
                    filterable 
                    default-first-option
                >
                   <el-option v-for="f in availableFieldsAfterAgg" :key="f" :label="f" :value="f" />
                </el-select>
             </div>
             <div class="mapping-item">
               <span class="label">值字段:</span>
               <el-select 
                    v-model="config.visualConfig.mapping.valueField" 
                    placeholder="选择字段 (例如: value)" 
                    size="small" 
                    allow-create 
                    filterable 
                    default-first-option
                >
                   <el-option v-for="f in availableFieldsAfterAgg" :key="f" :label="f" :value="f" />
                </el-select>
             </div>
           </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { processData } from '@/utils/dataProcessor'

const props = defineProps({
  componentType: {
    type: String,
    default: ''
  },
  componentInfo: {
    type: Object,
    default: () => ({})
  },
  sampleData: {
    type: [Object, Array, String],
    default: null
  },
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
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
        },
        mapping: {
          mode: 'axis',
          dimension: '',
          measure: '',
          nameField: '',
          valueField: ''
        }
      }
    })
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const config = ref(props.modelValue)
const activeNames = ref(['rename', 'mapping'])
const showPreview = ref(true)

// Ensure visualConfig structure exists
const ensureConfig = () => {
    if (!config.value.visualConfig) {
      config.value.visualConfig = {
        dataPath: '',
        rename: {},
        filters: [],
        calculations: [],
        aggregation: {
          enable: false,
          groupBy: [],
          metrics: []
        },
        mapping: { mode: 'axis', dimension: '', measure: '', nameField: '', valueField: '' }
      }
    }
    if (!config.value.visualConfig.mapping) {
      config.value.visualConfig.mapping = { mode: 'axis', dimension: '', measure: '', nameField: '', valueField: '' }
    }
    if (!config.value.mode) {
      config.value.mode = 'code'
    }
}
ensureConfig()

// Helper to manage rename keys
const renameKeys = ref(Object.keys(config.value.visualConfig.rename || {}))

watch(() => props.modelValue, (newVal) => {
  config.value = newVal
  ensureConfig()
  renameKeys.value = Object.keys(config.value.visualConfig.rename || {})
}, { deep: true })

watch(config, (newVal) => {
  emit('update:modelValue', newVal)
  emit('change')
}, { deep: true })

// --- Preview Logic ---
const transformError = ref(null)
const previewTransformed = computed(() => {
  transformError.value = null
  if (!props.sampleData) return null
  
  try {
    // Only enable preview if transform is enabled (conceptually), but we want to show preview even if user is just editing config
    // So we force enable:true in a temporary config object for preview purposes
    const previewConfig = {
        ...config.value,
        enable: true 
    }
    return processData(props.sampleData, previewConfig, props.componentInfo)
  } catch (err) {
    transformError.value = err.message
    return null
  }
})

// --- Field Extraction for Dropdowns ---
// Extract fields from sample data (assuming array of objects)
const availableFields = computed(() => {
    let data = props.sampleData
    
    // Apply path extraction first if needed
    if (config.value.visualConfig?.dataPath) {
        const path = config.value.visualConfig.dataPath.split('.')
        for (const key of path) {
            if (data && data[key] !== undefined) data = data[key]
        }
    }
    
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
        return Object.keys(data[0])
    }
    return []
})

// Fields available after transformation (for mapping)
// This is harder because it depends on previous steps.
// For simplicity, we use availableFields + renamed fields + calculated fields
const availableFieldsAfterAgg = computed(() => {
    const fields = new Set(availableFields.value)
    
    // Add calculated fields
    if (config.value.visualConfig?.calculations) {
        config.value.visualConfig.calculations.forEach(c => {
            if (c.targetField) fields.add(c.targetField)
        })
    }
    
    // Handle renames
    if (config.value.visualConfig?.rename) {
        Object.values(config.value.visualConfig.rename).forEach(val => fields.add(val))
    }
    
    // If aggregation is enabled, fields are restricted to groupBy + metrics
    if (config.value.visualConfig?.aggregation?.enable) {
        const aggFields = new Set()
        config.value.visualConfig.aggregation.groupBy?.forEach(f => aggFields.add(f))
        config.value.visualConfig.aggregation.metrics?.forEach(m => {
            if (m.alias) aggFields.add(m.alias)
            else if (m.field) aggFields.add(`${m.field}_${m.type}`)
        })
        return Array.from(aggFields)
    }
    
    return Array.from(fields)
})


// --- Guide Logic ---
const guideText = computed(() => {
    if (!props.componentInfo) return null
    
    const key = props.componentInfo.key || ''
    const type = props.componentType || ''
    
    if (type === 'chart') {
        if (key.includes('pie') || key.includes('scatter') || key.includes('funnel')) {
             return {
                 title: '饼图/散点图 数据要求',
                 desc: '请使用「组件映射」将数据转换为: { name: "名称", value: 123 } 格式。模式选择 "数据项"。'
             }
        }
        if (key.includes('radar')) {
             return {
                 title: '雷达图 数据要求',
                 desc: '雷达图结构较为复杂，建议使用代码模式返回 { radar: { indicator: [...] }, series: [...] }'
             }
        }
        // Default Bar/Line
        return {
            title: '柱状图/折线图 数据要求',
            desc: '请使用「组件映射」指定 X轴字段(维度) 和 Y轴字段(度量)。系统将自动转换为 { xAxis: [...], series: [...] }。'
        }
    }
    
    if (type === 'text') {
        return {
            title: '文本组件 数据要求',
            desc: '转换结果应直接返回字符串，或返回包含 { content: "..." } 的对象。'
        }
    }
    
    return null
})

// --- Actions ---

const addRename = () => {
  const tempKey = 'field_' + Date.now()
  config.value.visualConfig.rename[tempKey] = 'new_field'
  renameKeys.value.push(tempKey)
}

const updateRenameKey = (oldKey, index) => {
  const newKey = renameKeys.value[index]
  if (newKey !== oldKey) {
    const value = config.value.visualConfig.rename[oldKey]
    delete config.value.visualConfig.rename[oldKey]
    config.value.visualConfig.rename[newKey] = value
  }
}

const removeRename = (key) => {
  delete config.value.visualConfig.rename[key]
  renameKeys.value = Object.keys(config.value.visualConfig.rename)
}

const addFilter = () => {
  config.value.visualConfig.filters.push({ field: '', operator: '==', value: '' })
}
const removeFilter = (index) => {
  config.value.visualConfig.filters.splice(index, 1)
}

const addCalculation = () => {
  config.value.visualConfig.calculations.push({ targetField: '', expression: '' })
}
const removeCalculation = (index) => {
  config.value.visualConfig.calculations.splice(index, 1)
}

const addGroupBy = () => {
  if (!config.value.visualConfig.aggregation.groupBy) config.value.visualConfig.aggregation.groupBy = []
  config.value.visualConfig.aggregation.groupBy.push('')
}
const removeGroupBy = (index) => {
  config.value.visualConfig.aggregation.groupBy.splice(index, 1)
}
const addMetric = () => {
  if (!config.value.visualConfig.aggregation.metrics) config.value.visualConfig.aggregation.metrics = []
  config.value.visualConfig.aggregation.metrics.push({ field: '', type: 'sum', alias: '' })
}
const removeMetric = (index) => {
  config.value.visualConfig.aggregation.metrics.splice(index, 1)
}

</script>

<style scoped>
.data-transformer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transformer-header {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.code-help, .help-text {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

/* Visual Mode Styles */
.visual-mode {
  padding: 4px;
}

:deep(.el-collapse) {
  border-top: none;
  border-bottom: none;
  --el-collapse-header-height: 40px;
}

:deep(.el-collapse-item) {
  margin-bottom: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

:deep(.el-collapse-item__header) {
  padding: 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  background-color: var(--bg-darker);
  border-bottom: 1px solid var(--border-color);
  height: 40px;
  line-height: 40px;
}

:deep(.el-collapse-item__wrap) {
  border-bottom: none;
  background-color: transparent;
}

:deep(.el-collapse-item__content) {
  padding: 16px;
  padding-bottom: 8px; /* Offset for last item margin */
  background-color: var(--bg-panel);
}

.rename-item, .filter-item, .calc-item, .metric-item, .group-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  background: var(--bg-darker);
  padding: 8px;
  border-radius: 4px;
  border: 1px dashed var(--border-color-lighter, #dcdfe6);
}

.rename-item:hover, .filter-item:hover, .calc-item:hover, .metric-item:hover, .group-item:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
}

.add-btn {
  width: 100%;
  margin-top: 8px;
  border-style: dashed;
  border-color: var(--border-color);
  color: var(--text-secondary);
}

.add-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.arrow, .eq {
  color: var(--text-secondary);
  font-weight: bold;
  padding: 0 4px;
}

.agg-section {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-darker);
}

.agg-section .label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: block;
}

.mapping-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.mapping-item .label {
  font-size: 13px;
  color: var(--text-secondary);
  width: 80px;
  text-align: right;
  flex-shrink: 0;
}

/* Preview Panel Styles */
.preview-panel {
    display: flex;
    align-items: stretch;
    background: var(--bg-darker);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    margin-bottom: 12px;
    overflow: hidden;
}

.preview-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0; /* fix flex text overflow */
}

.preview-title {
    font-size: 11px;
    padding: 4px 8px;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border-color);
    color: var(--text-secondary);
}

.json-viewer {
    flex: 1;
    margin: 0;
    padding: 8px;
    font-family: monospace;
    font-size: 11px;
    overflow: auto;
    max-height: 200px;
    color: var(--text-secondary);
}

.json-viewer.highlight {
    color: var(--primary-color);
}

.preview-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    background: var(--bg-panel);
    border-left: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
    color: var(--text-secondary);
}

.guide-section {
    display: flex;
    flex-direction: column;
}
.preview-toggle {
    display: flex;
    justify-content: flex-end;
}
</style>