import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // 使用 @supabase/ssr 创建客户端，它会自动处理 Cookies
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}