const fs = require("fs");
const https = require("https");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const ENV_PATH = path.join(ROOT, ".env");
const JOBS_DIR = path.join(ROOT, "work", "jobs");

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

function safeName(value) {
  return String(value || "unknown")
    .trim()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function jobDirFor(payload) {
  return path.join(JOBS_DIR, `${safeName(payload.clientId)}_${safeName(payload.jobId)}`);
}

function imageDataUrl(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
  return `data:${mimeType};base64,${fs.readFileSync(filePath).toString("base64")}`;
}

function readJobRecord(jobDir) {
  const recordPath = path.join(jobDir, "job.json");
  if (!fs.existsSync(recordPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(recordPath, "utf-8"));
  } catch {
    return {};
  }
}

function findOriginalImage(jobDir, record = {}) {
  const recordedPath = record.uploads?.personImagePath;
  if (recordedPath && fs.existsSync(recordedPath)) return recordedPath;

  if (!fs.existsSync(jobDir)) return null;
  const candidates = fs
    .readdirSync(jobDir)
    .map((name) => ({ name, filePath: path.join(jobDir, name) }))
    .filter(({ name }) => /\.(png|jpe?g|webp)$/i.test(name))
    .filter(({ name }) => !/^result\./i.test(name))
    .filter(({ name }) => !/^input_normalized\./i.test(name))
    .filter(({ name }) => !/^截屏/i.test(name))
    .map(({ filePath }) => filePath)
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return candidates[0] || null;
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

function parseJson(text) {
  return JSON.parse(
    text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim()
  );
}

function fallbackResult(message) {
  return {
    status: "strict_manual_review_required",
    score: null,
    summary: message,
    findings: [
      {
        level: "high",
        item: "严格质检",
        message,
      },
    ],
    nextAction: "严格人工质检",
  };
}

async function checkQuality(payload = {}) {
  loadEnv();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes("把你的")) {
    return fallbackResult("OPENAI_API_KEY 未配置，无法进行视觉质检。");
  }

  const jobDir = jobDirFor(payload);
  const record = readJobRecord(jobDir);
  const resultPath = path.join(jobDir, "result.png");
  if (!fs.existsSync(resultPath)) {
    return fallbackResult("没有找到生成结果图，不能进行视觉质检。");
  }

  const originalPath = findOriginalImage(jobDir, record);
  const content = [
    {
      type: "input_text",
      text: `你是高端婚纱写真交付质检师。请严格检查生成图是否可以给客户看。

输出必须是合法 JSON，不要 Markdown，不要额外解释。字段：
status: pass | rework | reject
score: 0-100
summary: 中文总结
findings: 数组，每项包含 level(high|medium|low), item, message
nextAction: 通过 | 需返工 | 废片

质检红线：
1. 手部、手指、手腕、手掌结构必须自然。多指、少指、断指、手腕扭曲、手指粘连、手掌比例怪、手和门/身体遮挡关系不对，必须 rework；严重时 reject。
2. 脸和身份必须达到至少 95% 以上本人相似度。若低于 95% 或可疑，至少 rework；明显不像本人必须 reject。
   必须逐项对比客户原片的脸型、眼型、眼距、眉眼关系、鼻型、人中、嘴唇、嘴角、脸宽脸长、下颌线、颧骨、太阳穴、痣点、年龄感和真实气质；如果生成成参考图模特脸、AI美女模板脸或陌生人，必须 reject。
3. 皮肤必须有商业精修但保留毛孔，不可塑料、蜡像、过磨。
4. 光影、色温、阴影、人物和背景必须统一，不能贴图感。
5. 人体比例、头身比例、肩颈、手臂、腿部不能失真。
6. 如果任务要求参考图重点，例如头纱、裙摆、花束、特殊动作，缺失则 rework。
7. 如果提示词或参考图分析要求全身构图，生成结果必须完整显示脚、鞋或脚尖，以及脚下地面/接触阴影；裁掉脚、只到小腿、只到膝盖或变成半身，必须 rework。
   脚部结构必须真实：左右脚关系、脚踝、脚背、鞋尖、脚掌方向、腿部连接、落地点、接触阴影和遮挡关系必须清楚自然。左右脚混乱、脚尖方向不明、鞋脚脱节、像两只左脚或两只右脚，都必须 rework；严重时 reject。
8. 如果发型参考为参考风格或匹配参考，必须检查发型分缝、盘发/披发、头纱固定点、脸侧碎发和整体轮廓是否明显接近参考图；发型明显不对必须 rework。
9. 画面不能像相机直出，必须有商业后期层次。

请特别仔细检查：脸部是否达到 95% 以上本人相似度、手部结构、脚部左右关系和完整性、发型匹配。这次宁可严格，不要放水。`
    },
  ];

  if (originalPath) {
    content.push({ type: "input_text", text: "下面是客户原片，用于身份和身体比例参考。" });
    content.push({ type: "input_image", image_url: imageDataUrl(originalPath) });
  }
  content.push({ type: "input_text", text: "下面是生成结果图，请严格质检。" });
  content.push({ type: "input_image", image_url: imageDataUrl(resultPath) });

  const response = await requestOpenAI({
    model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
    input: [{ role: "user", content }],
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    return fallbackResult(response.data?.error?.message || "视觉质检接口调用失败。");
  }

  try {
    const parsed = parseJson(extractText(response.data));
    return {
      status: parsed.status || "rework",
      score: Number.isFinite(parsed.score) ? parsed.score : null,
      summary: parsed.summary || "视觉质检完成。",
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      nextAction: parsed.nextAction || (parsed.status === "pass" ? "通过" : "需返工"),
    };
  } catch (error) {
    return fallbackResult(`视觉质检返回格式异常：${error.message}`);
  }
}

module.exports = {
  checkQuality,
};
