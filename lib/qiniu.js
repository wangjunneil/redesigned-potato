import qiniu from "qiniu";

const QINIU_ACCESS_KEY = process.env.QINIU_ACCESS_KEY;
const QINIU_SECRET_KEY = process.env.QINIU_SECRET_KEY;
const QINIU_BUCKET = process.env.QINIU_BUCKET || "potato";

// 从 photos 里存的 src（形如 https://cdn.example.com/wangjundev/timeline/xxx.jpg）解析出七牛 key
export function extractKeyFromSrc(src) {
  if (!src) return null;
  try {
    return new URL(src).pathname.replace(/^\//, "");
  } catch {
    return src.replace(/^https?:\/\/[^/]+\//, "");
  }
}

// 删除七牛文件，返回 Promise<boolean>（成功 true / 失败 false，不抛错）
export function deleteQiniuFile(key) {
  if (!key) return Promise.resolve(false);
  if (!QINIU_ACCESS_KEY || !QINIU_SECRET_KEY || !QINIU_BUCKET) {
    console.warn("七牛云配置未完成，跳过删除文件:", key);
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const mac = new qiniu.auth.digest.Mac(QINIU_ACCESS_KEY, QINIU_SECRET_KEY);
    const config = new qiniu.conf.Config();
    const bucketManager = new qiniu.rs.BucketManager(mac, config);
    bucketManager.delete(QINIU_BUCKET, key, (err, respBody, respInfo) => {
      if (err) {
        console.error("删除七牛文件失败:", key, err);
        resolve(false);
      } else {
        console.log("删除七牛文件成功:", key);
        resolve(true);
      }
    });
  });
}
