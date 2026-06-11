/**
 * Storage entry point — always access object storage via getStorage().
 * Never call R2/S3 SDKs directly outside lib/storage/providers.
 */
export { getStorage, resetStorage } from './storage/providers/factory'
export type { StorageProvider, UploadSlot, SignedFile, FilePurpose } from './storage/types/provider'
export {
  buildCarFileKey,
  buildShowroomLogoKey,
  validateFileUpload,
  getExtFromContentType,
  getMaxCount,
} from './storage/utils'
