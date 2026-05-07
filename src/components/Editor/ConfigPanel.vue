<template>
  <div class="config-panel" v-if="component">
    <!-- Block Interaction Overlay if no permission -->
    <div v-if="!projectStore.canEdit" class="read-only-overlay"></div>

    <div class="panel-header">
      <span>属性配置</span>
      <div class="header-actions">
        <el-tooltip content="复制样式">
          <el-button link size="small" @click="store.copyStyle()" :disabled="!projectStore.canEdit">
            <el-icon><CopyDocument /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="粘贴样式">
          <el-button link size="small" @click="store.pasteStyle()" :disabled="!store.copiedStyle || !projectStore.canEdit">
            <el-icon><DocumentCopy /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>
    
    <el-tabs v-model="activeTab">
      <el-tab-pane label="基础" name="basic">
        <el-form label-position="top" size="small">
          <el-form-item label="不透明度">
             <el-slider v-model="component.opacity" :min="0" :max="1" :step="0.01" @change="store.recordSnapshot()" />
          </el-form-item>
          <el-form-item label="X 坐标">
            <el-input-number v-model="component.x" @change="store.recordSnapshot()" />
          </el-form-item>
          <el-form-item label="Y 坐标">
            <el-input-number v-model="component.y" @change="store.recordSnapshot()" />
          </el-form-item>
          <el-form-item label="宽度">
            <el-input-number v-model="component.width" @change="store.recordSnapshot()" />
          </el-form-item>
          <el-form-item label="高度">
            <el-input-number v-model="component.height" @change="store.recordSnapshot()" />
          </el-form-item>
          <el-form-item label="旋转角度">
            <el-input-number v-model="component.rotation" :min="0" :max="360" @change="store.recordSnapshot()" />
          </el-form-item>
          <el-form-item label="层级 (Z-Index)">
            <el-input-number v-model="component.zIndex" @change="store.recordSnapshot()" />
          </el-form-item>
          <el-form-item label="锁定状态">
             <el-switch 
               v-model="component.locked" 
               active-text="已锁定" 
               inactive-text="未锁定" 
               @change="store.recordSnapshot()" 
               style="--el-switch-on-color: #ff4949; --el-switch-off-color: #13ce66"
             />
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <el-tab-pane label="样式" name="style" v-if="hasStyle">
        <template v-if="component.type === 'text'">
          <el-form label-position="top" size="small">
            <el-row :gutter="10">
              <el-col :span="12">
                <el-form-item label="字体大小">
                  <el-input v-model="component.style.fontSize" @change="store.recordSnapshot()">
                    <template #append>px</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="字体颜色">
                  <div class="color-picker-wrapper">
                    <el-color-picker v-model="component.style.color" @change="store.recordSnapshot()" />
                    <span class="color-text">{{ component.style.color }}</span>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </template>
        
        <template v-else-if="component.type === 'container' || component.type === 'decoration'">
          <el-form label-position="top" size="small">
             <el-form-item label="背景颜色">
               <div class="color-picker-wrapper">
                 <el-color-picker v-model="component.style.backgroundColor" show-alpha @change="store.recordSnapshot()" />
                 <span class="color-text">{{ component.style.backgroundColor || 'Transparent' }}</span>
               </div>
             </el-form-item>
             
             <el-divider content-position="left">边框与圆角</el-divider>
             <el-form-item label="边框">
               <el-input v-model="component.style.border" placeholder="e.g. 1px solid #fff" @change="store.recordSnapshot()" />
             </el-form-item>
             <el-form-item label="圆角">
               <el-input v-model="component.style.borderRadius" placeholder="e.g. 4px" @change="store.recordSnapshot()" />
             </el-form-item>
             
             <el-divider content-position="left">阴影效果</el-divider>
             <el-form-item label="阴影">
               <el-input v-model="component.style.boxShadow" placeholder="CSS box-shadow" @change="store.recordSnapshot()" />
             </el-form-item>

             <!-- Tab Configuration -->
             <template v-if="component.key === 'layout-tabs'">
               <el-divider content-position="left">Tab 页签配置</el-divider>
               <el-form-item label="当前激活索引">
                 <el-input-number v-model="component.props.activeIndex" :min="0" :max="(component.props.tabs?.length || 1) - 1" @change="store.recordSnapshot()" />
               </el-form-item>
               <div class="section-group">
                 <div class="section-title">
                   <span>页签列表</span>
                   <el-button link type="primary" size="small" @click="addTabItem">添加</el-button>
                 </div>
                 <div v-for="(tab, idx) in component.props.tabs" :key="idx" class="list-item-config">
                   <div class="item-header">
                     <span>Tab {{ idx + 1 }}</span>
                     <el-button link type="danger" size="small" @click="removeTabItem(idx)" :disabled="component.props.tabs.length <= 1">删除</el-button>
                   </div>
                   <el-form-item label="标题">
                     <el-input v-model="tab.label" @change="store.recordSnapshot()" />
                   </el-form-item>
                   <el-form-item label="内容">
                     <el-input v-model="tab.content" type="textarea" :rows="2" @change="store.recordSnapshot()" />
                   </el-form-item>
                 </div>
               </div>
             </template>

             <!-- Carousel Configuration -->
             <template v-if="component.key === 'layout-carousel'">
               <el-divider content-position="left">轮播配置</el-divider>
               <el-row :gutter="10">
                 <el-col :span="12">
                   <el-form-item label="自动播放">
                     <el-switch v-model="component.props.autoplay" @change="store.recordSnapshot()" />
                   </el-form-item>
                 </el-col>
                 <el-col :span="12">
                   <el-form-item label="间隔 (ms)">
                     <el-input-number v-model="component.props.interval" :min="500" :step="500" @change="store.recordSnapshot()" />
                   </el-form-item>
                 </el-col>
               </el-row>
               
               <div class="section-group">
                 <div class="section-title">
                   <span>轮播项列表</span>
                   <el-button link type="primary" size="small" @click="addSlideItem">添加</el-button>
                 </div>
                 <div v-for="(slide, idx) in component.props.slides" :key="idx" class="list-item-config">
                   <div class="item-header">
                     <span>Slide {{ idx + 1 }}</span>
                     <el-button link type="danger" size="small" @click="removeSlideItem(idx)" :disabled="component.props.slides.length <= 1">删除</el-button>
                   </div>
                   <el-form-item label="内容文本">
                     <el-input v-model="slide.content" type="textarea" :rows="2" @change="store.recordSnapshot()" />
                   </el-form-item>
                   <el-form-item label="背景色">
                     <div class="color-picker-wrapper">
                       <el-color-picker v-model="slide.background" show-alpha @change="store.recordSnapshot()" />
                       <span class="color-text">{{ slide.background || 'Transparent' }}</span>
                     </div>
                   </el-form-item>
                 </div>
               </div>
             </template>

          </el-form>
        </template>

        <template v-else-if="component.type === 'widget'">
           <el-form label-position="top" size="small">
              <el-form-item label="组件属性 (JSON)">
                <el-input 
                  v-model="propsStr" 
                  type="textarea" 
                  :rows="8" 
                  @change="updateProps"
                  class="code-input"
                />
              </el-form-item>
           </el-form>
        </template>

        <template v-else-if="component.type === 'chart'">
          <el-form label-position="top" size="small">
            <div class="section-group">
              <div class="section-title">通用配置</div>
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-form-item label="图例">
                    <el-switch 
                      v-model="chartConfig.legendShow" 
                      @change="updateChartConfig('legend.show', $event)" 
                      active-text="显示"
                      inactive-text="隐藏"
                      inline-prompt
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="提示框">
                    <el-switch 
                      v-model="chartConfig.tooltipShow" 
                      @change="updateChartConfig('tooltip.show', $event)" 
                      active-text="开启"
                      inactive-text="关闭"
                      inline-prompt
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
            
            <div class="section-group">
              <div class="section-title">边距设置 (Grid)</div>
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-form-item label="上边距">
                    <el-input v-model="chartConfig.gridTop" @change="updateChartConfig('grid.top', $event)" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="下边距">
                    <el-input v-model="chartConfig.gridBottom" @change="updateChartConfig('grid.bottom', $event)" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="左边距">
                    <el-input v-model="chartConfig.gridLeft" @change="updateChartConfig('grid.left', $event)" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="右边距">
                    <el-input v-model="chartConfig.gridRight" @change="updateChartConfig('grid.right', $event)" />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <div class="section-group">
              <div class="section-title">坐标轴</div>
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-form-item label="X 轴">
                     <el-switch 
                      v-model="chartConfig.xAxisShow" 
                      @change="updateChartConfig('xAxis.show', $event)" 
                      active-text="显示"
                      inactive-text="隐藏"
                      inline-prompt
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                   <el-form-item label="Y 轴">
                     <el-switch 
                      v-model="chartConfig.yAxisShow" 
                      @change="updateChartConfig('yAxis.show', $event)" 
                      active-text="显示"
                      inactive-text="隐藏"
                      inline-prompt
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </el-form>
        </template>
      </el-tab-pane>

      <el-tab-pane label="数据" name="data" v-if="hasData">
        <el-form label-position="top" size="small">
          <div class="section-group">
            <el-form-item label="数据源类型" style="margin-bottom: 0;">
              <el-radio-group v-model="component.dataSource.type" @change="store.recordSnapshot()" class="data-source-select">
                <el-radio value="static" border>静态数据</el-radio>
                <el-radio value="api" border>API 接口</el-radio>
                <el-radio value="websocket" border>WebSocket</el-radio>
              </el-radio-group>
            </el-form-item>
          </div>

          <!-- Static Data Config -->
          <template v-if="component.dataSource.type === 'static'">
             <div class="section-group">
               <div class="section-title">数据管理</div>
               <div class="static-actions">
                 <el-upload
                   action=""
                   :auto-upload="false"
                   :show-file-list="false"
                   :on-change="handleImportStatic"
                   accept=".json"
                   class="upload-btn-wrapper"
                 >
                   <el-button icon="Upload" style="width: 100%">导入 JSON</el-button>
                 </el-upload>
                 <el-button icon="Download" @click="handleExportStatic" class="download-btn">导出 JSON</el-button>
               </div>

              <div v-if="component.type === 'chart'" style="margin-top: 12px;">
                <el-form-item label="ECharts 配置">
                  <el-input 
                    v-model="optionStr" 
                    type="textarea" 
                    :rows="12" 
                    @change="updateOption"
                    class="code-input"
                  />
                </el-form-item>
              </div>
              <div v-else-if="component.type === 'text' || component.type === 'widget'" style="margin-top: 12px;">
                <el-form-item label="内容/值">
                  <el-input v-model="component.content" @change="store.recordSnapshot()" type="textarea" :rows="5"/>
                </el-form-item>
              </div>
              
              <!-- Tab Configuration (Data Mode) -->
              <div v-else-if="component.key === 'layout-tabs'" style="margin-top: 12px;">
                 <el-form-item label="Tab 配置 (JSON)">
                   <el-input 
                     v-model="propsStr" 
                     type="textarea" 
                     :rows="12" 
                     @change="updateProps"
                     class="code-input"
                     placeholder='{"tabs": [{"label": "Tab 1", "content": "..."}]}'
                   />
                 </el-form-item>
                 
                 <el-divider content-position="left">可视化编辑</el-divider>
                 
                 <el-form-item label="当前激活索引">
                   <el-input-number v-model="component.props.activeIndex" :min="0" :max="(component.props.tabs?.length || 1) - 1" @change="store.recordSnapshot()" />
                 </el-form-item>
                 
                 <div class="section-group">
                   <div class="section-title">
                     <span>页签列表</span>
                     <el-button link type="primary" size="small" @click="addTabItem">添加</el-button>
                   </div>
                   <div v-for="(tab, idx) in component.props.tabs" :key="idx" class="list-item-config">
                     <div class="item-header">
                       <span>Tab {{ idx + 1 }}</span>
                       <el-button link type="danger" size="small" @click="removeTabItem(idx)" :disabled="component.props.tabs.length <= 1">删除</el-button>
                     </div>
                     <el-form-item label="标题">
                       <el-input v-model="tab.label" @change="store.recordSnapshot()" />
                     </el-form-item>
                     <el-form-item label="内容">
                       <el-input v-model="tab.content" type="textarea" :rows="2" @change="store.recordSnapshot()" />
                     </el-form-item>
                   </div>
                 </div>
              </div>

              <!-- Carousel Configuration (Data Mode) -->
              <div v-else-if="component.key === 'layout-carousel'" style="margin-top: 12px;">
                 <el-form-item label="轮播配置 (JSON)">
                   <el-input 
                     v-model="propsStr" 
                     type="textarea" 
                     :rows="12" 
                     @change="updateProps"
                     class="code-input"
                     placeholder='{"slides": [{"label": "Slide 1", "content": "..."}]}'
                   />
                 </el-form-item>
                 
                 <el-divider content-position="left">可视化编辑</el-divider>
                 
                 <el-row :gutter="10">
                   <el-col :span="12">
                     <el-form-item label="自动播放">
                       <el-switch v-model="component.props.autoplay" @change="store.recordSnapshot()" />
                     </el-form-item>
                   </el-col>
                   <el-col :span="12">
                     <el-form-item label="间隔 (ms)">
                       <el-input-number v-model="component.props.interval" :min="500" :step="500" @change="store.recordSnapshot()" />
                     </el-form-item>
                   </el-col>
                 </el-row>
                 
                 <div class="section-group">
                   <div class="section-title">
                     <span>轮播项列表</span>
                     <el-button link type="primary" size="small" @click="addSlideItem">添加</el-button>
                   </div>
                   <div v-for="(slide, idx) in component.props.slides" :key="idx" class="list-item-config">
                     <div class="item-header">
                       <span>Slide {{ idx + 1 }}</span>
                       <el-button link type="danger" size="small" @click="removeSlideItem(idx)" :disabled="component.props.slides.length <= 1">删除</el-button>
                     </div>
                     <el-form-item label="内容文本">
                       <el-input v-model="slide.content" type="textarea" :rows="2" @change="store.recordSnapshot()" />
                     </el-form-item>
                     <el-form-item label="背景色">
                       <div class="color-picker-wrapper">
                         <el-color-picker v-model="slide.background" show-alpha @change="store.recordSnapshot()" />
                         <span class="color-text">{{ slide.background || 'Transparent' }}</span>
                       </div>
                     </el-form-item>
                   </div>
                 </div>
              </div>
             </div>
          </template>

          <!-- API Config -->
          <template v-if="component.dataSource.type === 'api'">
            <div class="section-group">
              <div class="section-title">接口配置</div>
              <el-form-item label="接口地址">
                <el-input v-model="component.dataSource.api.url" placeholder="http://api.example.com/data" @change="store.recordSnapshot()">
                  <template #prepend>
                    <el-select v-model="component.dataSource.api.method" style="width: 90px">
                      <el-option label="GET" value="GET" />
                      <el-option label="POST" value="POST" />
                    </el-select>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="刷新配置">
                <el-row :gutter="10">
                  <el-col :span="14">
                     <el-input v-model="component.dataSource.api.refreshInterval" @change="store.recordSnapshot()">
                        <template #append>ms</template>
                     </el-input>
                  </el-col>
                  <el-col :span="10">
                     <el-checkbox v-model="component.dataSource.api.autoRefresh" label="自动刷新" @change="store.recordSnapshot()" border style="width: 100%;" />
                  </el-col>
                </el-row>
              </el-form-item>
              
              <el-button type="primary" size="default" @click="handleTestApi" :loading="testingApi" style="width: 100%; margin-top: 8px;">
                <el-icon class="el-icon--left"><VideoPlay /></el-icon> 测试请求 / 刷新
              </el-button>
              
              <div v-if="apiResult" class="api-result-box">
                  <div class="result-header">
                    <span>响应结果 preview</span>
                    <el-button type="primary" link size="small" @click="handleApplyData">应用到组件</el-button>
                  </div>
                  <pre>{{ apiResult }}</pre>
              </div>
            </div>
          </template>

          <!-- WebSocket Config -->
          <template v-if="component.dataSource.type === 'websocket'">
            <div class="section-group">
              <div class="section-title">WebSocket 配置</div>
              <el-form-item label="WS 地址">
                <el-input v-model="component.dataSource.websocket.url" placeholder="ws://example.com/socket" @change="store.recordSnapshot()" />
              </el-form-item>

              <el-button type="primary" size="default" @click="handleTestWs" :loading="testingWs" style="width: 100%; margin-top: 8px;">
                <el-icon class="el-icon--left"><VideoPlay /></el-icon> 连接 / 测试
              </el-button>

              <div v-if="wsResult" class="api-result-box">
                  <div class="result-header">
                    <span>接收数据 preview</span>
                    <el-button type="primary" link size="small" @click="handleApplyData">应用到组件</el-button>
                  </div>
                  <pre>{{ wsResult }}</pre>
              </div>
            </div>
          </template>

          <div class="section-group" v-if="component.dataSource.type !== 'static'">
            <!-- <div class="section-title" style="display: flex; justify-content: space-between; align-items: center;">
              <span>数据转换</span>
              <el-button 
                size="small" 
                :type="component.dataSource.transformation.enable ? 'primary' : 'default'" 
                link 
                @click="showTransformDialog = true"
              >
                {{ component.dataSource.transformation.enable ? '已启用 / 配置' : '设置' }}
              </el-button>
            </div> -->
            
            <!-- Dialog for Data Transformation -->
            <el-dialog 
              v-model="showTransformDialog" 
              title="数据转换配置" 
              width="70%" 
              append-to-body
              :close-on-click-modal="false"
            >
              <div class="transform-dialog-content">
                <div style="margin-bottom: 16px;">
                  <el-switch 
                    v-model="component.dataSource.transformation.enable" 
                    active-text="启用数据转换" 
                    @change="store.recordSnapshot()" 
                  />
                </div>
                
                <div v-if="component.dataSource.transformation.enable">
                  <DataTransformer 
                    v-model="component.dataSource.transformation"
                    :component-type="component.type"
                    :component-info="component"
                    :sample-data="previewSampleData"
                    @change="store.recordSnapshot()"
                  />
                </div>
                <div v-else class="empty-tip">
                  启用后可对接口数据进行清洗、格式化和映射
                </div>
              </div>
              <template #footer>
                <span class="dialog-footer">
                  <el-button @click="showTransformDialog = false">关闭</el-button>
                </span>
              </template>
            </el-dialog>
          </div>
        </el-form>
      </el-tab-pane>
    </el-tabs>
    
    <div class="actions">
      <el-button type="danger" @click="handleDelete" style="width: 100%">删除组件</el-button>
    </div>
  </div>
  <div class="config-panel empty" v-else>
    请选择一个组件进行配置
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'
import axios from 'axios'
import { CopyDocument, DocumentCopy, Upload, Download, VideoPlay } from '@element-plus/icons-vue'
import { get, set } from 'lodash'
import { ElMessage, ElMessageBox } from 'element-plus'
import DataTransformer from './DataTransformer.vue'
import { processData } from '@/utils/dataProcessor'
import { generateMockData, generateRawMockData } from '@/utils/mockData'

