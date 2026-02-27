import { NextResponse } from "next/server";
import qiniu from "qiniu";

// 七牛云配置 - 从环境变量读取
const QINIU_ACCESS_KEY = process.env.QINIU_ACCESS_KEY;
const QINIU_SECRET_KEY = process.env.QINIU_SECRET_KEY;
const QINIU_BUCKET = process.env.QINIU_BUCKET || "potato"; // 默认 bucket 名称

// GET 请求：获取上传 token
export async function GET(request) {
  try {
    // 检查环境变量是否配置
    if (!QINIU_ACCESS_KEY || !QINIU_SECRET_KEY || !QINIU_BUCKET) {
      console.warn("七牛云配置未完成，请在 .env 中配置 QINIU_ACCESS_KEY, QINIU_SECRET_KEY, QINIU_BUCKET");
      return NextResponse.json(
        { status: "error", message: "七牛云配置未完成" },
        { status: 500 }
      );
    }

    // 生成上传 token
    const mac = new qiniu.auth.digest.Mac(QINIU_ACCESS_KEY, QINIU_SECRET_KEY);
    const options = {
      scope: QINIU_BUCKET,
      expires: 3600, // token 有效期 1 小时
    };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    const uploadToken = putPolicy.uploadToken(mac);

    return NextResponse.json({
      status: "ok",
      token: uploadToken,
    });
  } catch (error) {
    console.error("获取上传 token 失败:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}

// POST 请求：删除文件
export async function POST(request) {
  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json(
        { status: "error", message: "缺少文件 key" },
        { status: 400 }
      );
    }

    // 检查环境变量是否配置
    if (!QINIU_ACCESS_KEY || !QINIU_SECRET_KEY || !QINIU_BUCKET) {
      console.warn("七牛云配置未完成");
      return NextResponse.json(
        { status: "error", message: "七牛云配置未完成" },
        { status: 500 }
      );
    }

    // 删除文件
    const mac = new qiniu.auth.digest.Mac(QINIU_ACCESS_KEY, QINIU_SECRET_KEY);
    const config = new qiniu.conf.Config();
    const bucketManager = new qiniu.rs.BucketManager(mac, config);

    return new Promise((resolve) => {
      bucketManager.delete(QINIU_BUCKET, key, (err, respBody, respInfo) => {
        if (err) {
          console.error("删除文件失败:", err);
          resolve(
            NextResponse.json(
              { status: "error", message: err.message },
              { status: 500 }
            )
          );
        } else {
          console.log("删除文件成功:", key);
          resolve(
            NextResponse.json({
              status: "ok",
              message: "文件删除成功",
            })
          );
        }
      });
    });
  } catch (error) {
    console.error("删除文件失败:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
