# Image 2.0 接口契约草案

## 目标

网页最终在一个界面完成：

1. 上传客户原片和参考图。
2. 选择风格包和中文选项。
3. 调用 Image 2.0 或其他稳定出图 API。
4. 返回生成图。
5. 助手质检。
6. 标记通过、返工或废片。

当前前端已经预留接口，但没有真实后端。

## 生成图片接口

路径：

`POST /api/generate-image`

请求格式：

`multipart/form-data`

字段：

- `clientId`：客户编号
- `jobId`：任务编号
- `stylePreset`：风格包
- `hairOption`：发型参考
- `wardrobeOption`：服装参考
- `poseOption`：动作表情
- `variants`：生成张数
- `prompt`：完整生成提示词
- `personImage`：客户原片
- `referenceImage`：参考图，可选。两阶段正式生成时可只作为记录，不直接传给模型。

建议后端执行：

1. 保存上传文件。
2. 根据出图平台要求决定是否传参考图。
3. 调用 Image 2.0 / 图像 API。
4. 保存结果图。
5. 返回结果 URL。

响应：

```json
{
  "jobId": "001",
  "status": "completed",
  "imageUrl": "/outputs/generated/001_client_20260615_v01.png",
  "provider": "image2.0",
  "model": "image2.0",
  "warnings": []
}
```

## 助手质检接口

路径：

`POST /api/quality-check`

请求格式：

`application/json`

字段：

- `jobId`
- `clientId`
- `originalImageUrl`
- `generatedImageUrl`
- `prompt`
- `options`

建议质检项：

- 脸是否像本人
- 发型是否越权
- 服装是否越权
- 动作表情是否符合选项
- 皮肤是否保留毛孔
- 是否贴图感
- 光影是否统一
- 手脚和婚纱是否畸形
- 是否适合给客户看

响应：

```json
{
  "status": "rework",
  "score": 72,
  "summary": "整体风格可用，但脸部相似度和发型需要复核。",
  "findings": [
    {
      "level": "high",
      "item": "身份一致性",
      "message": "眼睛和脸型疑似发生变化，建议原脸回贴。"
    }
  ],
  "nextAction": "返工"
}
```

## 任务状态

建议状态：

- `待处理`
- `生成中`
- `待质检`
- `需返工`
- `已通过`
- `废片`

## 后续后端建议

第一阶段可以用本地 Node/Express 或 Python/FastAPI。

最小后端只需要：

- 静态托管 `web/`
- 接收上传文件
- 调用外部图像 API
- 保存结果
- 返回图片地址

## 参考图分析接口

路径：

`POST /api/analyze-reference`

请求格式：

`multipart/form-data`

字段：

- `referenceImage`：员工上传的参考图
- `analysisPrompt`：分析要求

核心要求：

后端接入真实视觉模型后，不能返回固定模板。必须让模型根据当前参考图本身独立分析：

- 整体风格
- 场景空间
- 人物动作和表情
- 服装造型
- 光影方向和光质
- 色彩和后期
- 镜头语言
- 真实摄影质感
- 反向提示词风险

响应：

```json
{
  "status": "completed",
  "style": {
    "name": "根据参考图生成的风格名称",
    "overall": "整体风格分析",
    "scene": "场景转换分析",
    "pose": "人物姿态分析",
    "wardrobe": "服装造型分析",
    "lighting": "光影要求分析",
    "color": "色彩风格分析",
    "camera": "镜头语言分析",
    "keywords": "质感关键词"
  }
}
```
