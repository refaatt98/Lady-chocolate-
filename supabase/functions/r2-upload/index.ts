// رفع وحذف صور المنتجات على Cloudflare R2.
// - بس للأدمن: منتأكد من جدول admins بتوكن المستخدم نفسه (قواعد RLS).
// - مفاتيح R2 محفوظة مشفّرة بـ Supabase Vault، ومنقرأها بـ service role عبر public.r2_config().
// - المفاتيح ما بتطلع للمتصفح أبدًا.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { AwsClient } from 'npm:aws4fetch@1.0.20'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-file-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_BYTES = 8 * 1024 * 1024
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

interface R2Config {
  account_id: string
  bucket: string
  access_key_id: string
  secret_access_key: string
  public_url: string
}

let cached: R2Config | null = null
async function r2Config(): Promise<R2Config> {
  if (cached) return cached
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data, error } = await admin.rpc('r2_config')
  if (error || !data) throw new Error('r2_config_missing')
  cached = (Array.isArray(data) ? data[0] : data) as R2Config
  return cached
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  // ١) أدمن؟
  const auth = req.headers.get('Authorization') ?? ''
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  })
  const { data: userData } = await userClient.auth.getUser()
  const user = userData?.user
  if (!user) return json({ error: 'unauthorized' }, 401)
  const { data: adminRow } = await userClient.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!adminRow) return json({ error: 'not_admin' }, 403)

  let cfg: R2Config
  try {
    cfg = await r2Config()
  } catch {
    return json({ error: 'storage_not_configured' }, 500)
  }
  const r2 = new AwsClient({ accessKeyId: cfg.access_key_id, secretAccessKey: cfg.secret_access_key, service: 's3', region: 'auto' })
  const endpoint = `https://${cfg.account_id}.r2.cloudflarestorage.com/${cfg.bucket}`
  const publicBase = cfg.public_url.replace(/\/$/, '')

  const contentType = (req.headers.get('Content-Type') ?? '').split(';')[0].trim()

  // ٢) حذف: { action: 'delete', url }
  if (contentType === 'application/json') {
    const body = await req.json().catch(() => ({}))
    if (body?.action !== 'delete' || typeof body.url !== 'string') return json({ error: 'bad_request' }, 400)
    if (!body.url.startsWith(`${publicBase}/products/`)) return json({ ok: true, skipped: true })
    const key = decodeURIComponent(body.url.slice(publicBase.length + 1))
    const res = await r2.fetch(`${endpoint}/${key.split('/').map(encodeURIComponent).join('/')}`, { method: 'DELETE' })
    return json({ ok: res.ok })
  }

  // ٣) رفع: الجسم = الصورة نفسها
  const ext = TYPES[contentType]
  if (!ext) return json({ error: 'unsupported_type' }, 415)
  const bytes = new Uint8Array(await req.arrayBuffer())
  if (bytes.byteLength === 0) return json({ error: 'empty' }, 400)
  if (bytes.byteLength > MAX_BYTES) return json({ error: 'too_large' }, 413)

  const rawName = decodeURIComponent(req.headers.get('x-file-name') ?? 'image')
  const safe = rawName.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 40).toLowerCase() || 'image'
  const key = `products/${new Date().toISOString().slice(0, 7)}/${Date.now()}-${safe}.${ext}`

  const put = await r2.fetch(`${endpoint}/${key}`, {
    method: 'PUT',
    body: bytes,
    headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable' },
  })
  if (!put.ok) return json({ error: 'upload_failed', status: put.status }, 502)
  return json({ url: `${publicBase}/${key}` })
})
