# 大屏可视化生成器系统 (BSP Generator)

> ⚠️ **演示说明**：本项目为**纯前端**交付物，旨在演示低代码大屏编辑器的核心交互与渲染能力。部分依赖后端的功能（如用户鉴权、数据持久化、服务端代理）采用**前端 Mock** 或 **浏览器本地存储 (IndexedDB/LocalStorage)** 实现。

基于 Vue 3 + Vite + Element Plus + ECharts 开发的高性能可视化大屏拖拉生成器系统。支持拖拽布局、实时数据绑定、3D 地理信息展示及 WebSocket 实时推送。

## ✨ 核心特性

- **所见即所得 (WYSIWYG)**：支持组件拖拽布局、缩放、旋转、图层管理，画布自适应缩放与平移（支持鼠标滚轮与空格键交互）。
- **丰富组件库**：
  - **基础图表**：折线图、柱状图、饼图、雷达图、散点图、热力图、仪表盘等。
  - **地理信息**：中国地图（支持下钻）、世界地图、3D 地球（支持光照与自转控制）、区域热力图。
  - **特殊可视化**：水位图、进度球、数字翻牌器（支持动画）、关系图谱、桑基图、漏斗图。
  - **交互与装饰**：动态边框、装饰元素、自定义图片/视频、轮播列表。
- **数据源管理**：
  - **静态数据**：支持 JSON 格式直接编辑。
  - **API 接口**：支持 GET/POST 请求 (Axios)，支持跨域请求（需后端配合 CORS），内置失败降级 Mock 演示。
  - **WebSocket**：支持真实 WS 连接，内置失败降级 Mock 演示。
- **样式与交互**：
  - **全局主题**：内置科技蓝、自然绿等多种大屏主题。
  - **组件配置**：细粒度的样式控制（颜色、字体、边距、动画）。
  - **交互事件**：支持组件点击联动、悬停效果。
- **项目管理**：支持项目创建、保存（IndexedDB 本地持久化）、加密导出（.bsp）、导入及版本快照。

## ⚠️ 功能限制与说明

由于本项目为纯前端架构，以下功能存在特定限制：

1. **数据持久化**：项目数据存储在浏览器的 IndexedDB 和 LocalStorage 中。清除浏览器缓存将导致数据丢失。建议定期使用“导出项目”功能备份数据。
2. **用户权限**：用户角色（管理员/编辑者/查看者）切换仅为前端 UI 状态模拟，无真实后端鉴权保护。
3. **API 跨域**：配置 RESTful API 时，如果目标服务器未开启 CORS，浏览器将拦截请求。演示模式下会自动降级使用模拟数据。
4. **WebSocket**：若连接失败（如地址不可达），系统会自动切换到模拟数据流以展示组件动态效果。

## 🛠 技术栈

- **前端核心**: [Vue 3](https://v3.vuejs.org/) (Composition API)
- **构建工具**: [Vite](https://vitejs.dev/)
- **UI 组件库**: [Element Plus](https://element-plus.org/)
- **图表引擎**: [ECharts 5](https://echarts.apache.org/) + [ECharts GL](https://github.com/ecomfe/echarts-gl) (3D支持)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **工具库**: [Axios](https://axios-http.com/), [Lodash](https://lodash.com/), [Sass](https://sass-lang.com/)
- **拖拽交互**: HTML5 Drag & Drop API

## 📂 目录结构

```
.
│   ├── public/              # 静态资源 (地图GeoJSON, 纹理贴图等)
│   ├── src/
│   │   ├── components/      # 核心组件 (编辑器, 渲染器, 配置面板)
│   │   ├── store/           # Pinia 状态管理
│   │   ├── utils/           # 工具函数 (组件注册列表, 主题配置)
│   │   ├── views/           # 页面视图
│   │   └── App.vue          # 根组件
│   └── package.json         # 项目依赖配置
```

## 🚀 快速开始

### 本地开发

1. **安装依赖**
   ```bash
   npm install
   # 如果遇到依赖冲突，尝试使用 legacy-peer-deps
   npm install --legacy-peer-deps
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **访问应用**
   打开浏览器访问 `http://localhost:3000`

## 🧩 组件开发指南

### 添加新组件
1. 在 `src/utils/componentList.js` 中注册组件元数据（类型、默认配置、图标）。
2. 在 `src/components/Editor/Renderers` 目录下创建或复用相应的渲染器（如 `ChartRenderer.vue`, `TextRenderer.vue`）。
3. 如果组件需要特殊的配置面板，请更新 `ConfigPanel.vue`。