const props = defineProps({
  componentId: {
    type: String,
    required: true
  }
})

const store = useEditorStore()
const projectStore = useProjectStore()
const activeTab = ref('basic')

const component = computed(() => store.activeComponent)

const hasStyle = computed(() => {
  if (!component.value) return false
  return ['text', 'container', 'decoration', 'widget', 'chart'].includes(component.value.type)
})

const hasData = computed(() => {
  if (!component.value) return false
  return ['chart', 'text', 'widget', 'container'].includes(component.value.type)
})

watch(() => component.value?.id, () => {
  activeTab.value = 'basic'
})

const optionStr = ref('')
const propsStr = ref('')
const showTransformDialog = ref(false)

// Chart Config State
const chartConfig = ref({
  legendShow: true,
  tooltipShow: true,
  gridTop: '60',
  gridBottom: '60',
  gridLeft: '10%',
  gridRight: '10%',
  xAxisShow: true,
  yAxisShow: true
})

const updateChartConfigFromComponent = () => {
  if (component.value?.type !== 'chart' || !component.value.option) return
  const opt = component.value.option
  
  chartConfig.value.legendShow = get(opt, 'legend.show', true)
  chartConfig.value.tooltipShow = get(opt, 'tooltip.show', true)
  chartConfig.value.gridTop = get(opt, 'grid.top', 60)
  chartConfig.value.gridBottom = get(opt, 'grid.bottom', 60)
  chartConfig.value.gridLeft = get(opt, 'grid.left', '10%')
  chartConfig.value.gridRight = get(opt, 'grid.right', '10%')
  
  const xAxis = Array.isArray(opt.xAxis) ? opt.xAxis[0] : opt.xAxis
  const yAxis = Array.isArray(opt.yAxis) ? opt.yAxis[0] : opt.yAxis
  
  chartConfig.value.xAxisShow = get(xAxis, 'show', true)
  chartConfig.value.yAxisShow = get(yAxis, 'show', true)
}

