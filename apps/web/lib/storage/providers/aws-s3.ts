import { S3CompatibleProvider } from './s3-compatible'

export function createAwsS3Provider() {
  const region = process.env.AWS_REGION ?? 'me-south-1'  // Bahrain — أقرب للخليج

  return new S3CompatibleProvider({
    endpoint:        `https://s3.${region}.amazonaws.com`,
    region,
    bucket:          process.env.AWS_S3_BUCKET!,
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  })
}
