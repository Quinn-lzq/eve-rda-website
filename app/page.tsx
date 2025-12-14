// app/page.tsx
import AuthButton from "@/components/AuthButton";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// ⚠️ 强制动态模式，每次刷新都检查登录状态
export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ✅ 如果检测到用户，直接发射到后台
  if (user) {
    redirect("/dashboard");
  }

  // ❌ 没登录，显示简易登录框
  return (
    <main className="min-h-screen bg-[#d2d6de] flex items-center justify-center font-sans">
      <div className="w-full max-w-sm bg-white shadow-lg rounded-sm overflow-hidden">
        <div className="bg-[#3c8dbc] p-6 text-center">
          <h1 className="text-3xl font-bold text-white tracking-widest">EVE RDA</h1>
          <p className="text-blue-100 text-sm mt-2">请登录以开始会话</p>
        </div>
        
        <div className="p-8 space-y-6">
          <p className="text-center text-gray-600 text-sm">
            本系统仅限联盟授权人员使用
          </p>

          <div className="flex justify-center">
            {/* 这里的 size="large" 是我们之前在 AuthButton 里写的 */}
            <AuthButton />
          </div>

          <div className="text-center text-xs text-gray-400 mt-4 border-t pt-4">
            Secured by EVE Online SSO
          </div>
        </div>
      </div>
    </main>
  );
}