const updateChartConfig = (path, value) => {
  if (!component.value.option) component.value.option = {}
  
  if (path.startsWith('xAxis') || path.startsWith('yAxis')) {
    const axisName = path.split('.')[0]
    const prop = path.split('.')[1]
    let axis = get(component.value.option, axisName)
    if (!axis) {
       axis = {}
       set(component.value.option, axisName, axis)
    }
    if (Array.isArray(axis)) {
       set(axis[0], prop, value)
    } else {
       set(axis, prop, value)
    }
  } else {
    set(component.value.option, path, value)
  }
  
  optionStr.value = JSON.stringify(component.value.option, null, 2)
  if (component.value.dataSource?.type === 'static') {
     component.value.dataSource.staticData = component.value.option
  }
  store.recordSnapshot()
}

watch(() => component.value, (newVal) => {
  if (newVal) {
    // Ensure dataSource exists
    if (!newVal.dataSource) {
      let initialData = {}
      
      // Adapt initial data structure based on component type
      if (newVal.type === 'chart' && newVal.option) {
         const { series, xAxis, yAxis, dataset } = newVal.option
         initialData = { series, xAxis, yAxis, dataset }
         // Clean undefined
         Object.keys(initialData).forEach(key => initialData[key] === undefined && delete initialData[key])
      } else if (newVal.type === 'text') {
         initialData = { content: newVal.content }
      } else if (newVal.type === 'widget') {
         initialData = { ...newVal.props }
      } else if (newVal.key === 'layout-tabs') {
         initialData = { tabs: newVal.props?.tabs || [] }
      } else if (newVal.key === 'layout-carousel') {
         initialData = { slides: newVal.props?.slides || [] }
      } else {
         initialData = newVal.option || newVal.content || {}
      }

      newVal.dataSource = {
        type: 'static',
        staticData: initialData,
        api: { url: '', method: 'GET', refreshInterval: 5000, autoRefresh: false },
        websocket: { url: '' },
        transformation: { enable: false, code: '// 参数 data 为原始数据，请返回处理后的数据\nreturn data' }
      }
    } else {
      // Ensure transformation exists (backward compatibility)
      if (!newVal.dataSource.transformation) {
        newVal.dataSource.transformation = { 
          enable: false, 
          mode: 'code',
          code: '// 参数 data 为原始数据，请返回处理后的数据\nreturn data',
          visualConfig: { rename: {}, filters: [], calculations: [], aggregation: { enable: false, groupBy: [], metrics: [] } }
        }
      }
      // Ensure api config exists
      if (!newVal.dataSource.api) {
        newVal.dataSource.api = { url: '', method: 'GET', refreshInterval: 5000, autoRefresh: false }
      }
    }
    
    // Ensure Opacity exists
    if (newVal.opacity === undefined) {
      newVal.opacity = 1
    }

    if (newVal.type === 'chart') {
      const data = (newVal.dataSource.type === 'static' && newVal.dataSource.staticData) 
        ? newVal.dataSource.staticData 
        : newVal.option
      optionStr.value = JSON.stringify(data, null, 2)
      updateChartConfigFromComponent()
    } else if (newVal.type === 'widget') {
      propsStr.value = JSON.stringify(newVal.props, null, 2)
    } else if (newVal.key === 'layout-tabs' || newVal.key === 'layout-carousel') {
      // Sync staticData from props if not present
      if (!newVal.dataSource.staticData || Object.keys(newVal.dataSource.staticData).length === 0) {
          if (newVal.key === 'layout-tabs') newVal.dataSource.staticData = { tabs: newVal.props.tabs }
          if (newVal.key === 'layout-carousel') newVal.dataSource.staticData = { slides: newVal.props.slides }
      }
      // For editing JSON manually
      propsStr.value = JSON.stringify(newVal.dataSource.staticData, null, 2)
    }
  }
}, { immediate: true, deep: true })

