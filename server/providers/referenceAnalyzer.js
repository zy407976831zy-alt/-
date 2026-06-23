const fs = require("fs");
const https = require("https");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const ENV_PATH = path.join(ROOT, ".env");

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = value;
  }
}

function requestOpenAI(payload) {
  const body = Buffer.from(JSON.stringify(payload), "utf-8");
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.openai.com",
        path: "/v1/responses",
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": body.length,
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf-8");
          let data;
          try {
            data = JSON.parse(raw);
          } catch {
            data = { raw };
          }
          resolve({ statusCode: res.statusCode, data });
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function extractText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const texts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) texts.push(content.text);
      if (content.type === "text" && content.text) texts.push(content.text);
    }
  }
  return texts.join("\n").trim();
}

function parseStyle(text) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  return {
    name: parsed.name || "参考图视觉分析结果",
    overall: parsed.overall || "",
    scene: parsed.scene || "",
    pose: parsed.pose || "",
    wardrobe: parsed.wardrobe || "",
    lighting: parsed.lighting || "",
    color: parsed.color || "",
    camera: parsed.camera || "",
    keywords: parsed.keywords || "",
  };
}

function friendlyOpenAIError(data, fallback) {
  const error = data?.error || {};
  if (error.type === "insufficient_quota" || error.code === "insufficient_quota") {
    return "OpenAI API 额度不足或当前项目账单不可用。请检查平台余额、项目预算限制和模型权限后再分析参考图。";
  }
  if (error.type === "invalid_api_key" || error.code === "invalid_api_key") {
    return "OpenAI API Key 无效。请重新保存正确的 API Key 后再试。";
  }
  if (error.type === "rate_limit_exceeded" || error.code === "rate_limit_exceeded") {
    return "OpenAI API 当前请求过快或达到速率限制，请稍等一会儿再试。";
  }
  return error.message || fallback;
}

async function analyzeReference({ analysisPrompt, referenceImage }) {
  loadEnv();
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini";

  if (!apiKey || apiKey.includes("把你的")) {
    return {
      status: "not_connected",
      message: "OPENAI_API_KEY 未配置，无法进行真实参考图分析。",
      style: null,
      warnings: ["缺少 API Key。"],
    };
  }

  if (!referenceImage?.content?.length) {
    return {
      status: "missing_input",
      message: "请先上传参考图，再点击分析参考图。",
      style: null,
      warnings: ["缺少参考图。"],
    };
  }

  const imageBase64 = referenceImage.content.toString("base64");
  const mimeType = referenceImage.mimetype || "image/jpeg";
  const instruction = `${analysisPrompt || ""}

请只分析当前上传的参考图，不要套用固定模板，也不要沿用旧图内容。
输出必须是一个合法 JSON 对象，不要 Markdown，不要代码块，不要额外解释。
JSON 字段必须包含：
name, overall, scene, pose, wardrobe, lighting, color, camera, keywords。

分析重点：
1. overall：整体商业风格、情绪、真实摄影质感。
2. scene：场景空间、背景元素、家具/道具/材质、空间层次。
3. pose：动作、表情、身体线条、手部位置，以及可迁移到客户原片的程度。必须说明动作是否服务于头纱、裙摆、花束、道具或某个视觉重点。
4. wardrobe：参考图服装的廓形、颜色、材质、袖型、领口、头纱/饰品、裙摆、褶皱、遮挡关系。必须写具体，方便后续按服装参考生成。如果头纱是画面重点，必须写清楚头纱类型、面积、位置、透明度、垂坠/飘动方向、和人物动作的关系。
5. lighting：必须准确判断光源类型和布光方式。写清楚是大面积柔光、窗光、柔光箱、包裹光、反射光，还是硬闪光、直射光、聚光灯。必须描述主光方向、光源面积、阴影边缘软硬、鼻影/颈部阴影、面部高光面积、眼神光、环境光、补光、接触阴影和反差。不能把柔光参考图分析成硬光。
6. color：必须准确分析色调，并按调色师语言写具体。必须包含：整体冷暖倾向、白平衡、肤色明度与偏色、高光颜色与高光滚降、白纱/白色物体层次、中间调密度、暗部黑位与暗部颜色、背景灰阶、黑白关系、饱和度、局部对比度、整体对比度、胶片感、是否偏青/偏黄/偏粉/偏灰、后期调色强度。必须判断这张图是“相机直出感”还是“已完成商业调色”，并说明如何还原。避免只写“高级、干净”这种泛词。
7. camera：必须用摄影指导语言具体分析镜头语言。必须包含画幅方向、景别、相机高度、拍摄距离、焦段感或等效焦距估计、透视压缩程度、背景虚化和景深、人物占画面比例、头顶/脚边/左右留白、裁切边界、视觉重心、前景/中景/背景层次、空间纵深、是否有倾斜构图或俯仰角。不能只写“50mm/85mm、人像镜头、浅景深”。
8. keywords：英文质感关键词。

视觉重点：
必须在 overall、pose 或 wardrobe 中明确写出参考图最抢眼的视觉重点是什么，例如大面积头纱、飞纱、垂落头纱、花束、裙摆、手部动作、特殊构图或道具。不能只写“高级婚纱照”。如果头纱是重点，后续生成必须优先保留头纱。

安全边界：
参考图人物的脸、身份、年龄感、五官不能迁移到客户身上。

商业修图边界：
必须把参考图的皮肤处理方式说具体：是否保留毛孔、是否有轻微磨皮、Dodge & Burn 明暗塑形强度、面部高光、眼周处理、颈部和手臂肤色统一、妆面干净度。`;

  const response = await requestOpenAI({
    model,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: instruction },
          {
            type: "input_image",
            image_url: `data:${mimeType};base64,${imageBase64}`,
          },
        ],
      },
    ],
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    return {
      status: "failed",
      message: friendlyOpenAIError(response.data, "参考图视觉分析失败。"),
      style: null,
      warnings: [
        response.data?.error?.type ||
          response.data?.error?.code ||
          `HTTP ${response.statusCode}`,
      ],
    };
  }

  const text = extractText(response.data);
  try {
    return {
      status: "completed",
      message: "参考图分析完成。",
      style: parseStyle(text),
      model,
      warnings: [],
    };
  } catch (error) {
    return {
      status: "failed",
      message: "参考图分析结果不是合法 JSON，请重试。",
      style: null,
      model,
      warnings: [error.message, text.slice(0, 200)],
    };
  }
}

module.exports = {
  analyzeReference,
};
