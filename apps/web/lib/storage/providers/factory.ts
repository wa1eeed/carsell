/**
 * Storage Factory
 *
 * لتغيير المزود: بدّل STORAGE_PROVIDER في ملف .env فقط
 *
 *   STORAGE_PROVIDER=r2         ← Cloudflare R2  (الافتراضي)
 *   STORAGE_PROVIDER=aws        ← AWS S3
 *   STORAGE_PROVIDER=alibaba    ← Alibaba Cloud OSS
 */

import type { StorageProvider } from '../types/provider'
import { createR2Provider }       from './r2'
import { createAwsS3Provider }    from './aws-s3'
import { createAlibabaOssProvider } from './alibaba-oss'

export type StorageProviderName = 'r2' | 'aws' | 'alibaba'

let _instance: StorageProvider | null = null

export function getStorage(): StorageProvider {
  if (_instance) return _instance

  const provider = (process.env.STORAGE_PROVIDER ?? 'r2') as StorageProviderName

  switch (provider) {
    case 'r2':
      _instance = createR2Provider()
      break
    case 'aws':
      _instance = createAwsS3Provider()
      break
    case 'alibaba':
      _instance = createAlibabaOssProvider()
      break
    default:
      throw new Error(
        `STORAGE_PROVIDER غير معروف: "${provider}". الخيارات: r2 | aws | alibaba`
      )
  }

  return _instance
}

/** لإعادة تهيئة الـ instance — مفيد في tests */
export function resetStorage(): void {
  _instance = null
}
