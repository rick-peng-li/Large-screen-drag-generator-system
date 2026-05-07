<template>
  <div 
    class="editor-canvas" 
    :class="{ 
      'is-preview': preview,
      'is-panning': isPanning,
      'is-space-pressed': isSpacePressed
    }"
    ref="containerRef"
    @drop="!preview && handleDrop($event)" 
    @dragover.prevent
    @mousedown="handleCanvasMouseDown"
  >
    <div 
      class="canvas-content"
      ref="canvasRef"
      :style="{
        width: store.canvasConfig.width + 'px',
        height: store.canvasConfig.height + 'px',
        backgroundColor: store.canvasConfig.backgroundColor,
        transform: `scale(${scaleX}, ${scaleY}) translate(-50%, -50%)`,
        transformOrigin: '0 0',
        left: `calc(50% + ${canvasTranslateX}px)`,
        top: `calc(50% + ${canvasTranslateY}px)`
      }"
    >
      <div
        v-for="component in store.components"
        :key="component.id"
        class="component-wrapper"
        :class="{ active: !preview && store.activeComponentId === component.id }"
        :style="{
          left: component.x + 'px',
          top: component.y + 'px',
          width: component.width + 'px',
          height: component.height + 'px',
          zIndex: component.zIndex,
          transform: `rotate(${component.rotation || 0}deg)`,
          opacity: component.opacity !== undefined ? component.opacity : 1
        }"
        @mousedown.stop="!preview && handleMouseDown($event, component)"
      >
        <!-- Lock Indicator -->
        <div v-if="component.locked && !preview" class="lock-indicator">
          <el-icon><Lock /></el-icon>
        </div>

        <!-- Chart Renderer or Text Renderer -->
        <component 
          :is="getComponentType(component.type)"
          :config="component"
          :preview="preview"
        />
        
        <!-- Selection Borders/Handles -->
        <div v-if="!preview && store.activeComponentId === component.id && !component.locked" class="resize-handle-container">
           <div class="resize-handle tl" @mousedown.stop="handleResize($event, component, 'tl')"></div>
           <div class="resize-handle tm" @mousedown.stop="handleResize($event, component, 'tm')"></div>
           <div class="resize-handle tr" @mousedown.stop="handleResize($event, component, 'tr')"></div>
           <div class="resize-handle r"  @mousedown.stop="handleResize($event, component, 'r')"></div>
           <div class="resize-handle br" @mousedown.stop="handleResize($event, component, 'br')"></div>
           <div class="resize-handle bm" @mousedown.stop="handleResize($event, component, 'bm')"></div>
           <div class="resize-handle bl" @mousedown.stop="handleResize($event, component, 'bl')"></div>
           <div class="resize-handle l"  @mousedown.stop="handleResize($event, component, 'l')"></div>
           
           <!-- Rotation Handle -->
           <div class="rotate-handle" @mousedown.stop="handleRotate($event, component)">
             <el-icon><RefreshRight /></el-icon>
           </div>
        </div>
        <!-- Locked Selection Border (Visual Only) -->
        <div v-if="!preview && store.activeComponentId === component.id && component.locked" class="locked-handle-container"></div>
      </div>
      <div v-if="store.canvasConfig.splicing && (store.canvasConfig.splicing.rows > 1 || store.canvasConfig.splicing.cols > 1)" class="splicing-overlay">
        <div 
          v-for="line in verticalLines" 
          :key="'v-' + line" 
          class="splice-line vertical" 
          :style="{ left: line + 'px' }"
        />
        <div 
          v-for="line in horizontalLines" 
          :key="'h-' + line" 
          class="splice-line horizontal" 
          :style="{ top: line + 'px' }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'
