import qiniu from "qiniu";
// import { getSecretValue } from "@/services";

export async function GET(request) {
  const QINIU_ACCESS_KEY = "aG8mlc9B4VMZe_9T282O7q3CbLCDdZ6YdohuDa8p";
  const QINIU_SECRET_KEY = "-7kLVkHoasqRjeR9zlT2e8KuRjJzKXEa-z2QtWsX";

  var mac = new qiniu.auth.digest.Mac(QINIU_ACCESS_KEY, QINIU_SECRET_KEY);
  var options = {
    scope: "wjfilm",
    expires: 86400,
    returnBody:
      '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}',
  };
  var putPolicy = new qiniu.rs.PutPolicy(options);
  var uploadToken = putPolicy.uploadToken(mac);

  return new Response(`{"status":"ok", "token": "${uploadToken}"}`, {
    status: 200,
    headers: {
      "Content-type": "application/json",
    },
  });
}

export async function POST(request) {
  const res = await request.json();
  const key = res.key;

  const QINIU_ACCESS_KEY = "aG8mlc9B4VMZe_9T282O7q3CbLCDdZ6YdohuDa8p";
  const QINIU_SECRET_KEY = "-7kLVkHoasqRjeR9zlT2e8KuRjJzKXEa-z2QtWsX";

  var mac = new qiniu.auth.digest.Mac(QINIU_ACCESS_KEY, QINIU_SECRET_KEY);
  var config = new qiniu.conf.Config();
  config.zone = qiniu.zone.Zone_z0;

  var bucketManager = new qiniu.rs.BucketManager(mac, config);
  bucketManager.delete("wjfilm", key, function (err, respBody, respInfo) {
    if (err) {
      console.log(err);
    } else {
      console.log(respInfo.statusCode);
    }
  });

  return new Response(`{"status":"ok"}`, {
    status: 200,
    headers: {
      "Content-type": "application/json",
    },
  });
}
