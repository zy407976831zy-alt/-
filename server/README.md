# 后端 API 骨架

## 当前结构

- `server/index.js`：HTTP 服务、静态网页、API 路由
- `server/providers/referenceAnalyzer.js`：参考图分析适配器
- `server/providers/imageGenerator.js`：图像生成适配器
- `server/providers/qualityChecker.js`：助手质检适配器
- `server/storage/jobs.js`：任务记录保存
- `server.js`：启动入口

## 已预留接口

### 参考图分析

`POST /api/analyze-reference`

当前返回模拟结构。

未来接入真实视觉模型时，改：

`server/providers/referenceAnalyzer.js`

### 图像生成

`POST /api/generate-image`

当前返回 `not_connected`。

未来接 Image 2.0 时，改：

`server/providers/imageGenerator.js`

### 助手质检

`POST /api/quality-check`

当前返回人工复核建议。

未来接视觉质检模型时，改：

`server/providers/qualityChecker.js`

## 任务保存

调用 `/api/generate-image` 时，会在下面创建任务记录：

`work/jobs/<客户编号>_<任务编号>/`

包含：

- `job.json`
- `prompt.md`

后续接入真实生成后，应继续保存：

- 客户原片
- 参考图
- 生成结果
- 质检结果
- 返工记录

## 启动

```bash
/Users/xiongxiong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server.js
```

访问：

```text
http://localhost:3000/
```