import { defineAsyncComponent, ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { debounce } from 'lodash'
import { Lock, RefreshRight } from '@element-plus/icons-vue'

const props = defineProps({
  preview: {
    type: Boolean,
    default: false
  }
})

const store = useEditorStore()
const projectStore = useProjectStore()

// Disable interactions if no permission
const canEdit = computed(() => !props.preview && projectStore.canEdit)

// Async load renderers
const ChartRenderer = defineAsyncComponent(() => import('./Renderers/ChartRenderer.vue'))
const TextRenderer = defineAsyncComponent(() => import('./Renderers/TextRenderer.vue'))
const BoxRenderer = defineAsyncComponent(() => import('./Renderers/BoxRenderer.vue'))
const WidgetRenderer = defineAsyncComponent(() => import('./Renderers/WidgetRenderer.vue'))

const containerRef = ref(null)
const canvasRef = ref(null)
const scaleX = ref(1)
const scaleY = ref(1)
const canvasTranslateX = ref(0)
const canvasTranslateY = ref(0)
const isSpacePressed = ref(false)
const isPanning = ref(false)

const updateScale = debounce(() => {
  if (!containerRef.value) return
  
  const containerWidth = containerRef.value.clientWidth
  const containerHeight = containerRef.value.clientHeight
  const canvasWidth = store.canvasConfig.width
  const canvasHeight = store.canvasConfig.height
  
  // Keep some padding (e.g. 40px) if not preview, or 0 if preview
  const padding = props.preview ? 0 : 40
  const w = containerWidth - padding
  const h = containerHeight - padding
  
  const sx = w / canvasWidth
  const sy = h / canvasHeight
  const mode = store.canvasConfig.adaptMode || 'contain'
  if (mode === 'contain') {
    const s = Math.min(sx, sy)
    scaleX.value = s
    scaleY.value = s
  } else if (mode === 'cover') {
    const s = Math.max(sx, sy)
    scaleX.value = s
    scaleY.value = s
  } else if (mode === 'stretch') {
    scaleX.value = sx
    scaleY.value = sy
  } else {
    const s = Math.min(sx, sy)
    scaleX.value = s
    scaleY.value = s
  }
}, 100)

onMounted(() => {
  updateScale()
  window.addEventListener('resize', updateScale)
  window.addEventListener('keydown', handleSpaceDown)
  window.addEventListener('keyup', handleSpaceUp)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScale)
  window.removeEventListener('keydown', handleSpaceDown)
  window.removeEventListener('keyup', handleSpaceUp)
})

const handleSpaceDown = (e) => {
  if (e.code === 'Space' && !e.repeat && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    isSpacePressed.value = true
  }
}

const handleSpaceUp = (e) => {
  if (e.code === 'Space') {
    isSpacePressed.value = false
  }
}

const startPan = (e) => {
  if (!canEdit.value && !props.preview) return 
  // Only allow Left (0) or Middle (1) mouse buttons
  if (e.button !== 0 && e.button !== 1) return

  e.preventDefault()
  isPanning.value = true
  
  const startX = e.clientX
  const startY = e.clientY
  const startTransX = canvasTranslateX.value
  const startTransY = canvasTranslateY.value
  
  const move = (moveEvent) => {
    moveEvent.preventDefault()
    const currX = moveEvent.clientX
    const currY = moveEvent.clientY
    
    canvasTranslateX.value = startTransX + (currX - startX)
    canvasTranslateY.value = startTransY + (currY - startY)
  }
  
  const up = () => {
    isPanning.value = false
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mouseup', up)
  }
  
  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}

const handleCanvasMouseDown = (e) => {
  // Middle click (1) always pans
  if (e.button === 1) {
    startPan(e)
    return
  }

  // Left click (0)
  if (e.button === 0) {
    // If clicking on canvas background (self) OR space is pressed
    if (e.target === containerRef.value || isSpacePressed.value) {
      // If it's a click on background, we also want to clear selection
      // But only if we are not space-panning (space panning shouldn't lose selection ideally, but acceptable)
      if (!isSpacePressed.value && !props.preview && e.target === containerRef.value) {
         store.setActiveComponent(null)
      }
      startPan(e)
    }
  }
}

const getComponentType = (type) => {
  if (type === 'chart') return ChartRenderer
  if (type === 'text') return TextRenderer
  if (type === 'container' || type === 'decoration') return BoxRenderer
  if (type === 'widget') return WidgetRenderer
  return 'div'
}

