# 移动端首页快速录入页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 首页 `/` 在移动端渲染快速录入页（文字 + 拍照/相册 + 定位天气），PC 端保持占位页；无 cookie 时草稿暂存，验证后自动保存。

**Architecture:** 新增共享保存函数与 `/api/timeline` POST 路由复用 middleware 的 `/api/*` 保护；`app/page.js` 用 UA 做设备条件渲染；客户端 QuickCapture 组件承担录入；IndexedDB 暂存草稿，`/timeline` 挂载时自动提交。

**Tech Stack:** Next.js 13.4 App Router（纯 JS/.jsx）、React 18、Ant Design v5、SimpleMDE（easymde）、Mongoose、IndexedDB、`next/headers`、`next/navigation`。

## Global Constraints

- 项目纯 JS（React 组件用 `.jsx`；`app/page.js`、`app/layout.js` 保持 `.js` 不动）。
- 无测试框架（AGENTS.md），验证用 `pnpm build` + 手动浏览器；**dev 下 middleware 放行认证**，401 链路需 `pnpm build && pnpm start` 验证。
- 路径别名 `@/*` → `./*`。
- 照片字段（`TimeLineData` 的 `photos` setter）期望 antd Upload fileList 形状 `[{ status: "done", response: { key } }]`，会被 setter 转成 `{ src: CDN_DOMAIN/key }`。
- 必填字段：`year`、`month`、`day`、`week`、`content`。
- `creator` 沿用现有硬编码 `"wangjunneil@gmail.com"`。
- 不改 `middleware.js`、不改 `components/timeline/NewTimeLine.jsx`（原抽屉）、不改 PC 端行为。

---

### Task 1: 共享保存层 + 创建条目 API 路由

**Files:**
- Create: `database/modules/timeLineRepository.js`
- Create: `app/api/timeline/route.js`
- Create: `app/api/auth/check/route.js`
- Modify: `database/modules/TimeLineDataAction.js:7-21`

**Interfaces:**
- Produces: `insertTimeLine(data)` — 纯函数，连接 Mongo、校验必填、保存并返回 `{ ...doc, _id: string }`。供 Server Action 与 `/api/timeline` POST 复用。
- Produces: `POST /api/timeline` — 接收 JSON body（同 `createTimeLine` 的 data），返回 `{ status: "ok", data }` 或 500。
- Produces: `GET /api/auth/check` — 返回 `{ status: "ok", authenticated: true }`（200）；无 cookie 时由 middleware 返回 401。

- [ ] **Step 1: 新建 `database/modules/timeLineRepository.js`**

```js
import connectMongo from "@/database/mongodb";
import TimeLineData from "./TimeLineData";

export async function insertTimeLine(data) {
  await connectMongo();
  if (!data || !data.content || !data.year || !data.month || !data.day) {
    throw new Error("Missing required fields: content, year, month, day");
  }
  const newTimeLine = TimeLineData(data);
  await newTimeLine.save();
  return { ...newTimeLine._doc, _id: newTimeLine._id.toString() };
}
```

- [ ] **Step 2: 重构 `database/modules/TimeLineDataAction.js` 的 `createTimeLine`**

将第 1-21 行改为（保留 `"use server"`、其余函数不动）：

```js
"use server";

import connectMongo from "@/database/mongodb";
import { PAGE_SIZE } from "@/utils";
import TimeLineData from "./TimeLineData";
import { insertTimeLine } from "./timeLineRepository";

export async function createTimeLine(data) {
  try {
    return await insertTimeLine(data);
  } catch (error) {
    throw new Error(error.message || "Failed to create timeline");
  }
}
```

（`connectMongo` 仍被 `queryTimeLineAll` 等其余函数使用，保留 import。）

- [ ] **Step 3: 新建 `app/api/timeline/route.js`**

```js
import { NextResponse } from "next/server";
import { insertTimeLine } from "@/database/modules/timeLineRepository";

export async function POST(request) {
  try {
    const body = await request.json();
    const data = await insertTimeLine(body);
    return NextResponse.json({ status: "ok", data });
  } catch (error) {
    console.error("创建时间线失败:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: 新建 `app/api/auth/check/route.js`**

```js
import { NextResponse } from "next/server";

