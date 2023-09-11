import InfisicalClient from 'infisical-node';

export const currentDate = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
}

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