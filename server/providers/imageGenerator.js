const fs = require("fs");
const https = require("https");
const path = require("path");
const { execFileSync } = require("child_process");

let sharp = null;
try {
  sharp = require("sharp");
} catch {
  sharp = null;
}

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

function appendField(chunks, boundary, name, value) {
  chunks.push(Buffer.from(`--${boundary}\r\n`));
  chunks.push(Buffer.from(`Content-Disposition: form-data; name="${name}"\r\n\r\n`));
  chunks.push(Buffer.from(`${value}\r\n`));
}

function appendFile(chunks, boundary, name, filePath, mimetype) {
  const filename = path.basename(filePath);
  chunks.push(Buffer.from(`--${boundary}\r\n`));
  chunks.push(
    Buffer.from(
      `Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: ${mimetype}\r\n\r\n`
    )
  );
  chunks.push(fs.readFileSync(filePath));
  chunks.push(Buffer.from("\r\n"));
}

function guessMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

async function normalizeImageForOpenAI(inputPath, jobDir) {
  const outputPath = path.join(jobDir, "input_normalized.png");
  if (sharp) {
    try {
      await sharp(inputPath)
        .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
        .png()
        .toFile(outputPath);
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
        return outputPath;
      }
    } catch {
      // Fall back to platform tools or original image.
    }
  }

  try {
    execFileSync(
      "/usr/bin/sips",
      ["-Z", "2048", "-s", "format", "png", inputPath, "--out", outputPath],
      { stdio: "ignore" }
    );
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      return outputPath;
    }
  } catch {
    return inputPath;
  }
  return inputPath;
}

async function convertPngToHighQualityJpeg(inputPath, jobDir) {
  const outputPath = path.join(jobDir, "result.jpg");
  if (sharp) {
    try {
      await sharp(inputPath).jpeg({ quality: 100, chromaSubsampling: "4:4:4" }).toFile(outputPath);
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
        return outputPath;
      }
    } catch {
      // Fall back to platform tools.
    }
  }

  try {
    execFileSync(
      "/usr/bin/sips",
      ["-s", "format", "jpeg", "-s", "formatOptions", "100", inputPath, "--out", outputPath],
      { stdio: "ignore" }
    );
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      return outputPath;
    }
  } catch {
    return null;
  }
  return null;
}

function requestOpenAI({ body, boundary }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.openai.com",
        path: "/v1/images/edits",
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
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

function getAspectSpec(size) {
  const specs = {
    "1536x1024": {
      apiSize: "1536x1024",
      finalWidth: 1536,
      finalHeight: 1024,
      label: "横图 3:2",
    },
    "1536x864": {
      apiSize: "1536x1024",
      finalWidth: 1536,
      finalHeight: 864,
      label: "横屏满屏 16:9",
    },
    "1536x658": {
      apiSize: "1536x1024",
      finalWidth: 1536,
      finalHeight: 658,
      label: "电影宽银幕 21:9",
    },
    "1024x1536": {
      apiSize: "1024x1536",
      finalWidth: 1024,
      finalHeight: 1536,
      label: "竖图 2:3",
    },
    "864x1536": {
      apiSize: "1024x1536",
      finalWidth: 864,
      finalHeight: 1536,
      label: "竖屏满屏 9:16",
    },
    "1024x1024": {
      apiSize: "1024x1024",
      finalWidth: 1024,
      finalHeight: 1024,
      label: "方图 1:1",
    },
  };
  return specs[size] || specs["1536x1024"];
}

function normalizeOutputSize(size) {
  return getAspectSpec(size).apiSize;
}

async function applyFinalAspectRatio(inputPath, jobDir, aspectRatio) {
  const spec = getAspectSpec(aspectRatio);
  if (!sharp) return inputPath;

  const outputPath = path.join(jobDir, "result_final.png");
  try {
    await sharp(inputPath)
      .resize(spec.finalWidth, spec.finalHeight, { fit: "cover", position: "center" })
      .png()
      .toFile(outputPath);
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      fs.copyFileSync(outputPath, inputPath);
      return inputPath;
    }
  } catch {
    return inputPath;
  }
  return inputPath;
}

function shouldAttachReferenceImage(fields) {
  return (
    fields.processMode === "只精修原片" ||
    fields.hairOption === "匹配参考" ||
    fields.wardrobeOption === "匹配参考" ||
    fields.poseOption === "重新设计"
  );
}

