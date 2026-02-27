# CLAUDE.md - 项目分析文档

## 项目概述

**项目名称**: redesigned-potato
**项目类型**: 全栈Web应用 - 个人生活时间胶囊
**主要功能**: Life TimeLine - 记录和展示个人生活事件的时间线应用
**开发框架**: Next.js 13 (App Router)
**包管理器**: pnpm 10.13.1

---

## 技术栈

### 前端技术
- **框架**: Next.js 13.4.12 (App Router架构)
- **UI库**: React 18.2.0
- **组件库**: Ant Design 5.8.5
- **样式**: Tailwind CSS 3.3.3, Sass 1.66.1
- **PWA**: next-pwa 5.6.0
- **Markdown**: react-markdown 8.0.7 + remark-gfm 3.0.1

### 后端技术
- **运行时**: Node.js
- **API**: Next.js API Routes
- **数据库**: MongoDB (mongoose 7.5.0)
- **任务调度**: Trigger.dev 4.0.4
- **加密**: crypto-js 4.2.0

### 外部服务
- **云存储**: 七牛云 (qiniu 7.9.0)
- **IP查询**: ipify API
- **地图服务**: 高德地图 API
- **认证**: Cloudflare Access
- **密钥管理**: Infisical (infisical-node 1.4.3)

---

## 核心功能模块

### 1. 时间线功能 (`/timeline`)

**功能描述**:
- 记录个人生活事件，包含日期、天气、内容、照片、视频、标签等信息
- 按年份筛选和查看历史记录
- 支持增删改查操作
- 使用Ant Design Timeline组件展示

**技术实现**:
- 客户端组件 (use client)
- MongoDB存储数据
- 七牛云CDN存储图片/视频
- 浮动按钮组：新增、删除模式、年份选择、返回顶部

**相关文件**:
- `app/timeline/page.jsx` - 时间线页面
- `components/timeline/NodeLabel.jsx` - 时间节点标签
- `components/timeline/NodeChild.jsx` - 时间节点内容
- `components/timeline/NewTimeLine.jsx` - 新增时间线表单
- `database/modules/TimeLineData.js` - 数据模型
- `database/modules/TimeLineDataAction.js` - 数据操作

### 2. IP地理位置查询 (`/ip` 或 `/ip/{ip}`)

**功能描述**:
- 查询访问者当前IP的地理位置信息
- 支持查询指定IP地址
- 显示国家、地区、城市及国旗图标
- 显示User-Agent信息

**技术实现**:
- 服务端组件 (Server Component)
- 使用ipify API获取地理位置数据
- Next.js Image组件优化图片加载
- 支持X-Real-IP和X-Forwarded-For请求头

**相关文件**:
- `app/ip/[[...slugs]]/page.jsx` - IP查询页面

### 3. 七牛云存储集成 (`/qiniu`)

**功能描述**:
- 处理图片和视频上传
- 生成上传凭证
- CDN加速访问

**技术实现**:
- API Route处理上传请求
- 七牛云SDK集成
- CDN域名: `https://fla.cdn.bosyun.com`

**相关文件**:
- `app/qiniu/route.js` - 七牛云API路由

### 4. Slug生成API (`/api/slug/generate`)

**功能描述**:
- 生成URL友好的slug字符串

**相关文件**:
- `app/api/slug/generate/route.js` - Slug生成API

### 5. JSON数据接口 (`/json`)

**功能描述**:
- 提供JSON格式的数据接口

**相关文件**:
- `app/json/page.jsx` - JSON数据页面

---

## 数据模型

### TimeLineData Schema

```javascript
{
  year: String,           // 年份 (必填)
  month: String,          // 月份 (必填)
  day: String,            // 日期 (必填)
  week: String,           // 星期 (必填)
  weather: Mixed,         // 天气信息
  content: String,        // 文本内容 (必填)
  status: String,         // 状态: ENABLED/DISABLED (默认ENABLED)
  photos: Array,          // 照片数组 (七牛云CDN链接)
  creator: String,        // 创建者
  video: String,          // 视频链接
  tags: Array,            // 标签数组
  extends: Mixed,         // 扩展字段
  timestamps: true        // 自动添加createdAt和updatedAt
}
```

**photos字段处理**:
- 自动过滤status为"done"的图片
- 转换为包含src、width、height的对象
- src使用CDN_DOMAIN环境变量拼接

