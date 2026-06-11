'use client'

import { useState, useCallback } from 'react'

interface UploadOptions {
  carId: string
  category: 'image' | 'document'
  docType?: string
  isCover?: boolean
  onSuccess?: (file: { id: string; key: string }) => void
  onError?: (error: string) => void
}

interface UploadState {
  uploading: boolean
  progress: number
  error: string | null
}

export function useCarUpload(options: UploadOptions) {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
  })

  const upload = useCallback(
    async (file: File) => {
      setState({ uploading: true, progress: 0, error: null })

      try {
        // ١. طلب presigned URL من الـ backend
        const slotRes = await fetch(`/api/cars/${options.carId}/upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: file.type,
            size: file.size,
            category: options.category,
            docType: options.docType,
            isCover: options.isCover,
          }),
        })

        if (!slotRes.ok) {
          const err = await slotRes.json()
          throw new Error(err.error ?? 'فشل الحصول على رابط الرفع')
        }

        const slot: { uploadUrl: string; key: string } = await slotRes.json()
        setState((s) => ({ ...s, progress: 10 }))

        // ٢. رفع مباشر لـ bucket عبر XHR (لتتبع التقدم)
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 80) + 10
              setState((s) => ({ ...s, progress: pct }))
            }
          })

          xhr.addEventListener('load', () => {
            xhr.status >= 200 && xhr.status < 300
              ? resolve()
              : reject(new Error(`فشل الرفع: ${xhr.status}`))
          })
          xhr.addEventListener('error', () => reject(new Error('انقطع الاتصال أثناء الرفع')))

          xhr.open('PUT', slot.uploadUrl)
          xhr.setRequestHeader('Content-Type', file.type)
          xhr.send(file)
        })

        setState((s) => ({ ...s, progress: 92 }))

        // ٣. تأكيد الرفع للـ backend — يحفظ الـ key في DB
        const confirmRes = await fetch(`/api/cars/${options.carId}/confirm-upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: slot.key,
            category: options.category,
            fileName: file.name,
            fileSize: file.size,
            docType: options.docType,
            isCover: options.isCover,
          }),
        })

        if (!confirmRes.ok) {
          const err = await confirmRes.json()
          throw new Error(err.error ?? 'فشل تأكيد الرفع')
        }

        const saved: { id: string; key: string } = await confirmRes.json()
        setState({ uploading: false, progress: 100, error: null })
        options.onSuccess?.(saved)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'خطأ غير متوقع'
        setState({ uploading: false, progress: 0, error: msg })
        options.onError?.(msg)
      }
    },
    [options]
  )

  const reset = useCallback(() => {
    setState({ uploading: false, progress: 0, error: null })
  }, [])

  return { ...state, upload, reset }
}

// ─── Multi-file upload ────────────────────────

export interface MultiUploadResult {
  succeeded: Array<{ file: File; id: string; key: string }>
  failed: Array<{ file: File; error: string }>
}

export async function uploadMultipleImages(
  carId: string,
  files: File[],
  onProgress?: (done: number, total: number) => void
): Promise<MultiUploadResult> {
  const result: MultiUploadResult = { succeeded: [], failed: [] }
  let done = 0

  for (const file of files) {
    try {
      const slotRes = await fetch(`/api/cars/${carId}/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type,
          size: file.size,
          category: 'image',
          isCover: done === 0 && result.succeeded.length === 0,
        }),
      })
      const slot = await slotRes.json()

      await fetch(slot.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      const confirmRes = await fetch(`/api/cars/${carId}/confirm-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: slot.key,
          category: 'image',
          fileName: file.name,
          fileSize: file.size,
        }),
      })
      const saved = await confirmRes.json()
      result.succeeded.push({ file, ...saved })
    } catch (err) {
      result.failed.push({
        file,
        error: err instanceof Error ? err.message : 'خطأ غير متوقع',
      })
    }

    done++
    onProgress?.(done, files.length)
  }

  return result
}
