const fs = require('node:fs');
const path = require('node:path');

const TMP_DOC_INDEX_PATH = path.join('/tmp', 'question-singapore-doc-index.json');
const TMP_FAQ_BASE_PATH = path.join('/tmp', 'question-singapore-faq');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function getRuntimeDocIndexPath() {
  return TMP_DOC_INDEX_PATH;
}

function getRuntimeFaqPath(language, domain) {
  return path.join(TMP_FAQ_BASE_PATH, language, `${domain}.json`);
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function readJsonPreferRuntime(primaryPath, runtimePath, fallback) {
  if (runtimePath && fs.existsSync(runtimePath)) {
    return readJson(runtimePath, fallback);
  }
  return readJson(primaryPath, fallback);
}

function writeJsonWithRuntimeFallback(primaryPath, runtimePath, data) {
  const raw = `${JSON.stringify(data, null, 2)}\n`;

  try {
    if (primaryPath) {
      ensureDir(primaryPath);
      fs.writeFileSync(primaryPath, raw, 'utf8');
      return {
        target: primaryPath,
        runtime: false
      };
    }
  } catch (error) {
    if (!runtimePath) {
      throw error;
    }
  }

  ensureDir(runtimePath);
  fs.writeFileSync(runtimePath, raw, 'utf8');
  return {
    target: runtimePath,
    runtime: true
  };
}

module.exports = {
  getRuntimeDocIndexPath,
  getRuntimeFaqPath,
  readJsonPreferRuntime,
  writeJsonWithRuntimeFallback
};