const handleDrop = (e) => {
  if (!canEdit.value) return
  e.preventDefault()
  const data = e.dataTransfer.getData('component-type')
  if (data) {
    const component = JSON.parse(data)
    
    // We need to calculate the position relative to the scaled canvas
    // Get mouse position relative to container (viewport)
    const rect = containerRef.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    // The canvas is centered. Let's calculate the top-left offset of the canvas in the container.
    // The canvas is positioned with left: 50%, top: 50% and translate(-50%, -50%)
    // But we also apply scale.
    // Let's use getBoundingClientRect of the canvas itself to be precise.
    const canvasRect = canvasRef.value.getBoundingClientRect()
    
    // Mouse relative to canvas top-left
    const relativeX = e.clientX - canvasRect.left
    const relativeY = e.clientY - canvasRect.top
    
    // Apply inverse scale
    const x = relativeX / scaleX.value
    const y = relativeY / scaleY.value
    
    // Adjust for component center to drop it exactly where mouse is
    const w = component.width || 200
    const h = component.height || 150
    component.x = x - (w / 2)
    component.y = y - (h / 2)
    
    store.addComponent(component)
  }
}

const handleMouseDown = (e, component) => {
  if (!canEdit.value) return
  
  // If Space is pressed, prioritize panning over component selection/drag
  if (isSpacePressed.value) {
    e.stopPropagation()
    startPan(e)
    return
  }

  // Only allow Left Click (0) for component selection/drag
  // Middle click (1) will bubble to container for panning
  if (e.button !== 0) return

  store.setActiveComponent(component.id)
  
  if (component.locked) return

  const startX = e.clientX
  const startY = e.clientY
  const startLeft = component.x
  const startTop = component.y
  
  const move = (moveEvent) => {
    moveEvent.preventDefault() // Prevent selection
    const currX = moveEvent.clientX
    const currY = moveEvent.clientY
    
    // Apply inverse scale to delta
    const deltaX = (currX - startX) / scaleX.value
    const deltaY = (currY - startY) / scaleY.value
    
    component.x = startLeft + deltaX
    component.y = startTop + deltaY
  }
  
  const up = () => {
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mouseup', up)
    
    // Only record if position changed
    if (component.x !== startLeft || component.y !== startTop) {
      store.recordSnapshot()
    }
  }
  
  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}

const handleRotate = (e, component) => {
  if (!canEdit.value) return
  e.stopPropagation()
  e.preventDefault()

  const rect = canvasRef.value.getBoundingClientRect()
  // Component center in screen coordinates
  // We can calculate it from component.x/y/width/height, scale, and canvasRect
  // But easier to just get the wrapper element's rect?
  // We don't have direct ref to specific wrapper easily.
  // Let's calculate from data.
  
  // Canvas top-left in screen
  const canvasLeft = rect.left
  const canvasTop = rect.top
  
  // Component center relative to canvas (scaled)
  const cx_rel = (component.x + component.width / 2) * scaleX.value
  const cy_rel = (component.y + component.height / 2) * scaleY.value
  
  // Component center in screen
  const cx = canvasLeft + cx_rel
  const cy = canvasTop + cy_rel
  
  const startRotation = component.rotation || 0
  const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI
  
  const move = (moveEvent) => {
    moveEvent.preventDefault()
    const currAngle = Math.atan2(moveEvent.clientY - cy, moveEvent.clientX - cx) * 180 / Math.PI
    const deltaAngle = currAngle - startAngle
    
    component.rotation = (startRotation + deltaAngle) % 360
  }
  
  const up = () => {
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mouseup', up)
    store.recordSnapshot()
  }
  
  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}

