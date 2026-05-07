<template>
  <div class="box-renderer" :style="style">
    <template v-if="isTabs">
      <div class="tabs-header">
        <div
          v-for="(tab, idx) in tabs"
          :key="idx"
          class="tab-item"
          :class="{ active: idx === tabsActiveIndex }"
          @click="handleTabClick(idx)"
        >
          {{ tab.label }}
        </div>
      </div>
      <div class="tabs-body">
        <div class="tabs-body-inner" :style="{ background: activeTab.background || 'transparent' }">
          {{ activeTab.content || activeTab.label }}
        </div>
      </div>
    </template>

    <template v-else-if="isCarousel">
      <div class="carousel-body">
        <div class="carousel-slide" :style="{ background: activeSlide.background || 'rgba(255, 255, 255, 0.06)' }">
          {{ activeSlide.content || activeSlide.label }}
        </div>
        <div class="carousel-dots" v-if="slides.length > 1">
          <span
            v-for="(s, idx) in slides"
            :key="idx"
            class="carousel-dot"
            :class="{ active: idx === carouselActiveIndex }"
            @click="handleDotClick(idx)"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

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

const isTabs = computed(() => props.config.key === 'layout-tabs')
const isCarousel = computed(() => props.config.key === 'layout-carousel')

const style = computed(() => {
  return {
    width: '100%',
    height: '100%',
    pointerEvents: props.preview ? 'auto' : 'none',
    ...props.config.style
  }
})

const normalizeTabs = (value) => {
  if (Array.isArray(value) && value.length > 0) {
    return value.map((t, idx) => ({
      label: t?.label ?? `Tab ${idx + 1}`,
      content: t?.content ?? '',
      background: t?.background ?? ''
    }))
  }
  const content = props.config.content || ''
  const parts = String(content)
    .split('|')
    .map(s => s.trim())
    .filter(Boolean)
  if (parts.length > 0) return parts.map((label) => ({ label, content: '', background: '' }))
  return [
    { label: 'Tab 1', content: 'Tab 1', background: '' },
    { label: 'Tab 2', content: 'Tab 2', background: '' },
    { label: 'Tab 3', content: 'Tab 3', background: '' }
  ]
}

const normalizeSlides = (value) => {
  if (Array.isArray(value) && value.length > 0) {
    return value.map((s, idx) => ({
      label: s?.label ?? `Slide ${idx + 1}`,
      content: s?.content ?? '',
      background: s?.background ?? ''
    }))
  }
  return [
    { label: 'Slide 1', content: '轮播 1', background: 'rgba(64, 158, 255, 0.18)' },
    { label: 'Slide 2', content: '轮播 2', background: 'rgba(103, 194, 58, 0.18)' },
    { label: 'Slide 3', content: '轮播 3', background: 'rgba(230, 162, 60, 0.18)' }
  ]
}

const tabs = computed(() => normalizeTabs(props.config.props?.tabs))
const slides = computed(() => normalizeSlides(props.config.props?.slides))

const tabsActiveIndex = ref(0)
const carouselActiveIndex = ref(0)
let carouselTimer = null

const activeTab = computed(() => tabs.value[tabsActiveIndex.value] || tabs.value[0] || { label: '', content: '', background: '' })
const activeSlide = computed(() => slides.value[carouselActiveIndex.value] || slides.value[0] || { label: '', content: '', background: '' })

const handleTabClick = (idx) => {
  if (!props.preview) return
  tabsActiveIndex.value = idx
}

const handleDotClick = (idx) => {
  if (!props.preview) return
  carouselActiveIndex.value = idx
  restartCarousel()
}

const restartCarousel = () => {
  if (carouselTimer) {
    clearInterval(carouselTimer)
    carouselTimer = null
  }
  const autoplay = props.config.props?.autoplay !== false
  const interval = Number(props.config.props?.interval) || 3000
  if (!props.preview || !autoplay || slides.value.length <= 1) return
  carouselTimer = setInterval(() => {
    carouselActiveIndex.value = (carouselActiveIndex.value + 1) % slides.value.length
  }, Math.max(800, interval))
}

onMounted(() => {
  tabsActiveIndex.value = Math.max(0, Number(props.config.props?.activeIndex) || 0)
  carouselActiveIndex.value = Math.max(0, Number(props.config.props?.activeIndex) || 0)
  restartCarousel()
})

onUnmounted(() => {
  if (carouselTimer) clearInterval(carouselTimer)
})
</script>

<style scoped>
.box-renderer {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.tabs-header {
  height: 40px;
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.15);
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  user-select: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.tab-item:last-child {
  border-right: none;
}

.tab-item.active {
  color: #ffffff;
  background: rgba(64, 158, 255, 0.22);
}

.tabs-body {
  height: calc(100% - 40px);
  display: flex;
  align-items: stretch;
}

.tabs-body-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.carousel-body {
  width: 100%;
  height: 100%;
  position: relative;
}

.carousel-slide {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.carousel-dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 8px;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.carousel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  cursor: pointer;
}

.carousel-dot.active {
  background: rgba(64, 158, 255, 0.9);
}
</style>
