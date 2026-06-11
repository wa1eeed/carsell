import { S3CompatibleProvider } from './s3-compatible'

export function createAlibabaOssProvider() {
  const region = process.env.ALI_OSS_REGION ?? 'oss-me-east-1'  // Middle East

  return new S3CompatibleProvider({
    endpoint:        `https://${region}.aliyuncs.com`,
    region,
    bucket:          process.env.ALI_OSS_BUCKET!,
    accessKeyId:     process.env.ALI_OSS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.ALI_OSS_ACCESS_KEY_SECRET!,
    forcePathStyle:  true,  // Alibaba OSS يحتاج path-style
  })
}
