import { S3CompatibleProvider } from './s3-compatible'

export function createR2Provider() {
  const accountId = process.env.R2_ACCOUNT_ID
  if (!accountId) throw new Error('R2_ACCOUNT_ID مطلوب')

  return new S3CompatibleProvider({
    endpoint:        `https://${accountId}.r2.cloudflarestorage.com`,
    region:          'auto',
    bucket:          process.env.R2_BUCKET_NAME!,
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  })
}