const updateOption = (val) => {
  try {
    const option = JSON.parse(val)
    component.value.option = option
    if (component.value.dataSource && component.value.dataSource.type === 'static') {
      component.value.dataSource.staticData = option
    }
    store.recordSnapshot()
  } catch (e) {
    console.error('Invalid JSON', e)
  }
}

const updateProps = (val) => {
  try {
    const props = JSON.parse(val)
    component.value.props = { ...component.value.props, ...props }
    if (component.value.dataSource?.type === 'static') {
      component.value.dataSource.staticData = props
    }
    store.recordSnapshot()
  } catch (e) {
    console.error('Invalid JSON', e)
  }
}

const testingApi = ref(false)
const testingWs = ref(false)
const apiResult = ref('')
const wsResult = ref('')
const latestApiData = ref(null)
const latestWsData = ref(null)
const rawApiData = ref(null)
const rawWsData = ref(null)

const previewSampleData = computed(() => {
  if (component.value?.dataSource?.type === 'websocket') {
     if (rawWsData.value) return rawWsData.value
  } else {
     if (rawApiData.value) return rawApiData.value
  }
  // For transformation preview, we always want raw data to practice with
  return generateRawMockData(component.value)
})

const handleImportStatic = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target.result)
      if (component.value.dataSource) {
          component.value.dataSource.staticData = json
      }
      if (component.value.type === 'chart') {
         component.value.option = json
         optionStr.value = JSON.stringify(json, null, 2)
      } else {
         component.value.content = typeof json === 'object' ? JSON.stringify(json) : json
      }
      store.recordSnapshot()
    } catch (err) {
      console.error('Import failed', err)
    }
  }
  reader.readAsText(file.raw)
}

