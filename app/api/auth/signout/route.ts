// app/api/auth/signout/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = await createClient();

  // 1. 在服务端执行登出 (清除 HttpOnly Cookie)
  await supabase.auth.signOut();

  // 2. 强制重定向回首页 (这会强制浏览器刷新页面)
  return NextResponse.redirect(`${requestUrl.origin}/`);
}