function getGenerationPrompt(fields) {
  if (fields.processMode !== "只精修原片") return fields.prompt || "";
  return `这是“只精修原片”任务，不是重新生成写真。

必须以第一张客户原片为唯一主体和构图依据。第二张参考图只用于参考修图方式、皮肤质感、光影层次和色彩后期，不允许迁移参考图人物、动作、服装、发型、场景和构图。

硬性要求：
1. 客户原片的人脸、五官、脸型、表情、眼神方向、手部、动作、服装、背景和构图必须保持。
2. 必须完成可见的商业精修，不能几乎无变化，不能只是轻微滤镜，不能只修皮肤。成片必须比原片更通透、更干净、更有光影层次、更有高级调色。
3. 皮肤必须采用中性灰修图 / Dodge & Burn 逻辑，保留毛孔、高频纹理、中频肤色过渡、低频明暗体积和骨相光影；禁止一键磨皮、全局模糊、塑料皮、蜡像皮。皮肤要干净但不能平，脸部必须有鼻梁、颧骨、下颌、眼周、嘴角、颈部的真实明暗结构。
4. 光影必须重塑到商业成片标准：提升面部、肩颈、锁骨、手臂、腰线、婚纱褶皱、花束和背景的明暗层次；高光要通透但不能死白，暗部要有黑位但不能糊死，中间调要有肤色密度和面料细节。整体必须有空气感、柔和光感和高级灰阶，不允许平、闷、灰、脏。
5. 身形必须自然商业优化，修正拍摄造成的臃肿、肩颈厚重、手臂粗壮、腰线不清、头身比例轻微失衡、服装压身、裙摆臃肿等问题。优化目标是更上镜、更利落、更舒展，但不能改变本人身份、动作和真实身材特征，不能瘦成另一个人。
6. 色调必须强匹配第二张参考图的冷暖、白平衡、肤色、高光滚降、中间调密度、暗部黑位、背景灰阶、饱和度、整体对比度和胶片感。不能保持原片直出色，不能只自然校色。必须有 Lightroom/Capture One 级别的整体调色和局部色彩统一。
7. 婚纱和服装必须精修：白纱不能死白，必须有布料纹理、褶皱层次、高光滚降和干净边缘；黑西装要有黑位和面料层次，不能一片死黑；花束颜色要统一到整体调色里。
8. 最终必须像专业修图师在原片上完成 Photoshop/Capture One 商业精修后的成片，而不是 AI 重新生成的人像。输出应明显达到可交付客片标准：通透、立体、肤质真实、身形自然优化、色调高级、光影有层次。

原始完整任务说明如下，用于补充细节，但不得覆盖以上硬性要求：

${fields.prompt || ""}`;
}

async function buildImageRequestBody({ fields, files, jobDir, includeReferenceImage }) {
  const boundary = `----wedding-ai-${Date.now().toString(16)}-${includeReferenceImage ? "ref" : "single"}`;
  const chunks = [];
  appendField(chunks, boundary, "model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-2");
  appendField(chunks, boundary, "prompt", getGenerationPrompt(fields));
  appendField(chunks, boundary, "size", normalizeOutputSize(fields.aspectRatio));
  appendField(chunks, boundary, "quality", "high");
  appendField(chunks, boundary, "output_format", "png");
  const normalizedImagePath = await normalizeImageForOpenAI(files.personImagePath, jobDir);
  appendFile(chunks, boundary, "image", normalizedImagePath, guessMime(normalizedImagePath));
  if (includeReferenceImage && files.referenceImagePath) {
    appendFile(chunks, boundary, "image", files.referenceImagePath, guessMime(files.referenceImagePath));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { boundary, body: Buffer.concat(chunks) };
}

async function generateImage({ fields, files, jobDir }) {
  loadEnv();
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

  if (!apiKey || apiKey.includes("把你的")) {
    return {
      status: "not_connected",
      message: "OPENAI_API_KEY 未配置。请先在 .env 中填写 API Key。",
      imageUrl: null,
      provider: "openai",
      model,
      warnings: ["缺少 API Key。"],
    };
  }

  if (!files?.personImagePath) {
    return {
      status: "missing_input",
      message: "请先上传客户原片。",
      imageUrl: null,
      provider: "openai",
      model,
      warnings: ["缺少客户原片。"],
    };
  }

  const includeReferenceImage = shouldAttachReferenceImage(fields) && Boolean(files.referenceImagePath);
  const firstRequest = await buildImageRequestBody({ fields, files, jobDir, includeReferenceImage });
  let response = await requestOpenAI(firstRequest);
  const warnings = [];

  if ((response.statusCode < 200 || response.statusCode >= 300) && includeReferenceImage) {
    warnings.push("参考图作为额外视觉输入失败，已自动退回单原图生成。");
    const fallbackRequest = await buildImageRequestBody({ fields, files, jobDir, includeReferenceImage: false });
    response = await requestOpenAI(fallbackRequest);
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    return {
      status: "failed",
      message: response.data?.error?.message || "OpenAI 图像接口调用失败。",
      imageUrl: null,
      provider: "openai",
      model,
      warnings: [response.data?.error?.type || `HTTP ${response.statusCode}`, ...warnings],
    };
  }

  const b64 = response.data?.data?.[0]?.b64_json;
  if (!b64) {
    return {
      status: "failed",
      message: "OpenAI 未返回图片数据。",
      imageUrl: null,
      provider: "openai",
      model,
      warnings: ["missing b64_json"],
    };
  }

  const outputPath = path.join(jobDir, "result.png");
  fs.writeFileSync(outputPath, Buffer.from(b64, "base64"));
  await applyFinalAspectRatio(outputPath, jobDir, fields.aspectRatio);
  const jpegPath = await convertPngToHighQualityJpeg(outputPath, jobDir);
  const aspectSpec = getAspectSpec(fields.aspectRatio);

  const jobFolder = path.basename(jobDir);
  return {
    status: "completed",
    message: "生成完成。",
    imageUrl: `/jobs/${jobFolder}/result.png`,
    jpgUrl: jpegPath ? `/jobs/${jobFolder}/result.jpg` : null,
    provider: "openai",
    model,
    outputSize: `${aspectSpec.finalWidth}x${aspectSpec.finalHeight}`,
    aspectRatioLabel: aspectSpec.label,
    warnings: jpegPath ? warnings : [...warnings, "JPG 转换失败，当前仅返回 PNG。"],
  };
}

module.exports = {
  generateImage,
};