const handleExportStatic = () => {
  const data = component.value.dataSource?.staticData || component.value.option || component.value.content
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `data-${component.value.id}.json`
  a.click()
  URL.revokeObjectURL(url)
}


const handleTestApi = async () => {
    const { api } = component.value.dataSource
    
    testingApi.value = true
    apiResult.value = ''
    latestApiData.value = null

    try {
        let data
        
        if (api && api.url) {
            try {
                // Real API Request
                const response = await axios({
                    url: api.url,
                    method: api.method || 'GET',
                    timeout: 5000 // 5s timeout
                })
                data = response.data
                ElMessage.success('接口请求成功')
            } catch (err) {
                console.warn('Real API request failed, falling back to mock data:', err)
                // Fallback to Mock Data if real request fails (Demo Mode)
                ElMessage.warning('接口请求失败，已切换为模拟数据演示')
                
                // Simulate Network Delay
                await new Promise(resolve => setTimeout(resolve, 500))
                
                // Return Mock Data based on Component Type
                data = component.value.dataSource?.transformation?.enable 
                    ? generateRawMockData(component.value)
                    : generateMockData(component.value)
            }
        } else {
             // Validate URL is required
             ElMessage.warning('请输入接口地址')
             testingApi.value = false
             return
        }
        
        // Store RAW data for preview
        rawApiData.value = JSON.parse(JSON.stringify(data))

        // Apply transformation if enabled
        if (component.value.dataSource?.transformation?.enable) {
           try {
             data = processData(data, component.value.dataSource.transformation, component.value)
           } catch (err) {
             console.error('Test transformation failed:', err)
             apiResult.value = 'Transformation Error: ' + err.message
             ElMessage.error('转换脚本执行失败: ' + err.message)
             return
           }
        }
        
        latestApiData.value = data
        apiResult.value = JSON.stringify(data, null, 2).slice(0, 500) + (JSON.stringify(data).length > 500 ? '...' : '')
    } catch (e) {
        apiResult.value = 'Error: ' + e.message
        ElMessage.error('接口测试失败: ' + e.message)
    } finally {
        testingApi.value = false
    }
}

