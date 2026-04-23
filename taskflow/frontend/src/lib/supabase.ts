import { createClient } from "@supabase/supabase-js"

// The worker URL acts as a proxy to Supabase
// In development, this points to the local worker or direct Supabase URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "http://localhost:8787"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "0"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Worker URL for asset operations (if different from Supabase proxy)
export const workerUrl = import.meta.env.VITE_WORKER_URL || supabaseUrl

// Asset upload helper
export async function uploadAsset(
  filePath: string,
  file: File,
  accessToken: string,
  type?: string
): Promise<Response> {
  const url = new URL(`/api/v1/user_asset/${filePath}`, workerUrl)
  if (type) {
    url.searchParams.set("type", type)
  }

  return fetch(url.toString(), {
    method: "PUT",
    body: file,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": file.type,
    },
  })
}

// Asset delete helper
export async function deleteAsset(
  filePath: string,
  accessToken: string
): Promise<Response> {
  const url = new URL(`/api/v1/user_asset/${filePath}`, workerUrl)

  return fetch(url.toString(), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

// Image upload helper (for avatars, covers, etc.)
export async function uploadImage(
  imagePath: string,
  file: File,
  accessToken: string
): Promise<Response> {
  const url = new URL(`/api/v1/image/${imagePath}`, workerUrl)

  return fetch(url.toString(), {
    method: "PUT",
    body: file,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": file.type,
    },
  })
}
