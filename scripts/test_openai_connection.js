#!/usr/bin/env node

const fs = require("fs");
const https = require("https");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env");

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  const lines = fs.readFileSync(ENV_PATH, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = value;
  }
}

function requestJson({ method, path: requestPath }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.openai.com",
        path: requestPath,
        method,
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
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
    req.end();
  });
}

async function main() {
  loadEnv();

  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

  if (!key || key.includes("把你的")) {
    console.error("OPENAI_API_KEY 未配置。请先在 .env 中填写新的 API Key。");
    process.exit(1);
  }

  console.log("API Key: 已读取");
  console.log(`图像模型: ${model}`);

  const response = await requestJson({
    method: "GET",
    path: `/v1/models/${encodeURIComponent(model)}`,
  });

  if (response.statusCode === 200) {
    console.log("连接测试: 成功");
    console.log(`模型访问: 已确认 ${model}`);
    return;
  }

  console.log("连接测试: 失败");
  console.log(`HTTP 状态: ${response.statusCode}`);
  if (response.data?.error?.message) {
    console.log(`错误信息: ${response.data.error.message}`);
  } else {
    console.log("错误信息: 未返回标准错误。");
  }
  process.exit(1);
}

main().catch((error) => {
  console.error("连接测试: 失败");
  console.error(`错误信息: ${error.message}`);
  process.exit(1);
});