// Keep track of active WebSocket connection
let activeWs = null

const handleTestWs = async () => {
    const { websocket } = component.value.dataSource
    
    testingWs.value = true
    wsResult.value = ''
    latestWsData.value = null
    
    // Close existing connection if any
    if (activeWs) {
        activeWs.close()
        activeWs = null
    }

    try {
        let data
        
        if (websocket && websocket.url) {
            try {
                // Try Real WebSocket Connection
                await new Promise((resolve, reject) => {
                    const ws = new WebSocket(websocket.url)
                    
                    ws.onopen = () => {
                        activeWs = ws
                        ElMessage.success('WebSocket 连接成功')
                        resolve()
                    }
                    
                    ws.onmessage = (event) => {
                        try {
                            const raw = JSON.parse(event.data)
                            // Process received data
                            let processed = raw
                            
                            // Store RAW data for preview
                            rawWsData.value = JSON.parse(JSON.stringify(raw))

                            // Apply transformation if enabled
                            if (component.value.dataSource?.transformation?.enable) {
                               try {
                                 processed = processData(raw, component.value.dataSource.transformation, component.value)
                               } catch (err) {
                                 console.error('WS transformation failed:', err)
                                 return
                               }
                            }
                            
                            latestWsData.value = processed
                            wsResult.value = JSON.stringify(processed, null, 2).slice(0, 500) + (JSON.stringify(processed).length > 500 ? '...' : '')
                        } catch (e) {
                            console.warn('WS message parse error', e)
                        }
                    }
                    
                    ws.onerror = (err) => {
                        reject(err)
                    }
                    
                    // Timeout
                    setTimeout(() => {
                        if (ws.readyState === WebSocket.CONNECTING) {
                            ws.close()
                            reject(new Error('Connection timeout'))
                        }
                    }, 3000)
                })
                
                // If we are here, connection was successful, but we might not have data yet.
                // We return here and let onmessage handle updates.
                testingWs.value = false
                return 
                
            } catch (err) {
                console.warn('Real WS connection failed, falling back to mock:', err)
                ElMessage.warning('WebSocket 连接失败，已切换为模拟数据演示')
                
                // Fallback Mock Logic
                await new Promise(resolve => setTimeout(resolve, 500))
                data = component.value.dataSource?.transformation?.enable 
                    ? generateRawMockData(component.value)
                    : generateMockData(component.value)
            }
        } else {
             ElMessage.warning('请输入 WS 地址')
             testingWs.value = false
             return
        }
        
        // Store RAW data for preview (Mock Path)
        rawWsData.value = JSON.parse(JSON.stringify(data))

        // Apply transformation if enabled
        if (component.value.dataSource?.transformation?.enable) {
           try {
             data = processData(data, component.value.dataSource.transformation, component.value)
           } catch (err) {
             console.error('Test transformation failed:', err)
             wsResult.value = 'Transformation Error: ' + err.message
             ElMessage.error('转换脚本执行失败: ' + err.message)
             return
           }
        }
        
        latestWsData.value = data
        wsResult.value = JSON.stringify(data, null, 2).slice(0, 500) + (JSON.stringify(data).length > 500 ? '...' : '')
        ElMessage.success('WebSocket 测试成功 (模拟)')
    } catch (e) {
        wsResult.value = 'Error: ' + e.message
        ElMessage.error('WebSocket 测试失败: ' + e.message)
    } finally {
        testingWs.value = false
    }
}

