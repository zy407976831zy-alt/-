# 游离现实影像生产台云端部署说明

## 推荐先用 Render 部署

这个项目是一个 Node.js Web 服务，前端和后端在同一个服务里，适合先部署成一个 Web Service。

## 必须准备

1. OpenAI API Key
2. 一个 GitHub 仓库
3. 一个云平台账号，例如 Render、Railway、Fly.io 或阿里云/腾讯云服务器

## Render 部署参数

- Service Type：Web Service
- Environment：Node
- Build Command：`npm install`
- Start Command：`npm start`
- Health Check Path：`/api/health`

## 环境变量

在云平台后台添加：

```text
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_VISION_MODEL=gpt-4.1-mini
PORT=3000
```

不要把 `.env` 文件上传到 GitHub，也不要把 API Key 发给员工。

## 重要提醒

当前版本会把生成结果临时保存到服务器本地 `work/jobs`。如果云平台重启或重新部署，本地文件可能丢失。

正式给员工长期使用前，建议下一步接入对象存储，例如 Cloudflare R2、AWS S3、阿里云 OSS 或腾讯云 COS，用来长期保存客户原片、参考图和成片。

## 部署后员工怎么用

部署完成后，云平台会给你一个公网网址，例如：

```text
https://your-app.onrender.com
```

员工以后直接打开这个网址即可，不需要你的电脑开机，也不需要 Codex 在线。
