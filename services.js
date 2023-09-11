import InfisicalClient from 'infisical-node';

export const getSecretValue = async (key) => {
    const client = new InfisicalClient({
        token: process.env.KMS_TOKEN,
        siteURL: 'https://kms.wangjun.dev',
        cacheTTL: 3600
    })
    const infisical = await client.getSecret(key, 
        {
          environment:'prod',
          path:'/',
          type:'shared'
        }
    )
    return infisical.secretValue;
}

