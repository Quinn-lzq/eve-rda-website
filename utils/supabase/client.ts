// utils/supabase/client.ts

// 导入正确的函数名称
import { createClient } from '@supabase/supabase-js';

// 从环境变量中获取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 验证环境变量是否已设置
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables! Please check your .env.local file.");
}

/**
 * @description 创建 Supabase 客户端实例（用于浏览器环境）
 * @returns SupabaseClient
 */
export const createSupabaseBrowserClient = () => {
  // !! 将 createBrowserClient 替换为 createClient !!
  return createClient( 
    supabaseUrl,
    supabaseAnonKey
  );
};

// 创建并导出一个单例客户端，供需要它的客户端组件使用
export const supabase = createSupabaseBrowserClient();