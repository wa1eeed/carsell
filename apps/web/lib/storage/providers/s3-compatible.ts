/**
 * S3CompatibleProvider
 * قاعدة مشتركة لكل مزود يدعم S3 API:
 * - Cloudflare R2
 * - AWS S3
 * - Alibaba Cloud OSS (S3-compatible mode)
 *
 * الفرق الوحيد بين المزودين = endpoint + credentials
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type {
  StorageProvider,
  UploadSlot,
  SignedFile,
  FilePurpose,
} from '../types/provider'

export const EXPIRY_SECONDS: Record<FilePurpose, number> = {
  image_preview:     60 * 60,      // 1 ساعة
  document_view:     60 * 15,      // 15 دقيقة
  document_download: 60 * 5,       // 5 دقائق
  upload:            60 * 10,      // 10 دقائق
}

export interface S3CompatibleConfig {
  endpoint: string        // https://xxx.r2.cloudflarestorage.com | https://s3.amazonaws.com | ...
  region: string          // auto | us-east-1 | oss-me-east-1 | ...
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  forcePathStyle?: boolean  // Alibaba OSS يحتاجه true
}

export class S3CompatibleProvider implements StorageProvider {
  protected client: S3Client
  protected bucket: string

  constructor(config: S3CompatibleConfig) {
    this.bucket = config.bucket
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId:     config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? false,
    })
  }

  async createUploadUrl(params: {
    key: string
    contentType: string
    expiresIn?: number
  }): Promise<UploadSlot> {
    const expiresIn = params.expiresIn ?? EXPIRY_SECONDS.upload
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      ContentType: params.contentType,
    })
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn })
    return {
      uploadUrl,
      key: params.key,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    }
  }

  async getSignedUrl(key: string, purpose: FilePurpose): Promise<SignedFile> {
    const expiresIn = EXPIRY_SECONDS[purpose]
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key })
    const url = await getSignedUrl(this.client, command, { expiresIn })
    return { key, url, expiresAt: new Date(Date.now() + expiresIn * 1000) }
  }

  async getSignedUrls(keys: string[], purpose: FilePurpose): Promise<SignedFile[]> {
    return Promise.all(keys.map((k) => this.getSignedUrl(k, purpose)))
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }

  async deleteFiles(keys: string[]): Promise<void> {
    if (keys.length === 0) return
    // حذف دفعي — S3 يدعم حتى 1000 في طلب واحد
    const chunks = chunkArray(keys, 1000)
    await Promise.all(
      chunks.map((chunk) =>
        this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: chunk.map((Key) => ({ Key })) },
          })
        )
      )
    )
  }

  /**
   * List all object keys under a prefix (for cleanup jobs).
   * Handles pagination automatically — returns ALL keys.
   */
  async listObjects(prefix: string): Promise<string[]> {
    const keys: string[] = []
    let continuationToken: string | undefined

    do {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket:            this.bucket,
          Prefix:            prefix,
          ContinuationToken: continuationToken,
          MaxKeys:           1000,
        }),
      )
      for (const obj of res.Contents ?? []) {
        if (obj.Key) keys.push(obj.Key)
      }
      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
    } while (continuationToken)

    return keys
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}
