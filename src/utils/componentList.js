export const componentList = [
  // ==========================================
  // 1. 基础图表组件 (Basic Charts)
  // ==========================================
  {
    type: 'chart',
    icon: 'TrendCharts',
    label: '折线图',
    key: 'line-chart',
    width: 400,
    height: 300,
    option: {
      title: { text: '折线图' },
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      yAxis: { type: 'value' },
      series: [{ name: 'Data', type: 'line', smooth: true, data: [150, 230, 224, 218, 135, 147, 260] }]
    }
  },
  {
    type: 'chart',
    icon: 'Histogram',
    label: '柱状图',
    key: 'bar-chart',
    width: 400,
    height: 300,
    option: {
      title: { text: '柱状图' },
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      yAxis: { type: 'value' },
      series: [{ name: 'Data', type: 'bar', data: [120, 200, 150, 80, 70, 110, 130] }]
    }
  },
  {
    type: 'chart',
    icon: 'PieChart',
    label: '饼图',
    key: 'pie-chart',
    width: 400,
    height: 300,
    option: {
      title: { text: '饼图' },
      tooltip: { trigger: 'item' },
      series: [
        {
          name: 'Access From',
          type: 'pie',
          radius: '50%',
          data: [
            { value: 1048, name: 'Search Engine' },
            { value: 735, name: 'Direct' },
            { value: 580, name: 'Email' },
            { value: 484, name: 'Union Ads' },
            { value: 300, name: 'Video Ads' }
          ]
        }
      ]
    }
  },
  {
    type: 'chart',
    icon: 'DataAnalysis',
    label: '雷达图',
    key: 'radar-chart',
    width: 400,
    height: 300,
    option: {
      title: { text: '雷达图' },
      radar: {
        indicator: [
          { name: 'Sales', max: 6500 },
          { name: 'Admin', max: 16000 },
          { name: 'IT', max: 30000 },
          { name: 'Support', max: 38000 },
          { name: 'Dev', max: 52000 },
          { name: 'Marketing', max: 25000 }
        ]
      },
      series: [{
        name: 'Budget vs spending',
        type: 'radar',
        data: [{ value: [4200, 3000, 20000, 35000, 50000, 18000], name: 'Allocated Budget' }]
      }]
    }
  },
  {
    type: 'chart',
    icon: 'Place',
    label: '散点图',
    key: 'scatter-chart',
    width: 400,
    height: 300,
    option: {
      title: { text: '散点图' },
      xAxis: {},
      yAxis: {},
      series: [{
        symbolSize: 20,
        data: [[10.0, 8.04], [8.0, 6.95], [13.0, 7.58], [9.0, 8.81], [11.0, 8.33]],
        type: 'scatter'
      }]
    }
  },
  {
    type: 'chart',
    icon: 'Grid',
    label: '热力图',
    key: 'heatmap-chart',
    width: 400,
    height: 300,
    option: {
      title: { text: '热力图' },
      tooltip: { position: 'top' },
      grid: { height: '50%', top: '10%' },
      xAxis: { type: 'category', data: ['12a', '1a', '2a', '3a', '4a', '5a'], splitArea: { show: true } },
      yAxis: { type: 'category', data: ['Sat', 'Fri', 'Thu', 'Wed', 'Tue', 'Mon'], splitArea: { show: true } },
      visualMap: { min: 0, max: 10, calculable: true, orient: 'horizontal', left: 'center', bottom: '15%' },
      series: [{
        name: 'Punch Card',
        type: 'heatmap',
        data: [[0,0,5],[0,1,1],[0,2,0],[0,3,0],[0,4,0],[0,5,0],[1,0,3],[1,1,5],[1,2,2],[1,3,2],[1,4,3],[1,5,2]],
        label: { show: true }
      }]
    }
  },
  {
    type: 'chart',
    icon: 'Odometer',
    label: '仪表盘',
    key: 'gauge-chart',
    width: 300,
    height: 300,
    option: {
      series: [{
        type: 'gauge',
        progress: { show: true },
        detail: { valueAnimation: true, formatter: '{value}' },
        data: [{ value: 50, name: 'SCORE' }]
      }]
    }
  },

  // ==========================================
  // 2. 地理信息组件 (Geographic)
  // ==========================================
  {
    type: 'chart',
    icon: 'MapLocation',
    label: '中国地图',
    key: 'china-map',
    width: 500,
    height: 400,
    option: {
      title: { text: '中国地图 (需引入Map数据)' },
      tooltip: { trigger: 'item' },
      geo: { map: 'china', roam: true, label: { show: true } },
      series: [] // 可以添加散点或热力层
    }
  },
  {
    type: 'chart',
    icon: 'MapLocation',
    label: '世界地图',
    key: 'world-map',
    width: 500,
    height: 400,
    option: {
      title: { text: '世界地图' },
      tooltip: { trigger: 'item' },
      geo: { map: 'world', roam: true },
      series: []
    }
  },
  {
    type: 'chart',
    icon: 'Coordinate',
    label: '3D地球',
    key: '3d-earth',
    width: 400,
    height: 400,
    option: {
      title: { text: '3D地球 (需ECharts GL)' },
      globe: {
        baseTexture: '/textures/earth.jpg',
        heightTexture: '/textures/earth.jpg',
        displacementScale: 0.04,
        environment: '/textures/starfield.jpg',
        shading: 'realistic',
        realisticMaterial: { roughness: 0.9 },
        light: {
          main: {
            intensity: 1.5,
            shadow: true
          },
          ambient: {
            intensity: 0.8
          }
        },
        viewControl: {
          autoRotate: true,
          autoRotateSpeed: 10
        }
      },
      series: []
    }
  },
  {
    type: 'chart',
    icon: 'MapLocation',
    label: '区域热力图',
    key: 'map-heatmap',
    width: 500,
    height: 400,
    option: {
      title: { text: '区域热力图' },
      visualMap: { min: 0, max: 50000, text: ['High', 'Low'], realtime: false, calculable: true, inRange: { color: ['lightskyblue', 'yellow', 'orangered'] } },
      geo: { map: 'china', roam: true },
      series: [
        {
          name: '热力',
          type: 'heatmap',
          coordinateSystem: 'geo',
          data: [] // {name: 'xx', value: [lon, lat, value]}
        }
      ]
    }
  },

  // ==========================================
  // 3. 特殊可视化组件 (Special Visuals)
  // ==========================================
  {
    type: 'chart',
    icon: 'Pouring',
    label: '水位图',
    key: 'liquid-fill',
    width: 300,
    height: 300,
    option: {
      title: { text: '水位图 (需插件)' },
      series: [{
        type: 'liquidFill',
        data: [0.6, 0.5, 0.4, 0.3],
        radius: '80%'
      }]
    }
  },
  {
    type: 'chart',
    icon: 'Loading',
    label: '进度球',
    key: 'progress-ball',
    width: 300,
    height: 300,
    option: {
      series: [{
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        pointer: { show: false },
        progress: { show: true, overlap: false, roundCap: true, clip: false, itemStyle: { borderWidth: 1, borderColor: '#464646' } },
        axisLine: { lineStyle: { width: 40 } },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        data: [{ value: 80, name: 'Progress' }],
        detail: { width: 50, height: 14, fontSize: 14, color: 'auto', borderColor: 'auto', borderRadius: 20, borderWidth: 1, formatter: '{value}%' }
      }]
    }
  },
  {
    type: 'text',
    icon: 'Timer',
    label: '数字翻牌器',
    key: 'digital-flop',
    width: 200,
    height: 60,
    content: '12,345',
    style: {
      fontSize: '40px',
      color: '#00ff00',
      fontWeight: 'bold',
      textAlign: 'center',
      fontFamily: 'monospace',
      letterSpacing: '4px'
    }
  },
  {
    type: 'chart',
    icon: 'Connection',
    label: '关系图谱',
    key: 'graph-chart',
    width: 400,
    height: 400,
    option: {
      title: { text: '关系图谱' },
      series: [{
        type: 'graph',
        layout: 'force',
        symbolSize: 50,
        roam: true,
        label: { show: true },
        edgeSymbol: ['circle', 'arrow'],
        edgeSymbolSize: [4, 10],
        data: [{ name: 'Node 1', x: 300, y: 300 }, { name: 'Node 2', x: 800, y: 300 }, { name: 'Node 3', x: 550, y: 100 }, { name: 'Node 4', x: 550, y: 500 }],
        links: [{ source: 0, target: 1 }, { source: 'Node 2', target: 'Node 1' }, { source: 'Node 1', target: 'Node 3' }, { source: 'Node 2', target: 'Node 3' }, { source: 'Node 2', target: 'Node 4' }, { source: 'Node 1', target: 'Node 4' }]
      }]
    }
  },
  {
    type: 'chart',
    icon: 'Guide',
    label: '桑基图',
    key: 'sankey-chart',
    width: 500,
    height: 300,
    option: {
      title: { text: '桑基图' },
      series: [{
        type: 'sankey',
        layout: 'none',
        emphasis: { focus: 'adjacency' },
        data: [{ name: 'a' }, { name: 'b' }, { name: 'a1' }, { name: 'a2' }, { name: 'b1' }, { name: 'c' }],
        links: [{ source: 'a', target: 'a1', value: 5 }, { source: 'a', target: 'a2', value: 3 }, { source: 'b', target: 'b1', value: 8 }, { source: 'a', target: 'b1', value: 3 }, { source: 'b1', target: 'a1', value: 1 }, { source: 'b1', target: 'c', value: 2 }]
      }]
    }
  },
  {
    type: 'chart',
    icon: 'Filter',
    label: '漏斗图',
    key: 'funnel-chart',
    width: 400,
    height: 300,
    option: {
      title: { text: '漏斗图' },
      series: [{
        type: 'funnel',
        left: '10%',
        top: 60,
        bottom: 60,
        width: '80%',
        min: 0,
        max: 100,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: { show: true, position: 'inside' },
        data: [{ value: 60, name: 'Visit' }, { value: 40, name: 'Inquiry' }, { value: 20, name: 'Order' }, { value: 80, name: 'Click' }, { value: 100, name: 'Show' }]
      }]
    }
  },

  // ==========================================
  // 4. 装饰与交互组件 (Decoration & Interaction)
  // ==========================================
  {
    type: 'decoration',
    icon: 'MagicStick',
    label: '装饰边框',
    key: 'decoration-border',
    width: 300,
    height: 200,
    style: {
      border: '2px solid #00ff00',
      boxShadow: '0 0 10px #00ff00 inset',
      borderRadius: '8px'
    }
  },
  {
    type: 'decoration',
    icon: 'Star',
    label: '装饰元素',
    key: 'decoration-element',
    width: 100,
    height: 100,
    style: {
      backgroundColor: '#409EFF',
      borderRadius: '50%',
      opacity: '0.5'
    }
  },
  {
    type: 'text',
    icon: 'ElementPlus',
    label: '图标',
    key: 'icon-element',
    width: 50,
    height: 50,
    content: '★', // Unicode icon as placeholder
    style: {
      fontSize: '40px',
      color: '#409EFF',
      textAlign: 'center'
    }
  },
  {
    type: 'widget',
    subType: 'el-button',
    icon: 'Pointer',
    label: '按钮',
    key: 'widget-button',
    width: 100,
    height: 40,
    content: '点击我',
    props: { type: 'primary' }
  },
  {
    type: 'widget',
    subType: 'el-input',
    icon: 'Edit',
    label: '输入框',
    key: 'widget-input',
    width: 200,
    height: 40,
    props: { placeholder: '请输入内容' }
  },
  {
    type: 'widget',
    subType: 'el-select',
    icon: 'Select',
    label: '选择器',
    key: 'widget-select',
    width: 200,
    height: 40,
    props: { 
      placeholder: '请选择',
      options: [
        { label: '选项1', value: '1' },
        { label: '选项2', value: '2' }
      ]
    }
  },
  {
    type: 'widget',
    subType: 'el-date-picker',
    icon: 'Calendar',
    label: '时间选择',
    key: 'widget-date',
    width: 220,
    height: 40,
    props: { type: 'datetime', placeholder: '选择日期时间' }
  },

  // ==========================================
  // 5. 布局组件 (Layout)
  // ==========================================
  {
    type: 'container',
    icon: 'Box',
    label: '基础容器',
    key: 'container-basic',
    width: 300,
    height: 200,
    style: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px dashed #666',
      borderRadius: '4px'
    }
  },
  {
    type: 'container',
    icon: 'Grid',
    label: '网格布局',
    key: 'layout-grid',
    width: 400,
    height: 300,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridGap: '10px',
      padding: '10px',
      border: '1px solid #409EFF'
    }
  },
  {
    type: 'container',
    icon: 'Files',
    label: 'Tab页签',
    key: 'layout-tabs',
    width: 400,
    height: 200,
    style: {
      border: '1px solid #409EFF',
      borderRadius: '4px',
      overflow: 'hidden',
      backgroundColor: 'rgba(255, 255, 255, 0.04)'
    },
    props: {
      activeIndex: 0,
      tabs: [
        { label: 'Tab 1', content: 'Tab 1' },
        { label: 'Tab 2', content: 'Tab 2' },
        { label: 'Tab 3', content: 'Tab 3' }
      ]
    }
  },
  {
    type: 'container',
    icon: 'VideoPlay',
    label: '轮播容器',
    key: 'layout-carousel',
    width: 400,
    height: 200,
    style: {
      border: '1px solid #409EFF',
      overflow: 'hidden',
      position: 'relative',
      borderRadius: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.04)'
    },
    props: {
      activeIndex: 0,
      autoplay: true,
      interval: 3000,
      slides: [
        { label: 'Slide 1', content: '轮播 1', background: 'rgba(64, 158, 255, 0.18)' },
        { label: 'Slide 2', content: '轮播 2', background: 'rgba(103, 194, 58, 0.18)' },
        { label: 'Slide 3', content: '轮播 3', background: 'rgba(230, 162, 60, 0.18)' }
      ]
    }
  }
]
