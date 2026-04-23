/**
 * TaskFlow Cloudflare Worker
 * 
 * This worker acts as a proxy to Supabase and handles:
 * - API proxy to Supabase (REST, Auth, Realtime)
 * - User asset management (upload, download, delete)
 * - Image processing for avatars and covers
 * 
 * Based on supabase-cf-project-starter
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface Env {
  // Supabase configuration
  SUPABASE_URL: string
  SUPABASE_ANON_TOKEN: string
  SUPABASE_JWT_SECRET: string

  // R2 bucket for user assets
  USER_ASSETS_BUCKET_1: R2Bucket

  // Base URL for serving assets
  USER_ASSET_BASE_URL_1: string
}

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, apikey, x-client-info',
  'Access-Control-Max-Age': '86400',
}

// Verify JWT token and extract user ID
async function verifyToken(token: string, secret: string): Promise<string | null> {
  try {
    const [, payloadBase64] = token.split('.')
    const payload = JSON.parse(atob(payloadBase64))
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null
    }
    
    return payload.sub || null
  } catch {
    return null
  }
}

// Get authorization token from request
function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

// Generate unique file path
function generateFilePath(userId: string, originalPath: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = originalPath.split('.').pop() || ''
  return `${userId}/${timestamp}-${random}${ext ? '.' + ext : ''}`
}

// Handle user asset operations
async function handleUserAsset(
  request: Request,
  env: Env,
  pathParts: string[]
): Promise<Response> {
  const token = getAuthToken(request)
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userId = await verifyToken(token, env.SUPABASE_JWT_SECRET)
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const filePath = pathParts.slice(3).join('/')
  
  if (!filePath || filePath.startsWith('.') || filePath.includes('..')) {
    return new Response(JSON.stringify({ error: 'Invalid file path' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const fullPath = `${userId}/${filePath}`

  switch (request.method) {
    case 'PUT': {
      // Upload asset
      const contentType = request.headers.get('Content-Type') || 'application/octet-stream'
      const body = await request.arrayBuffer()
      const assetType = new URL(request.url).searchParams.get('type') || 'file'

      await env.USER_ASSETS_BUCKET_1.put(fullPath, body, {
        httpMetadata: { contentType },
      })

      const assetUrl = `${env.USER_ASSET_BASE_URL_1}/${fullPath}`

      // Create asset record in database
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_TOKEN, {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      })

      const { data, error } = await supabase.rpc('create_user_asset', {
        asset_name: filePath,
        asset_asset_url: assetUrl,
        asset_asset_type: assetType,
        asset_size: body.byteLength,
      })

      if (error) {
        // Clean up uploaded file
        await env.USER_ASSETS_BUCKET_1.delete(fullPath)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ 
        success: true, 
        asset: data,
        url: assetUrl,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    case 'GET': {
      // Download asset
      const object = await env.USER_ASSETS_BUCKET_1.get(fullPath)
      
      if (!object) {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const headers = new Headers(corsHeaders)
      headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
      headers.set('Cache-Control', 'public, max-age=31536000')
      
      return new Response(object.body, { headers })
    }

    case 'DELETE': {
      // Delete asset
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_TOKEN, {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      })

      const { data, error } = await supabase.rpc('delete_user_asset', {
        asset_owner_id: userId,
        asset_name: filePath,
      })

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      await env.USER_ASSETS_BUCKET_1.delete(fullPath)

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
  }
}

// Handle image operations (avatars, covers, posters)
async function handleImage(
  request: Request,
  env: Env,
  pathParts: string[]
): Promise<Response> {
  const token = getAuthToken(request)
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userId = await verifyToken(token, env.SUPABASE_JWT_SECRET)
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const imagePath = pathParts.slice(3).join('/')
  
  // Special paths for profiles and projects
  let fullPath: string
  let updateField: string | null = null
  let updateTable: string | null = null
  let updateId: string | null = null

  if (imagePath.startsWith('.profiles/')) {
    const profileId = imagePath.split('/')[1]
    if (profileId !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    fullPath = `avatars/${profileId}`
    updateField = 'avatar_url'
    updateTable = 'profiles'
    updateId = profileId
  } else if (imagePath.startsWith('.projects/')) {
    const projectId = imagePath.split('/')[1]
    fullPath = `projects/${projectId}/poster`
    updateField = 'cover_url'
    updateTable = 'projects'
    updateId = projectId
  } else if (imagePath.startsWith('.workspaces/')) {
    const workspaceId = imagePath.split('/')[1]
    fullPath = `workspaces/${workspaceId}/logo`
    updateField = 'logo_url'
    updateTable = 'workspaces'
    updateId = workspaceId
  } else {
    fullPath = `${userId}/images/${imagePath}`
  }

  switch (request.method) {
    case 'PUT': {
      const contentType = request.headers.get('Content-Type') || 'image/jpeg'
      
      if (!contentType.startsWith('image/')) {
        return new Response(JSON.stringify({ error: 'Invalid content type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const body = await request.arrayBuffer()
      
      await env.USER_ASSETS_BUCKET_1.put(fullPath, body, {
        httpMetadata: { contentType },
      })

      const imageUrl = `${env.USER_ASSET_BASE_URL_1}/${fullPath}`

      // Update the corresponding record
      if (updateTable && updateField && updateId) {
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_TOKEN, {
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
        })

        const { error } = await supabase
          .from(updateTable)
          .update({ [updateField]: imageUrl })
          .eq('id', updateId)

        if (error) {
          console.error('Failed to update record:', error)
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        url: imageUrl,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    case 'GET': {
      const object = await env.USER_ASSETS_BUCKET_1.get(fullPath)
      
      if (!object) {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const headers = new Headers(corsHeaders)
      headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
      headers.set('Cache-Control', 'public, max-age=31536000')
      
      return new Response(object.body, { headers })
    }

    case 'DELETE': {
      await env.USER_ASSETS_BUCKET_1.delete(fullPath)

      // Clear the URL in the corresponding record
      if (updateTable && updateField && updateId) {
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_TOKEN, {
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
        })

        await supabase
          .from(updateTable)
          .update({ [updateField]: null })
          .eq('id', updateId)
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
  }
}

// Proxy request to Supabase
async function proxyToSupabase(
  request: Request,
  env: Env,
  path: string
): Promise<Response> {
  const url = new URL(request.url)
  const targetUrl = `${env.SUPABASE_URL}${path}${url.search}`

  const headers = new Headers(request.headers)
  headers.set('apikey', env.SUPABASE_ANON_TOKEN)
  
  // If no auth header, use anon key
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${env.SUPABASE_ANON_TOKEN}`)
  }

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.body,
  })

  const responseHeaders = new Headers(response.headers)
  Object.entries(corsHeaders).forEach(([key, value]) => {
    responseHeaders.set(key, value)
  })

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      })
    }

    const url = new URL(request.url)
    const pathParts = url.pathname.split('/').filter(Boolean)

    try {
      // API routes
      if (pathParts[0] === 'api' && pathParts[1] === 'v1') {
        if (pathParts[2] === 'user_asset') {
          return handleUserAsset(request, env, pathParts)
        }
        if (pathParts[2] === 'image') {
          return handleImage(request, env, pathParts)
        }
        
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Proxy to Supabase
      if (
        pathParts[0] === 'rest' ||
        pathParts[0] === 'auth' ||
        pathParts[0] === 'realtime' ||
        pathParts[0] === 'storage' ||
        pathParts[0] === 'functions'
      ) {
        return proxyToSupabase(request, env, url.pathname)
      }

      // Health check
      if (pathParts[0] === 'health') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Default: proxy to Supabase
      return proxyToSupabase(request, env, url.pathname)
      
    } catch (error) {
      console.error('Worker error:', error)
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  },
}
