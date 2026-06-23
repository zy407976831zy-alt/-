const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const JOBS_DIR = path.join(ROOT, "work", "jobs");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeName(value) {
  return String(value || "unknown")
    .trim()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getJobDir({ clientId, jobId }) {
  const dirName = `${safeName(clientId)}_${safeName(jobId)}`;
  return path.join(JOBS_DIR, dirName);
}

function saveJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function saveFile(jobDir, file) {
  if (!file || !file.content?.length) return null;
  ensureDir(jobDir);
  const filename = safeName(file.filename || file.fieldName || "upload");
  const ext = path.extname(file.filename || "") || ".bin";
  const basename = path.basename(filename, path.extname(filename));
  const filePath = path.join(jobDir, `${basename}${ext}`);
  fs.writeFileSync(filePath, file.content);
  return filePath;
}

function createJobRecord(payload) {
  const jobDir = getJobDir(payload);
  ensureDir(jobDir);

  const record = {
    clientId: payload.clientId || "unknown_client",
    jobId: payload.jobId || "unknown_job",
    status: payload.status || "待处理",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: payload.options || {},
    prompt: payload.prompt || "",
    provider: payload.provider || null,
    result: payload.result || null,
    qa: payload.qa || null,
  };

  saveJson(path.join(jobDir, "job.json"), record);
  if (record.prompt) {
    fs.writeFileSync(path.join(jobDir, "prompt.md"), record.prompt, "utf-8");
  }

  return { jobDir, record };
}

function updateJobRecord(payload, patch) {
  const jobDir = getJobDir(payload);
  ensureDir(jobDir);
  const recordPath = path.join(jobDir, "job.json");
  let record = {};

  if (fs.existsSync(recordPath)) {
    record = JSON.parse(fs.readFileSync(recordPath, "utf-8"));
  }

  const updated = {
    ...record,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  saveJson(recordPath, updated);
  return { jobDir, record: updated };
}

module.exports = {
  createJobRecord,
  getJobDir,
  saveFile,
  updateJobRecord,
};
