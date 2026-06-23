const http = require("http");
const fs = require("fs");
const path = require("path");

const { generateImage } = require("./providers/imageGenerator");
const { analyzeReference } = require("./providers/referenceAnalyzer");
const { checkQuality } = require("./providers/qualityChecker");
const { createJobRecord, getJobDir, saveFile, updateJobRecord } = require("./storage/jobs");

const ROOT = path.join(__dirname, "..");
const WEB_DIR = path.join(ROOT, "web");
const JOBS_DIR = path.join(ROOT, "work", "jobs");
const PORT = Number(process.env.PORT || 3000);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { error: "文件不存在" });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/jobs/")) {
    const jobPath = path
      .normalize(decodeURIComponent(url.pathname.replace(/^\/jobs\//, "")))
      .replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(JOBS_DIR, jobPath);
    if (!filePath.startsWith(JOBS_DIR)) {
      sendJson(res, 403, { error: "非法路径" });
      return;
    }
    sendFile(res, filePath);
    return;
  }

  const safePath = path
    .normalize(decodeURIComponent(url.pathname))
    .replace(/^(\.\.[/\\])+/, "");
  const relativePath = safePath === "/" ? "/index.html" : safePath;
  const filePath = path.join(WEB_DIR, relativePath);

  if (!filePath.startsWith(WEB_DIR)) {
    sendJson(res, 403, { error: "非法路径" });
    return;
  }

  sendFile(res, filePath);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function extractMultipartText(bodyBuffer) {
  const body = bodyBuffer.toString("utf-8");
  const getField = (name) => {
    const match = body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([\\s\\S]*?)\\r\\n--`));
    return match ? match[1].trim() : "";
  };

  return {
    clientId: getField("clientId"),
    jobId: getField("jobId"),
    prompt: getField("prompt"),
    stylePreset: getField("stylePreset"),
    processMode: getField("processMode"),
    identityMode: getField("identityMode"),
    hairOption: getField("hairOption"),
    backgroundOption: getField("backgroundOption"),
    wardrobeOption: getField("wardrobeOption"),
    poseOption: getField("poseOption"),
    variants: getField("variants"),
    aspectRatio: getField("aspectRatio"),
    bodyRetouchOption: getField("bodyRetouchOption"),
    sourceCorrectionOption: getField("sourceCorrectionOption"),
    retouchOption: getField("retouchOption"),
    colorGradeOption: getField("colorGradeOption"),
    referenceFocus: getField("referenceFocus"),
    analysisPrompt: getField("analysisPrompt"),
  };
}

function parseMultipart(req, bodyBuffer) {
  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    return { fields: {}, files: {} };
  }

  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const parts = [];
  let start = bodyBuffer.indexOf(boundary);

  while (start !== -1) {
    start += boundary.length;
    if (bodyBuffer[start] === 45 && bodyBuffer[start + 1] === 45) break;
    if (bodyBuffer[start] === 13 && bodyBuffer[start + 1] === 10) start += 2;
    const end = bodyBuffer.indexOf(boundary, start);
    if (end === -1) break;
    let part = bodyBuffer.subarray(start, end);
    if (part.at(-2) === 13 && part.at(-1) === 10) part = part.subarray(0, -2);
    parts.push(part);
    start = end;
  }

  const fields = {};
  const files = {};

  for (const part of parts) {
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd === -1) continue;

    const header = part.subarray(0, headerEnd).toString("utf-8");
    const content = part.subarray(headerEnd + 4);
    const name = header.match(/name="([^"]+)"/)?.[1];
    if (!name) continue;

    const filename = header.match(/filename="([^"]*)"/)?.[1];
    const contentTypeMatch = header.match(/Content-Type:\s*([^\r\n]+)/i);

    if (filename) {
      files[name] = {
        fieldName: name,
        filename,
        mimetype: contentTypeMatch?.[1] || "application/octet-stream",
        content,
      };
    } else {
      fields[name] = content.toString("utf-8").trim();
    }
  }

  return { fields, files };
}

async function handleAnalyzeReference(req, res) {
  const body = await readRequestBody(req);
  const { fields, files } = parseMultipart(req, body);
  const result = await analyzeReference({
    analysisPrompt: fields.analysisPrompt,
    referenceImage: files.referenceImage,
  });
  sendJson(res, 200, result);
}

async function handleGenerateImage(req, res) {
  const body = await readRequestBody(req);
  const { fields, files } = parseMultipart(req, body);

  const { jobDir } = createJobRecord({
    clientId: fields.clientId,
    jobId: fields.jobId,
    status: "生成中",
    prompt: fields.prompt,
    options: {
      stylePreset: fields.stylePreset,
      processMode: fields.processMode,
      identityMode: fields.identityMode,
      hairOption: fields.hairOption,
      backgroundOption: fields.backgroundOption,
      wardrobeOption: fields.wardrobeOption,
      poseOption: fields.poseOption,
      variants: fields.variants,
      aspectRatio: fields.aspectRatio,
      bodyRetouchOption: fields.bodyRetouchOption,
      sourceCorrectionOption: fields.sourceCorrectionOption,
      retouchOption: fields.retouchOption,
      colorGradeOption: fields.colorGradeOption,
      referenceFocus: fields.referenceFocus,
    },
  });

  const savedFiles = {
    personImagePath: saveFile(jobDir, files.personImage),
    referenceImagePath: saveFile(jobDir, files.referenceImage),
  };
  updateJobRecord(
    { clientId: fields.clientId, jobId: fields.jobId },
    {
      uploads: savedFiles,
    }
  );

  const result = await generateImage({ fields, files: savedFiles, jobDir });
  updateJobRecord(
    { clientId: fields.clientId, jobId: fields.jobId },
    {
      status: result.imageUrl ? "待质检" : "生成失败",
      result,
    }
  );

  sendJson(res, result.imageUrl ? 200 : 400, result);
}

async function handleQualityCheck(req, res) {
  const body = await readRequestBody(req);
  let payload = {};
  try {
    payload = JSON.parse(body.toString("utf-8") || "{}");
  } catch {
    payload = {};
  }

  const result = await checkQuality(payload);
  if (payload.clientId && payload.jobId) {
    updateJobRecord(
      { clientId: payload.clientId, jobId: payload.jobId },
      {
        status: result.nextAction || "人工复核",
        qa: result,
      }
    );
  }

  sendJson(res, 200, result);
}

async function handleApi(req, res) {
  if (req.method === "GET" && req.url.startsWith("/api/health")) {
    sendJson(res, 200, {
      status: "ok",
      service: "游离现实影像生产台",
      time: new Date().toISOString(),
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "只支持 POST" });
    return;
  }

  if (req.url.startsWith("/api/analyze-reference")) {
    await handleAnalyzeReference(req, res);
    return;
  }

  if (req.url.startsWith("/api/generate-image")) {
    await handleGenerateImage(req, res);
    return;
  }

  if (req.url.startsWith("/api/quality-check")) {
    await handleQualityCheck(req, res);
    return;
  }

  sendJson(res, 404, { error: "接口不存在" });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res).catch((error) => {
      sendJson(res, 500, { error: error.message });
    });
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`婚纱照 AI 生产工作台已启动：http://localhost:${PORT}`);
});
