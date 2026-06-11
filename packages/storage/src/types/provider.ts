/**
 * StorageProvider — العقد المشترك لجميع مزودي التخزين
 * أي مزود (R2 / S3 / Alibaba OSS) يجب أن ينفّذ هذه الواجهة
 */

export interface UploadSlot {
  uploadUrl: string   // presigned PUT URL — يُستخدم مباشرة من المتصفح
  key: string         // المسار الكامل في bucket — يُحفظ في DB
  expiresAt: Date
}

export interface SignedFile {
  key: string
  url: string         // presigned GET URL مؤقت
  expiresAt: Date
}

export type FilePurpose =
  | 'image_preview'      // عرض صورة في الواجهة — 1h
  | 'document_view'      // عرض PDF في المتصفح — 15m
  | 'document_download'  // تحميل مباشر — 5m
  | 'upload'             // presigned PUT — 10m

export interface StorageProvider {
  /**
   * إنشاء presigned PUT URL لرفع ملف من المتصفح مباشرة
   */
  createUploadUrl(params: {
    key: string
    contentType: string
    expiresIn?: number
  }): Promise<UploadSlot>

  /**
   * إنشاء presigned GET URL لقراءة ملف
   */
  getSignedUrl(key: string, purpose: FilePurpose): Promise<SignedFile>

  /**
   * إنشاء روابط لمجموعة ملفات دفعة واحدة
   */
  getSignedUrls(keys: string[], purpose: FilePurpose): Promise<SignedFile[]>

  /**
   * حذف ملف واحد
   */
  deleteFile(key: string): Promise<void>

  /**
   * حذف مجموعة ملفات
   */
  deleteFiles(keys: string[]): Promise<void>
}