---

## 安全与认证

### Cloudflare Access认证

**实现位置**: `middleware.jsx`

**认证流程**:
1. 用户访问应用时，Cloudflare检查登录态
2. 未登录用户弹出Cloudflare登录页面
3. 登录成功后，请求头包含:
   - `Cf-Access-Authenticated-User-Email` - 用户邮箱
   - `Cf-Access-Jwt-Assertion` - JWT令牌
4. 后续请求Cookie中包含 `CF_Authorization`

**相关文档**: [Cloudflare Access JWT验证](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/)

---

## 环境变量

### 必需的环境变量

```bash
# 高德地图API
NEXT_PUBLIC_AMAP_PRIVATE_KEY=<高德地图私钥>
NEXT_PUBLIC_AMAP_ACCESS_KEY=<高德地图访问密钥>

# IP查询API
IPIFY_API_KEY=<ipify API密钥>

# 七牛云存储
QINIU_SECRET_KEY=<七牛云密钥>
QINIU_ACCESS_KEY=<七牛云访问密钥>
CDN_DOMAIN=<CDN域名>

# MongoDB数据库
MONGODB_URL=<MongoDB连接字符串>
```

### 安全建议

⚠️ **重要**: 当前.env文件包含敏感信息，建议:
1. 确保.env文件已添加到.gitignore
2. 使用git filter-branch或BFG Repo-Cleaner清理历史记录
3. 轮换所有API密钥和数据库凭证
4. 考虑使用Infisical等密钥管理工具（项目已安装但未启用）

---

## 项目结构

```
redesigned-potato/
├── app/                          # Next.js App Router
│   ├── layout.js                # 根布局 (Inter字体, 背景图)
│   ├── page.js                  # 首页 (服务器运行提示)
│   ├── globals.css              # 全局样式
│   ├── timeline/                # 时间线模块
│   │   ├── page.jsx            # 时间线页面
│   │   └── page.scss           # 时间线样式
│   ├── ip/[[...slugs]]/        # IP查询模块 (动态路由)
│   │   └── page.jsx            # IP查询页面
│   ├── json/                    # JSON接口
│   │   └── page.jsx
│   ├── qiniu/                   # 七牛云API
│   │   └── route.js
│   └── api/                     # API路由
│       └── slug/generate/
│           └── route.js
├── src/
│   └── trigger/                 # Trigger.dev任务
│       └── example.ts           # 示例任务 (hello-world)
├── database/                    # 数据库模块
│   ├── mongodb.js              # MongoDB连接
│   └── modules/
│       ├── TimeLineData.js     # 时间线数据模型
│       └── TimeLineDataAction.js # 时间线数据操作
├── components/                  # React组件
│   └── timeline/               # 时间线组件
│       ├── NodeLabel.jsx
│       ├── NodeChild.jsx
│       └── NewTimeLine.jsx
├── public/                      # 静态资源
│   ├── bg.webp                 # 背景图
│   └── manifest.json           # PWA配置
├── middleware.jsx               # Cloudflare认证中间件
├── trigger.config.ts            # Trigger.dev配置
├── next.config.js               # Next.js配置 (PWA, 图片域名)
├── tailwind.config.js           # Tailwind配置
├── postcss.config.js            # PostCSS配置
├── jsconfig.json                # JavaScript配置
├── services.js                  # 服务工具
├── utils.js                     # 工具函数
├── .env                         # 环境变量 (⚠️ 敏感信息)
├── .gitignore                   # Git忽略文件
├── package.json                 # 项目依赖
├── pnpm-lock.yaml              # pnpm锁文件
└── README.md                    # 项目说明
```

---

## 配置文件说明

### next.config.js

**关键配置**:
- PWA支持 (next-pwa)
- React严格模式
- 实验性功能: Server Actions, mongoose外部包
- 图片远程域名白名单:
  - `ipdata.co` (国旗图标)
  - `restapi.amap.com` (高德地图)
  - `1.13.189.65` (自定义域名)

### trigger.config.ts

**Trigger.dev配置**:
- 项目ID: `proj_hkiduvmkyyqnedxtqgof`
- 运行时: Node.js
- 最大执行时间: 3600秒 (1小时)
- 重试策略: 最多3次，指数退避
- 任务目录: `./src/trigger`

