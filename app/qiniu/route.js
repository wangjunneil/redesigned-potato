import qiniu from 'qiniu'

export async function GET(request) {
    var accessKey = 'aG8mlc9B4VMZe_9T282O7q3CbLCDdZ6YdohuDa8p';
    var secretKey = '-7kLVkHoasqRjeR9zlT2e8KuRjJzKXEa-z2QtWsX';
    var mac = new qiniu.auth.digest.Mac(accessKey, secretKey);    

    var options = {
        scope: 'wjfilm',
        returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}'
    };
    var putPolicy = new qiniu.rs.PutPolicy(options);
    var uploadToken = putPolicy.uploadToken(mac);

    return new Response(`{"status":"ok", "token": "${uploadToken}"}`, {
        status: 200,
        headers: {
          'Content-type': 'application/json'
        }
    })
}