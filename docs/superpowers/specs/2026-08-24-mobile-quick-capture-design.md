# 移动端首页快速录入页 — 设计文档

日期：2026-08-24
状态：已确认，待用户复核

## 目标

将首页 `/` 从空占位页改造为「移动端快速录入页」：文字 + 拍照/相册 + 自动定位天气，底部「进入 timeline」按钮。仅移动端使用；PC 端保持原有占位页与原有 `/timeline` 访问方式不变。

## 核心需求

1. **设备区分**：移动端 `/` 渲染录入页；PC 端 `/` 渲染原占位页（`the server is running...`，保持不变）。
2. **录入内容**：文字（markdown）+ 照片（拍照/相册两个入口）+ 自动定位/天气。
3. **保存时机**：浏览器已有有效 `CF_Authorization` cookie 时，首页可直接保存；无 cookie（首次访问）时暂存到浏览器，验证后自动保存。
4. **进入 timeline**：录入页底部「进入 timeline」按钮 → 跳转 `/timeline`，由 Cloudflare Access 在源头拦截未登录请求完成验证。

## 架构

### 设备识别

- 新增 `lib/device.js`：`isMobile(userAgent)`，User-Agent 正则判断移动端（`Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini`）。
- `app/page.js` 改为 Server Component，用 `next/headers` 读 `headers()` 获取 UA：
  - 移动端 → 渲染 `<QuickCapture />`（客户端组件）。
  - PC 端 → 渲染原占位页。
- 副作用：`/` 因读 headers 变为动态渲染（无静态缓存），个人应用可接受。
- 已知边界：iPad 开启「请求桌面网站」会被识别为桌面端，可接受。

### 页面与组件

- **`app/page.js`**（改）：Server Component 外壳，按设备条件渲染。
- **`components/home/QuickCapture.jsx`**（新，客户端组件，独立于 timeline 抽屉）：
  - markdown 文本编辑（复用 SimpleMDE，与 timeline 一致的工具栏）。
  - 「拍照」按钮：`<input type="file" accept="image/*" capture="environment">`。
  - 「从相册选」按钮：`<input type="file" accept="image/*">`。
  - 照片缩略图预览 + 删除。
  - 自动定位/天气：`navigator.geolocation` + `lib/amap.js`（复用，不二次实现签名）。
  - 「保存」按钮。
  - 底部「进入 timeline」按钮 → `/timeline`。
- **`components/home/QuickCapture.scss`**（新）：样式。

### 数据保存路径

- **`app/api/timeline/route.js`**（新，POST）：创建时间线条目，自动被 middleware `/api/*` 保护（无 cookie 返回 401）。
- **`database/modules/timeLineRepository.js`**（新）：提取纯保存函数 `insertTimeLine(data)`（连接 Mongo + 校验 + 保存），供新 API 路由与现有 Server Action `createTimeLine` 复用。

### 认证门控 + 暂存

- **`app/api/auth/check/route.js`**（新，GET）：探测是否已认证（受 middleware 保护，200=已登录，401=未登录）。
- **`lib/draftStore.js`**（新）：IndexedDB 暂存草稿（文字 + 照片 Blob），跨路由共享。

### 保存流程

1. **有 cookie**：上传照片（`/api/qiniu` 取 token + 直传七牛）→ POST `/api/timeline` → 成功提示。
2. **无 cookie**：
   - 草稿（文字 + 照片 Blob）写入 IndexedDB。
   - 提示「请先点进入 timeline 完成验证，内容已暂存」。
   - 用户点「进入 timeline」→ `/timeline` → Cloudflare 验证 → 落到 `/timeline`。
   - `/timeline` 挂载时检测 IndexedDB 草稿 → 自动上传照片 + 保存 → 清草稿 + 提示「已自动保存」。

### 数据流

```
移动端 / (QuickCapture)
  ├─ 文字 → SimpleMDE → markdown 字符串
  ├─ 照片 → 七牛上传 → key 数组
  ├─ 定位 → navigator.geolocation → /api/amap/sign → 高德 regeo/weather
  └─ 保存 → 有 cookie: POST /api/timeline
           无 cookie: IndexedDB 暂存 → 进入 /timeline → 自动提交
```

## 修改/新增文件清单

新增：
- `lib/device.js`
- `components/home/QuickCapture.jsx`
- `components/home/QuickCapture.scss`
- `app/api/timeline/route.js`
- `app/api/auth/check/route.js`
- `database/modules/timeLineRepository.js`
- `lib/draftStore.js`

修改：
- `app/page.js`（设备条件渲染）
- `database/modules/TimeLineDataAction.js`（`createTimeLine` 改为调用 `insertTimeLine`，行为不变）
- `app/timeline/page.jsx`（挂载时检测并自动保存暂存草稿）

不改：
- `middleware.js`（`/api/*` 已覆盖新 API 路由）
- `components/timeline/NewTimeLine.jsx`（原抽屉保持不变）

## 错误处理

- 无 cookie 保存 → 401 → 暂存 + 引导验证（不丢数据）。
- 上传/保存失败 → 保留草稿，提示重试。
- 定位/天气失败 → 静默降级（无地理位置也可保存），与现有抽屉行为一致。
- 自动保存草稿失败 → 保留草稿，提示手动重试。

## 测试与验证

- 项目无测试框架，采用手动验证。
- **关键限制**：`middleware.js` 在 `NODE_ENV === "development"` 直接放行，dev 下无法触发真实 401，暂存/自动保存链路需 `next build && next start`（生产模式）本地验证，或部署后验证。
- 手动验证场景：
  1. 移动端（或 DevTools 手机模拟）访问 `/` 看到录入页；PC 端访问 `/` 仍是占位页。
  2. 有 cookie 时移动端保存直接成功。
  3. 无 cookie 时保存触发暂存 + 引导，验证后自动保存。
  4. 拍照 / 相册两个入口各自正常。

## 范围外（YAGNI）

- 不做 markdown 全文语法增强（沿用现有 `remark-gfm`）。
- 不改 PC 端行为、不改 `/timeline` 列表交互。
- 不引入测试框架、不引入新的设备检测依赖。