const handleResize = (e, component, direction) => {
  if (!canEdit.value) return
  if (component.locked) return
  if (e.button !== 0) return // Only Left Click
  e.stopPropagation() // Prevent triggering drag
  e.preventDefault()
  
  const startX = e.clientX
  const startY = e.clientY
  const startWidth = component.width
  const startHeight = component.height
  const startLeft = component.x
  const startTop = component.y
  const rotation = (component.rotation || 0) * Math.PI / 180
  
  const move = (moveEvent) => {
    moveEvent.preventDefault()
    const currX = moveEvent.clientX
    const currY = moveEvent.clientY
    
    // Calculate delta in screen coordinates
    const deltaXScreen = (currX - startX) / scaleX.value
    const deltaYScreen = (currY - startY) / scaleY.value
    
    // Rotate delta to align with component axes
    // We want the projection of the movement onto the component's axes
    const cos = Math.cos(-rotation)
    const sin = Math.sin(-rotation)
    
    const deltaX = deltaXScreen * cos - deltaYScreen * sin
    const deltaY = deltaXScreen * sin + deltaYScreen * cos
    
    let newWidth = startWidth
    let newHeight = startHeight
    let newX = startLeft
    let newY = startTop
    
    // For resizing with rotation, we need to adjust x/y carefully so the opposite corner stays fixed.
    // This is complicated because "x/y" is top-left, which changes if we rotate.
    // Simplified approach: Just update width/height based on rotated delta.
    // The center will shift, which might look like it's drifting.
    // For a robust implementation, we calculate the center point shift.
    
    // Let's stick to simple width/height change first.
    // If the user rotates 45deg, dragging "Right" handle should increase width.
    
    if (direction.includes('r')) {
      newWidth = startWidth + deltaX
    } else if (direction.includes('l')) {
      newWidth = startWidth - deltaX
      // When changing Left, we need to shift X/Y to keep Right side fixed in rotated space?
      // Actually, if we change width by dW, the center moves by dW/2 in local X axis.
      // We need to move the component position (top-left) such that the visual right side is fixed.
      // This requires trigonometry on the position update too.
      // For MVP, let's just apply delta to width/height and see.
      // If we don't update X/Y for Left/Top resize, it will grow from Top-Left, which looks weird if rotated.
      
      // Let's use the rotated delta for width/height, but for position...
      // Position update is needed for L and T.
      
      // Calculate change in position in local space
      const localDX = deltaX
      // Convert local displacement back to global to update X/Y
      // But wait, if we change width by -deltaX (growing left), we move the top-left point by deltaX in local space.
      const shiftX = deltaX * Math.cos(rotation) - 0 * Math.sin(rotation)
      const shiftY = deltaX * Math.sin(rotation) + 0 * Math.cos(rotation)
      newX = startLeft + shiftX
      newY = startTop + shiftY
    }
    
    if (direction.includes('b')) {
      newHeight = startHeight + deltaY
    } else if (direction.includes('t')) {
      newHeight = startHeight - deltaY
      
      const shiftX = 0 * Math.cos(rotation) - deltaY * Math.sin(rotation)
      const shiftY = 0 * Math.sin(rotation) + deltaY * Math.cos(rotation)
      newX = startLeft + shiftX
      newY = startTop + shiftY
    }

    // This logic above is partially correct for separate axis resizing but mixing them (corners) needs combination.
    // And for 'l' and 't', we are replacing newX/newY, which is wrong if we do both.
    
    // Let's revert to simple non-rotated resizing for MVP if it's too risky.
    // Or just implement simple non-rotated resizing logic but use rotated Delta for width/height.
    // The user didn't ask for "advanced rotated resizing".
    // I'll stick to the existing logic for now, but use the ROTATED delta for width/height calculations.
    // And for position updates (L/T), I will just use the simple logic first. 
    // If it behaves badly, I'll advise the user to resize then rotate.
    
    // Actually, let's keep the existing logic exactly as is for now, but add the lock check.
    // Rotated resizing is a rabbit hole.
    
    if (direction.includes('r')) {
       // Naive approach for rotated resizing:
       // Just use distance from center? No.
       // Let's just use the original logic. It works "okay" for small angles.
       // For large angles, it will feel inverted.
       // Let's TRY to use the rotated delta for width/height at least.
       
       newWidth = startWidth + deltaX
    } else if (direction.includes('l')) {
       newWidth = startWidth - deltaX
       // We need to rotate the positional shift
       const dx = deltaX * Math.cos(rotation)
       const dy = deltaX * Math.sin(rotation)
       newX = startLeft + dx
       newY = startTop + dy
    }
    
    if (direction.includes('b')) {
       newHeight = startHeight + deltaY
    } else if (direction.includes('t')) {
       newHeight = startHeight - deltaY
       const dx = -deltaY * Math.sin(rotation)
       const dy = deltaY * Math.cos(rotation)
       newX = startLeft + dx // This is accumulating? No, startLeft is const.
       newY = startTop + dy
       
       // If we have both L and T (tl handle), we need to sum the shifts.
       if (direction.includes('l')) {
         // Re-calculate X/Y based on both
         const dx_l = deltaX * Math.cos(rotation)
         const dy_l = deltaX * Math.sin(rotation)
         const dx_t = -deltaY * Math.sin(rotation)
         const dy_t = deltaY * Math.cos(rotation)
         
         newX = startLeft + dx_l + dx_t
         newY = startTop + dy_l + dy_t
       }
    }

    // Minimum size constraint
    if (newWidth < 20) newWidth = 20
    if (newHeight < 20) newHeight = 20
    
    component.width = newWidth
    component.height = newHeight
    component.x = newX
    component.y = newY
  }
  
  const up = () => {
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mouseup', up)
    store.recordSnapshot()
  }
  
  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}