const handleApplyData = () => {
  let data = null
  if (component.value.dataSource.type === 'api') {
      data = latestApiData.value
  } else if (component.value.dataSource.type === 'websocket') {
      data = latestWsData.value
  }

  if (!data) return
  
  try {
    
    if (component.value.dataSource) {
        component.value.dataSource.staticData = data
    }
    
    if (component.value.type === 'chart') {
       // ... (existing chart logic)
       // Case 1: Axis Mapping (has xAxis)
       if (data.xAxis && data.series) {
          if (!component.value.option) component.value.option = {}
          const opt = component.value.option
          
          // Update X Axis
          if (!opt.xAxis) opt.xAxis = {}
          if (Array.isArray(opt.xAxis)) {
             opt.xAxis[0] = { ...opt.xAxis[0], ...data.xAxis }
          } else {
             opt.xAxis = { ...opt.xAxis, ...data.xAxis }
          }
          
          // Update Series
          if (!opt.series) opt.series = []
          if (opt.series.length > 0) {
             opt.series[0].data = data.series[0].data
          } else {
             opt.series = data.series
          }
          optionStr.value = JSON.stringify(opt, null, 2)
       } 
       // Case 2: Item Mapping (Pie/Scatter - only series, no xAxis)
       else if (data.series && !data.xAxis) {
          if (!component.value.option) component.value.option = {}
          const opt = component.value.option
          
          if (!opt.series) opt.series = []
          if (opt.series.length > 0) {
             opt.series[0].data = data.series[0].data
          } else {
             opt.series = data.series
          }
          optionStr.value = JSON.stringify(opt, null, 2)
       }
       else {
          // Raw data assignment (fallback)
          component.value.option = data
          optionStr.value = JSON.stringify(data, null, 2)
       }
    } else if (component.value.type === 'text') {
       // ... (existing text logic)
       if (typeof data === 'object') {
          if (data.content) component.value.content = data.content
          else if (data.value) component.value.content = data.value
          else component.value.content = JSON.stringify(data)
       } else {
          component.value.content = String(data)
       }
    } else if (component.value.key === 'layout-tabs') {
       if (data.tabs && Array.isArray(data.tabs)) {
          component.value.props.tabs = data.tabs
          propsStr.value = JSON.stringify(data, null, 2)
       } else {
          ElMessage.warning('数据格式不符合 Tab 组件要求 {tabs: []}')
       }
    } else if (component.value.key === 'layout-carousel') {
       if (data.slides && Array.isArray(data.slides)) {
          component.value.props.slides = data.slides
          propsStr.value = JSON.stringify(data, null, 2)
       } else {
          ElMessage.warning('数据格式不符合轮播组件要求 {slides: []}')
       }
    } else {
       component.value.content = typeof data === 'object' ? JSON.stringify(data) : data
    }
    
    // Switch to static mode
    component.value.dataSource.type = 'static'
    
    store.recordSnapshot()
    ElMessage.success('数据已应用并切换为静态数据模式')
  } catch (err) {
    console.error('Apply failed', err)
    ElMessage.error('应用数据失败')
  }
}