### tailwind.config.js

**Tailwind配置**:
- 内容路径: pages, components, app目录
- 主题扩展: 自定义颜色、字体等

---

## 开发指南

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
pnpm build
```

### 启动生产服务器

```bash
pnpm start
```

### 代码检查

```bash
pnpm lint
```

---

## 特色功能

### PWA支持

- 使用next-pwa实现渐进式Web应用
- 支持离线访问
- 可安装为桌面/移动应用
- manifest.json配置应用元数据

### 图片优化

- Next.js Image组件自动优化
- 支持远程图片域名白名单
- 七牛云CDN加速

### 任务调度

- Trigger.dev集成
- 支持异步任务执行
- 自动重试机制
- 示例任务: hello-world (5秒延迟)

### Markdown支持

- react-markdown渲染Markdown内容
- remark-gfm支持GitHub风格Markdown
- 适用于时间线内容展示

---

## API端点

### 公开端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 首页 - 服务器运行状态 |
| `/timeline` | GET | 时间线页面 |
| `/ip` | GET | 查询当前访问者IP信息 |
| `/ip/{ip}` | GET | 查询指定IP信息 |
| `/json` | GET | JSON数据接口 |

### API路由

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/slug/generate` | POST | 生成URL slug |
| `/qiniu` | POST | 七牛云上传凭证 |

---

## 数据库操作

### TimeLineDataAction

**主要方法**:
- `queryTimeLineAll({ status, year })` - 查询所有时间线数据
- `enumTimeLineYear()` - 枚举所有年份
- 其他CRUD操作 (需查看完整文件)

**使用示例**:
```javascript
import { queryTimeLineAll, enumTimeLineYear } from '@/database/modules/TimeLineDataAction';

// 查询2024年启用的时间线
const data = await queryTimeLineAll({ status: 'ENABLED', year: '2024' });

// 获取所有年份
const years = await enumTimeLineYear();
```

---

## 工具函数

### utils.js

**主要函数**:
- `splitDate()` - 分割日期为 [year, month, day]

**使用示例**:
```javascript
import { splitDate } from '@/utils';

const [year, month, day] = splitDate();
```

---

## 已知问题与改进建议

### 安全问题

1. ⚠️ .env文件包含敏感信息，需要清理Git历史
2. 考虑启用Infisical进行密钥管理
3. 添加API速率限制
4. 实现更完善的Cloudflare JWT验证

### 性能优化

1. 时间线数据可以实现分页加载
2. 图片可以添加懒加载
3. 考虑使用React.memo优化组件渲染
4. 添加Service Worker缓存策略

### 功能增强

1. 添加搜索功能
2. 支持导出时间线数据
3. 添加数据备份功能
4. 实现多用户支持
5. 添加评论功能
6. 支持更多媒体类型

### 代码质量

1. 添加TypeScript支持
2. 完善错误处理
3. 添加单元测试
4. 添加E2E测试
5. 改进代码注释和文档

---

## 依赖版本

### 核心依赖

```json
{
  "@trigger.dev/sdk": "4.0.4",
  "antd": "^5.8.5",
  "mongoose": "^7.5.0",
  "next": "13.4.12",
  "react": "18.2.0",
  "react-dom": "18.2.0"
}
```

### 开发依赖

```json
{
  "@trigger.dev/build": "4.0.4"
}
```

---

## 浏览器支持

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)
- 移动浏览器 (iOS Safari, Chrome Mobile)

---

## 许可证

私有项目 (private: true)

---

## 联系方式

项目维护者: wangjun
MongoDB用户: wangjun

---

## 更新日志

### 最近提交

- 244eb0c - fix
- 527c1a6 - fix
- a278bf4 - fix
- b5a4900 - fix
- 9f5b586 - fix

---

## 相关资源

- [Next.js文档](https://nextjs.org/docs)
- [Ant Design文档](https://ant.design/)
- [Tailwind CSS文档](https://tailwindcss.com/docs)
- [Trigger.dev文档](https://trigger.dev/docs)
- [MongoDB文档](https://www.mongodb.com/docs/)
- [七牛云文档](https://developer.qiniu.com/)
- [Cloudflare Access文档](https://developers.cloudflare.com/cloudflare-one/)

---

*本文档由Claude AI自动生成，最后更新时间: 2025年2月*