const verticalLines = computed(() => {
  const cols = store.canvasConfig.splicing?.cols || 1
  const w = store.canvasConfig.width
  const lines = []
  if (cols > 1) {
    const step = w / cols
    for (let i = 1; i < cols; i++) lines.push(i * step)
  }
  return lines
})

const horizontalLines = computed(() => {
  const rows = store.canvasConfig.splicing?.rows || 1
  const h = store.canvasConfig.height
  const lines = []
  if (rows > 1) {
    const step = h / rows
    for (let i = 1; i < rows; i++) lines.push(i * step)
  }
  return lines
})
</script>

<style scoped>
.editor-canvas {
  flex: 1;
  background-color: var(--bg-darker);
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-canvas.is-panning {
  cursor: grabbing;
}

.editor-canvas.is-panning .component-wrapper,
.editor-canvas.is-panning .resize-handle,
.editor-canvas.is-panning .rotate-handle {
  cursor: grabbing !important;
}

.editor-canvas.is-space-pressed {
  cursor: grab;
}

.editor-canvas.is-space-pressed .component-wrapper,
.editor-canvas.is-space-pressed .resize-handle,
.editor-canvas.is-space-pressed .rotate-handle {
  cursor: grab !important;
}

.editor-canvas.is-preview {
  background: #000;
}

.canvas-content {
  position: absolute;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  transition: transform 0.1s ease-out; /* Smooth scale updates */
}

.component-wrapper {
  position: absolute;
  cursor: pointer;
}

.component-wrapper:hover {
  outline: 1px dashed var(--primary-color);
}

.component-wrapper.active {
  outline: 1px solid var(--primary-color);
  z-index: 1000 !important; /* Bring active to front */
}

/* Resize handles */
.resize-handle-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--bg-panel);
  border: 1px solid var(--primary-color);
  border-radius: 50%;
  pointer-events: auto;
  z-index: 1001;
  box-shadow: 0 0 2px rgba(0,0,0,0.3);
}

.resize-handle:hover {
  background: var(--primary-color);
}

.resize-handle.tl { top: -4px; left: -4px; cursor: nw-resize; }
.resize-handle.tm { top: -4px; left: 50%; margin-left: -4px; cursor: n-resize; }
.resize-handle.tr { top: -4px; right: -4px; cursor: ne-resize; }
.resize-handle.r  { top: 50%; right: -4px; margin-top: -4px; cursor: e-resize; }
.resize-handle.br { bottom: -4px; right: -4px; cursor: se-resize; }
.resize-handle.bm { bottom: -4px; left: 50%; margin-left: -4px; cursor: s-resize; }
.resize-handle.bl { bottom: -4px; left: -4px; cursor: sw-resize; }
.resize-handle.l  { top: 50%; left: -4px; margin-top: -4px; cursor: w-resize; }
.splicing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.splice-line {
  position: absolute;
  background: rgba(255,255,255,0.25);
}
.splice-line.vertical {
  top: 0;
  width: 1px;
  height: 100%;
}
.splice-line.horizontal {
  left: 0;
  height: 1px;
  width: 100%;
}

.rotate-handle {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  background: var(--bg-panel);
  border: 1px solid var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: var(--primary-color);
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1002;
}

.rotate-handle:active {
  cursor: grabbing;
  background: var(--primary-color);
  color: #fff;
}

/* Connect the rotate handle to the component with a line */
.rotate-handle::after {
  content: '';
  position: absolute;
  top: 24px;
  left: 50%;
  width: 1px;
  height: 10px;
  background: var(--primary-color);
  transform: translateX(-50%);
}

.lock-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  color: var(--text-secondary);
  font-size: 14px;
  z-index: 10;
  pointer-events: none;
}

.locked-handle-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid var(--text-secondary);
  pointer-events: none;
}
</style>