const addTabItem = () => {
  if (!component.value.props.tabs) component.value.props.tabs = []
  const idx = component.value.props.tabs.length + 1
  component.value.props.tabs.push({ label: `Tab ${idx}`, content: `Tab ${idx}` })
  store.recordSnapshot()
}

const removeTabItem = (idx) => {
  component.value.props.tabs.splice(idx, 1)
  // Fix activeIndex if out of bounds
  if (component.value.props.activeIndex >= component.value.props.tabs.length) {
    component.value.props.activeIndex = Math.max(0, component.value.props.tabs.length - 1)
  }
  store.recordSnapshot()
}

const addSlideItem = () => {
  if (!component.value.props.slides) component.value.props.slides = []
  const idx = component.value.props.slides.length + 1
  component.value.props.slides.push({ label: `Slide ${idx}`, content: `轮播 ${idx}`, background: 'rgba(255, 255, 255, 0.1)' })
  store.recordSnapshot()
}

const removeSlideItem = (idx) => {
  component.value.props.slides.splice(idx, 1)
  store.recordSnapshot()
}

const handleDelete = () => {
  ElMessageBox.confirm(
    '确定要删除该组件吗？',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      store.removeComponent(component.value.id)
      ElMessage.success('组件已删除')
    })
    .catch(() => {
      // User cancelled
    })
}
</script>

<style scoped>
.config-panel {
  width: 300px;
  height: 100%;
  border-left: 1px solid var(--border-color);
  background: var(--bg-panel);
  display: flex;
  flex-direction: column;
  position: relative;
}

.read-only-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  z-index: 9999;
  cursor: not-allowed;
}

.panel-header {
  padding: 0 16px;
  height: 48px;
  line-height: 48px;
  font-weight: 600;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-darker);
  color: var(--text-primary);
}

:deep(.el-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.el-tabs__header) {
  margin: 0;
  background-color: var(--bg-darker);
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-tabs__nav) {
  width: 100%;
  display: flex;
  justify-content: space-evenly;
}

:deep(.el-tabs__item) {
  color: var(--text-secondary);
  height: 40px;
  line-height: 40px;
  flex: 1;
  text-align: center;
  padding: 0 4px !important;
}

:deep(.el-tabs__item.is-active) {
  color: var(--primary-color);
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

:deep(.el-form-item__label) {
  color: var(--text-secondary);
  padding-bottom: 4px;
}

:deep(.el-switch__label) {
  color: var(--text-secondary);
}
:deep(.el-switch__label.is-active) {
  color: var(--primary-color);
}

.section-group {
  margin-bottom: 16px;
  background: var(--bg-darker);
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  line-height: 1.2;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-text {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: monospace;
}

.api-result-box {
  margin-top: 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-editor);
  overflow: hidden;
}

.result-header {
  padding: 4px 8px;
  font-size: 12px;
  background: var(--bg-darker);
  border-bottom: 1px solid var(--border-color);
  color: var(--text-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.api-result-box pre {
  margin: 0;
  padding: 8px;
  font-family: monospace;
  font-size: 12px;
  color: var(--text-primary);
  overflow: auto;
  max-height: 200px;
  white-space: pre-wrap;
  word-break: break-all;
}

.code-input :deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  background-color: var(--bg-editor);
  color: var(--text-primary);
  line-height: 1.5;
}

.code-help {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  opacity: 0.8;
}

/* Override Element Plus Form Item margin inside sections */
.section-group :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.data-source-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.data-source-select :deep(.el-radio) {
  margin-right: 0;
  width: 100%;
  background: var(--bg-editor);
  border-color: var(--border-color);
}

.data-source-select :deep(.el-radio.is-bordered.is-checked) {
  background: var(--primary-color-light, rgba(64, 158, 255, 0.1));
  border-color: var(--primary-color);
}

.static-actions {
  display: flex;
  gap: 12px;
}

.upload-btn-wrapper, .download-btn {
  flex: 1;
}

.upload-btn-wrapper :deep(.el-upload) {
  width: 100%;
  display: block;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background-color: var(--bg-darker);
  box-shadow: 0 0 0 1px var(--border-color) inset;
  color: var(--text-primary);
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px var(--text-secondary) inset;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--primary-color) inset;
}

.actions {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-panel);
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 14px;
}
.empty-tip {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
  background: var(--bg-darker);
  border-radius: 4px;
  border: 1px dashed var(--border-color);
}
</style>
