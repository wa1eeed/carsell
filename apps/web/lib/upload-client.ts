'use client'

/**
 * Browser-side direct upload: presign → PUT to storage → return the stored key.
 */
export async function uploadFile(params: {
  file: File
  carId?: string
  category: 'image' | 'document'
  prefix?: string
}): Promise<{ key: string }> {
  const presignRes = await fetch('/api/v1/uploads/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      carId: params.carId ?? 'draft',
      category: params.category,
      contentType: params.file.type,
      size: params.file.size,
      prefix: params.prefix,
    }),
  })
  const presign = await presignRes.json()
  if (!presign.success) throw new Error(presign.error?.message ?? 'فشل الحصول على رابط الرفع')

  const { uploadUrl, key } = presign.data as { uploadUrl: string; key: string }

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': params.file.type },
    body: params.file,
  })
  if (!putRes.ok) throw new Error(`فشل الرفع: ${putRes.status}`)

  return { key }
}
