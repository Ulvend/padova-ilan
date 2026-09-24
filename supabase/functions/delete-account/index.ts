// Supabase Edge Function (Deno): kullanıcının kendi hesabını ve ilişkili tüm verilerini siler (GDPR Madde 17 - unutulma hakkı).
//
// Deploy: supabase functions deploy delete-account --no-verify-jwt
//   (JWT doğrulaması aşağıda fonksiyon içinde yapılır; service role anahtarı yalnızca burada, sunucuda kullanılır.)
//
// Silinenler:
//   * profiles, profile_private, messages (gönderilen ve alınan), notifications, reports, admins  -> auth.users silinince ON DELETE CASCADE
//   * listings (+ listing_stats, o ilanlara ait reports)  -> listings.user_id "on delete set null" olduğu için AÇIKÇA silinir,
//     yoksa ilan sahipsiz ama ad/kullanıcı adı/avatar ile yayında kalırdı
//   * Storage: profile_photos/{uid}/* ve listing_photos/{uid}/*  -> CASCADE ile silinmez, AÇIKÇA silinir
//
// Ana yönetici (superadmin) hesabı silinemez: sistem yönetimsiz kalmasın; önce yetki devredilmelidir.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BUCKETS = ['profile_photos', 'listing_photos'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const adminHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

/** Authorization başlığındaki JWT'nin gerçek bir kullanıcıya ait olduğunu Supabase Auth'a sorar. */
async function authenticate(req: Request): Promise<{ id: string } | Response> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'Oturum açılması gerekli' }, 401);

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  });
  if (!res.ok) return json({ error: 'Geçersiz oturum' }, 401);
  const user = (await res.json()) as { id?: string };
  if (!user?.id) return json({ error: 'Geçersiz oturum' }, 401);
  return { id: user.id };
}

async function isSuperadmin(uid: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/admins?uid=eq.${uid}&select=role`, { headers: adminHeaders });
  if (!res.ok) throw new Error(`admins lookup failed: ${res.status}`);
  const rows = (await res.json()) as { role: string }[];
  return rows.some((r) => r.role === 'superadmin');
}

/** {uid}/ altındaki tüm dosyaları bucket'tan siler. */
async function deleteStorageFolder(bucket: string, uid: string): Promise<void> {
  for (let round = 0; round < 20; round++) {
    const listRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${bucket}`, {
      method: 'POST',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: `${uid}/`, limit: 1000, offset: 0 }),
    });
    if (!listRes.ok) throw new Error(`storage list failed: ${listRes.status}`);
    const files = (await listRes.json()) as { name: string }[];
    if (files.length === 0) return;

    const delRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}`, {
      method: 'DELETE',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: files.map((f) => `${uid}/${f.name}`) }),
    });
    if (!delRes.ok) throw new Error(`storage delete failed: ${delRes.status}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // 1. Kimlik doğrulama: yalnızca kendi hesabını silebilir (uid, doğrulanan JWT'den gelir; istekten alınmaz).
  const auth = await authenticate(req);
  if (auth instanceof Response) return auth;
  const uid = auth.id;

  // 2. Bilinçli onay: yanlışlıkla/otomatik çağrılara karşı açık bir onay alanı zorunludur.
  let body: { confirm?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // boş gövde -> onay yok
  }
  if (body?.confirm !== true) {
    return json({ error: 'Onay gerekli' }, 400);
  }

  try {
    // 3. Ana yönetici hesabı silinemez.
    if (await isSuperadmin(uid)) {
      return json({ error: 'superadmin_cannot_delete' }, 403);
    }

    // 4. Storage dosyaları (CASCADE ile silinmez).
    for (const bucket of BUCKETS) {
      await deleteStorageFolder(bucket, uid);
    }

    // 5. İlanlar (user_id "set null" olduğu için açıkça silinir; listing_stats ve ilgili reports CASCADE ile gider).
    const listingsRes = await fetch(`${SUPABASE_URL}/rest/v1/listings?user_id=eq.${uid}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    if (!listingsRes.ok) throw new Error(`listings delete failed: ${listingsRes.status}`);

    // 6. Hesabın kendisi: profiles, profile_private, messages, notifications, reports, admins CASCADE ile silinir.
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    if (!userRes.ok) throw new Error(`user delete failed: ${userRes.status}`);

    return json({ ok: true });
  } catch (error) {
    console.error('delete-account error:', error);
    return json({ error: 'Hesap silinemedi. Lütfen tekrar deneyin.' }, 500);
  }
});
