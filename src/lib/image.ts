/**
 * تصغير الصورة بالمتصفح قبل الرفع: أقصى عرض/طول 1600px وبصيغة webp.
 * صور الجوال (٤–٨ ميغا) بتصير ~٢٠٠ كيلو — الموقع بيصير أسرع بكثير.
 */
export async function compressImage(file: File, maxSize = 1600, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('هاد مش ملف صورة')
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  // إذا المتصفح ما بيدعم webp أو الصورة طلعت أكبر، منرفع الأصلية
  return blob && blob.size < file.size ? blob : file
}