// 受 middleware /api/* 保护：无 cookie 时 middleware 直接返回 401，本函数不会执行。
export async function GET() {
  return NextResponse.json({ status: "ok", authenticated: true });
}
```

- [ ] **Step 5: 验证编译**

Run: `pnpm build`
Expected: 构建成功，无报错。

- [ ] **Step 6: Commit**

```bash
git add database/modules/timeLineRepository.js database/modules/TimeLineDataAction.js app/api/timeline/route.js app/api/auth/check/route.js
git commit -m "feat: 提取共享保存函数并新增创建条目/认证探测 API"
```

---

### Task 2: 设备识别 + 首页条件渲染

**Files:**
- Create: `lib/device.js`
- Modify: `app/page.js`（整文件）

**Interfaces:**
- Produces: `isMobile(userAgent)` — 返回 boolean。
- Consumes: `QuickCapture`（Task 5 才实现；本任务用内联占位）。

- [ ] **Step 1: 新建 `lib/device.js`**

```js
export function isMobile(userAgent = "") {
  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent
  );
}
```

- [ ] **Step 2: 改写 `app/page.js`**

```js
import { headers } from "next/headers";
import { isMobile } from "@/lib/device";

export default function Home() {
  const headersList = headers();
  const userAgent = headersList.get("user-agent") || "";

  if (isMobile(userAgent)) {
    // 移动端：快速录入页（Task 5 替换为真实组件）
    return (
      <div style={{ padding: 24, fontSize: 16 }}>移动端录入页占位</div>
    );
  }

  return (
    <div className='p-3 text-green-800 hover:text-green-300 text-sm'>
      the server is running...
    </div>
  );
}
```

- [ ] **Step 3: 验证编译**

Run: `pnpm build`
Expected: 构建成功。

- [ ] **Step 4: Commit**

```bash
git add lib/device.js app/page.js
git commit -m "feat: 首页按设备条件渲染（移动端录入占位）"
```

---

### Task 3: 草稿暂存库（IndexedDB）

**Files:**
- Create: `lib/draftStore.js`

**Interfaces:**
- Produces: `saveDraft(draft)`、`getDraft()`、`clearDraft()`，`draft = { content: string, files: File[] }`（File 是 Blob，IndexedDB 结构化克隆可直接存储）。

- [ ] **Step 1: 新建 `lib/draftStore.js`**

```js
// IndexedDB 草稿暂存：文字 + 照片 File（跨路由共享，验证后自动保存）
const DB_NAME = "timeline-draft";
const STORE_NAME = "drafts";
const KEY = "quick-capture";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDraft(draft) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(draft, KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getDraft() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(KEY);
    req.onsuccess = () => { db.close(); resolve(req.result || null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function clearDraft() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
```

- [ ] **Step 2: 验证编译**

Run: `pnpm build`
Expected: 构建成功（本文件未被引用，仅校验语法）。

- [ ] **Step 3: Commit**

```bash
git add lib/draftStore.js
git commit -m "feat: IndexedDB 草稿暂存库"
```

---

### Task 4: 提交辅助（上传 + 创建）

**Files:**
- Create: `lib/timelineSubmit.js`

**Interfaces:**
- Consumes: `/api/auth/check`（认证探测）、`/api/qiniu`（上传 token）、`/api/timeline`（创建）、`splitDate`/`currentDate`（`@/utils`）。
- Produces: `submitTimeline({ content, files, geo, weather })` — 上传照片并创建条目；无 cookie 时抛 `new Error("UNAUTHORIZED")`。供 QuickCapture 与 `/timeline` 自动保存复用。

- [ ] **Step 1: 新建 `lib/timelineSubmit.js`**

```js
import { currentDate, splitDate } from "@/utils";

const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const CREATOR = "wangjunneil@gmail.com";

async function uploadFileToQiniu(file) {
  const tokenRes = await fetch("/api/qiniu", { cache: "no-cache" });
  if (tokenRes.status === 401) throw new Error("UNAUTHORIZED");
  if (!tokenRes.ok) throw new Error("获取上传 token 失败");
  const { token } = await tokenRes.json();

  const formData = new FormData();
  formData.append("token", token);
  formData.append("key", `wangjundev/timeline/${currentDate()}/${file.name}`);
  formData.append("file", file);

  const uploadRes = await fetch("https://upload.qiniup.com", {
    method: "POST",
    body: formData,
  });
  if (!uploadRes.ok) throw new Error("上传文件失败");
  const res = await uploadRes.json();
  return { status: "done", response: { key: res.key } };
}

export async function submitTimeline({ content, files = [], geo = {}, weather = {} }) {
  const check = await fetch("/api/auth/check", { cache: "no-cache" });
  if (check.status === 401) throw new Error("UNAUTHORIZED");

  const photos = [];
  for (const f of files) {
    photos.push(await uploadFileToQiniu(f));
  }

  const [year, month, day] = splitDate();
  const dayOfWeek = new Date(`${year}-${month}-${day}`).getDay();

  const payload = {
    year,
    month,
    day,
    week: weekDays[dayOfWeek],
    weather,
    content,
    photos,
    creator: CREATOR,
    extends: { geo: geo || {} },
  };

  const res = await fetch("/api/timeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("保存失败");
  return res.json();
}
```

- [ ] **Step 2: 验证编译**

Run: `pnpm build`
Expected: 构建成功。

- [ ] **Step 3: Commit**

```bash
git add lib/timelineSubmit.js
git commit -m "feat: 上传照片并创建条目的提交辅助函数"
```

---

### Task 5: QuickCapture 录入组件 + 样式

**Files:**
- Create: `components/home/QuickCapture.jsx`
- Create: `components/home/QuickCapture.scss`
- Modify: `app/page.js`（将占位替换为 `<QuickCapture />`）

**Interfaces:**
- Consumes: `submitTimeline`（Task 4）、`saveDraft`（Task 3）、`amapGet`（`@/lib/amap`）、SimpleMDE（`react-simplemde-editor` + `easymde.min.css`）。
- Produces: `QuickCapture` 默认导出组件。

- [ ] **Step 1: 新建 `components/home/QuickCapture.jsx`**

```jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { CameraOutlined, PictureOutlined } from "@ant-design/icons";
import { Button, Spin, message } from "antd";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { amapGet } from "@/lib/amap";
import { submitTimeline } from "@/lib/timelineSubmit";
import { saveDraft } from "@/lib/draftStore";
import "easymde/dist/easymde.min.css";
import "./QuickCapture.scss";

const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false,
});

const mdeOptions = {
  spellChecker: false,
  placeholder: "记下此刻...",
  status: false,
  toolbar: [
    "bold",
    "italic",
    "heading",
    "|",
    "quote",
    "unordered-list",
    "ordered-list",
    "|",
    "link",
    "image",
  ],
  minHeight: "120px",
  maxHeight: "300px",
  autofocus: false,
  hideIcons: ["side-by-side", "fullscreen"],
};

const QuickCapture = () => {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [geo, setGeo] = useState({});
  const [weather, setWeather] = useState({});
  const [saving, setSaving] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // 自动定位 + 天气（无 cookie 时 amap 签名 401，静默降级）
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const longitude = position.coords.longitude;
        const latitude = position.coords.latitude;
        try {
          const res = await amapGet("/v3/geocode/regeo", {
            location: `${longitude},${latitude}`,
          });
          if (res?.info === "OK") {
            const c = res.regeocode.addressComponent;
            setGeo({
              longitude,
              latitude,
              adcode: c.adcode || "320100",
              city: c.city,
              district: c.district,
              street: c.township,
              formatted_address: res.regeocode.formatted_address,
            });
          }
        } catch (e) {
          console.warn("定位失败:", e);
        }
      },
      () => {}
    );
  }, []);

  useEffect(() => {
    if (!geo?.adcode) return;
    (async () => {
      try {
        const res = await amapGet("/v3/weather/weatherInfo", {
          city: geo.adcode,
          extensions: "base",
        });
        if (res?.info === "OK" && res?.lives?.length > 0) {
          setWeather(res.lives[0]);
        }
      } catch (e) {
        console.warn("天气获取失败:", e);
      }
    })();
  }, [geo?.adcode]);

  const addFiles = (newFiles) => {
    const list = Array.from(newFiles);
    setFiles((prev) => [...prev, ...list]);
    setPreviews((prev) => [
      ...prev,
      ...list.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    ]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const target = prev[index];
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSave = async () => {
    if (!content.trim() && files.length === 0) {
      message.warning("请先输入内容或添加照片");
      return;
    }
    setSaving(true);
    try {
      await submitTimeline({ content, files, geo, weather });
      message.success("保存成功");
      setContent("");
      setFiles([]);
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setPreviews([]);
    } catch (e) {
      if (e.message === "UNAUTHORIZED") {
        await saveDraft({ content, files });
        message.info("请先点底部「进入 timeline」完成验证，内容已暂存");
      } else {
        message.error(e.message || "保存失败");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="quick-capture">
      <h1 className="quick-capture-title">记下此刻</h1>

      <div className="markdown-editor-wrapper">
        <SimpleMDE
          value={content}
          onChange={(value) => setContent(value)}
          options={mdeOptions}
        />
      </div>

      <div className="quick-capture-actions">
        <Button icon={<CameraOutlined />} onClick={() => cameraInputRef.current?.click()}>
          拍照
        </Button>
        <Button icon={<PictureOutlined />} onClick={() => galleryInputRef.current?.click()}>
          从相册选
        </Button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {previews.length > 0 && (
        <div className="quick-capture-previews">
          {previews.map((p, i) => (
            <div key={`${p.name}-${i}`} className="quick-capture-preview">
              <img src={p.url} alt={p.name} />
              <span className="quick-capture-remove" onClick={() => removeFile(i)}>
                ×
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="quick-capture-footer">
        <Button
          type="primary"
          className="quick-capture-save"
          loading={saving}
          onClick={handleSave}
        >
          保存
        </Button>
        <Button className="quick-capture-enter" onClick={() => router.push("/timeline")}>
          进入 timeline
        </Button>
      </div>

      {saving && (
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <Spin size="small" />
        </div>
      )}
    </div>
  );
};

export default QuickCapture;
```

- [ ] **Step 2: 新建 `components/home/QuickCapture.scss`**

```scss
.quick-capture {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;

  &-title {
    font-size: 22px;
    font-weight: 600;
    text-align: center;
    margin: 8px 0 16px;
  }

  .markdown-editor-wrapper {
    margin-bottom: 12px;
  }

  &-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  &-previews {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  &-preview {
    position: relative;
    width: 72px;
    height: 72px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 6px;
    }
  }

  &-remove {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    line-height: 18px;
    text-align: center;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    border-radius: 50%;
    cursor: pointer;
    font-size: 14px;
  }

  &-footer {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
  }

  &-save {
    background-color: #1f2430;
    border-color: #1f2430;
  }

  &-enter {
    width: 100%;
  }
}
```

- [ ] **Step 3: 更新 `app/page.js` 引用真实组件**

将 `app/page.js` 中移动端分支替换为：

```js
import { headers } from "next/headers";
import { isMobile } from "@/lib/device";
import QuickCapture from "@/components/home/QuickCapture";

export default function Home() {
  const headersList = headers();
  const userAgent = headersList.get("user-agent") || "";

  if (isMobile(userAgent)) {
    return <QuickCapture />;
  }

  return (
    <div className='p-3 text-green-800 hover:text-green-300 text-sm'>
      the server is running...
    </div>
  );
}
```

- [ ] **Step 4: 验证编译**

Run: `pnpm build`
Expected: 构建成功。

- [ ] **Step 5: 手动验证（dev）**

Run: `pnpm dev`
1. 用浏览器 DevTools 手机模拟（或真机）访问 `http://localhost:3000/` → 看到录入页（标题「记下此刻」+ 编辑器 + 拍照/相册 + 保存 + 进入 timeline）。
2. 用普通桌面 UA 访问 `/` → 仍显示 `the server is running...`。
Expected: 两者符合。dev 下 middleware 放行，保存应直接成功（写入数据库）。

- [ ] **Step 6: Commit**

```bash
git add components/home/QuickCapture.jsx components/home/QuickCapture.scss app/page.js
git commit -m "feat: 移动端首页快速录入组件"
```

---

### Task 6: `/timeline` 挂载时自动保存暂存草稿

**Files:**
- Modify: `app/timeline/page.jsx`（新增 useEffect + import）

**Interfaces:**
- Consumes: `getDraft`、`clearDraft`（Task 3）、`submitTimeline`（Task 4）。

- [ ] **Step 1: 新增 import（`app/timeline/page.jsx` 顶部）**

在 `import { splitDate, PAGE_SIZE } from "@/utils";` 之后新增：

```js
import { getDraft, clearDraft } from "@/lib/draftStore";
import { submitTimeline } from "@/lib/timelineSubmit";
```

- [ ] **Step 2: 新增自动保存 useEffect（放在第 92 行的初始化 `useEffect` 之后）**

```js
  // 挂载时检测并自动保存暂存草稿（移动端首页无 cookie 时暂存的内容）
  useEffect(() => {
    (async () => {
      try {
        const draft = await getDraft();
        if (!draft) return;
        await submitTimeline({
          content: draft.content,
          files: draft.files || [],
          geo: {},
          weather: {},
        });
        await clearDraft();
        message.success("已自动保存暂存的内容");
        setLastId(null);
        setHasMore(true);
        loadTimeLineData(selectedYear, null, false);
      } catch (error) {
        console.error("自动保存草稿失败:", error);
        message.error("暂存内容保存失败，请重试");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

- [ ] **Step 3: 验证编译**

Run: `pnpm build`
Expected: 构建成功。

- [ ] **Step 4: Commit**

```bash
git add app/timeline/page.jsx
git commit -m "feat: timeline 挂载时自动保存暂存草稿"
```

---

### Task 7: 生产模式端到端验证

**Files:** 无（仅验证）

- [ ] **Step 1: 生产模式构建并启动**

```bash
pnpm build && pnpm start
```

- [ ] **Step 2: 验证认证门控与暂存链路**

1. 移动端模拟访问 `/` → 录入页正常显示。
2. 清除 `CF_Authorization` cookie（DevTools → Application → Cookies）后点「保存」→ 提示「请先点底部进入 timeline 完成验证，内容已暂存」，且不写入数据库。
3. 点「进入 timeline」→ 触发 Cloudflare 验证（或模拟：手动种入有效 cookie）→ 落到 `/timeline` → 页面自动提示「已自动保存暂存的内容」，数据库出现该条目。
4. 已有 cookie 时点「保存」→ 直接成功。

Expected: 全部符合。注意：真实 Cloudflare Access 验证需部署环境或前置代理；本地无 Cloudflare 时，第 3 步用「手动种入一个未过期 `CF_Authorization` cookie」模拟已登录态。

- [ ] **Step 3: 全量自查**

```bash
git status && git diff --stat
```

Expected: 改动仅限计划内文件，无 `.env`、无意外文件。

- [ ] **Step 4: Commit（如有遗漏的收尾改动）**

```bash
git add -A
git commit -m "chore: 移动端快速录入页收尾"
```

---

## Self-Review 记录

- **Spec 覆盖**：设备区分（Task 2）、录入（Task 5）、拍照+相册（Task 5）、定位天气（Task 5）、保存时机 cookie 门控（Task 4/5/7）、暂存+验证后自动保存（Task 3/6）、共享保存层（Task 1）、PC 占位不动（Task 2）、middleware 不改（全程未触碰）。
- **占位符扫描**：无 TBD/TODO。
- **类型一致性**：`submitTimeline({ content, files, geo, weather })` 在 Task 4 定义、Task 5/6 调用一致；`insertTimeLine` 在 Task 1 定义、Task 1 路由与 Server Action 调用一致；`getDraft/clearDraft` Task 3 定义、Task 6 调用一致。
- **已知取舍**：暂存的草稿只含文字+照片，不含定位/天气（定位天气需签名接口，无 cookie 时失败），自动保存时 geo/weather 为空——符合设计。
