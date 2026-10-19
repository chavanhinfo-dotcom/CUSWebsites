// Option E's live content, kept in Supabase. A small client over its REST API (no SDK): the site reads the
// content table with the public key; the admin page signs in, writes it, and uploads pictures to storage.
// Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (the project's public "anon" key) where the
// site is built; without them the site simply uses its built-in content. Table, bucket and access rules:
// components/e/admin/setup.sql.

export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_KEY);
export const TABLE = "site_content";
export const BUCKET = "site-media";

export type Row = { key: string; value: unknown; updated_at?: string; updated_by?: string | null };
export type Session = { access_token: string; refresh_token: string; expires_at: number; email: string };

type Json = Record<string, unknown>;
const headers = (token?: string): Record<string, string> => ({ apikey: SUPABASE_KEY, Authorization: `Bearer ${token ?? SUPABASE_KEY}` });

/** The response's JSON, or an Error carrying the service's own message. */
async function read<T>(r: Response): Promise<T> {
  if (!r.ok) {
    let message = `${r.status} ${r.statusText}`;
    try {
      const j = (await r.json()) as Json;
      message = String(j.message ?? j.msg ?? j.error_description ?? j.error ?? message);
    } catch {
      // (no JSON body)
    }
    throw new Error(message);
  }
  const text = await r.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Every saved section of the content (public read). */
export function fetchRows(signal?: AbortSignal) {
  return fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=key,value,updated_at,updated_by`, { headers: headers(), cache: "no-store", signal }).then((r) => read<Row[]>(r));
}

const toSession = (j: Json): Session => ({
  access_token: String(j.access_token),
  refresh_token: String(j.refresh_token),
  expires_at: Date.now() + Number(j.expires_in ?? 3600) * 1000,
  email: String((j.user as Json | undefined)?.email ?? ""),
});

export async function signIn(email: string, password: string) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return toSession(await read<Json>(r));
}

export async function refresh(s: Session) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: s.refresh_token }),
  });
  return toSession(await read<Json>(r));
}

export async function signOut(s: Session) {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: headers(s.access_token) }).catch(() => {});
}

/** Whether the signed-in user is on the admin list (each admin can see only their own entry). */
export async function isAdmin(s: Session) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/site_admins?select=email`, { headers: headers(s.access_token), cache: "no-store" });
  return (await read<Row[]>(r)).length > 0;
}

/** Saves one section (inserted, or replacing what was there). */
export async function saveRow(s: Session, key: string, value: unknown) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: { ...headers(s.access_token), "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify([{ key, value, updated_at: new Date().toISOString(), updated_by: s.email }]),
  });
  return (await read<Row[]>(r))[0];
}

/** Uploads a picture to the media bucket; returns its public address. */
export async function uploadFile(s: Session, file: File, folder: string) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "image";
  const path = `${folder}/${Date.now()}-${base}.${ext}`;
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: { ...headers(s.access_token), "Content-Type": file.type || "application/octet-stream", "x-upsert": "true", "cache-control": "31536000" },
    body: file,
  });
  await read<Json>(r);
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}
