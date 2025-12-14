// app/dashboard/layout.tsx
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AuthButton from "@/components/AuthButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  // 获取用户，如果没有则 user 为 null
  const { data: { user } } = await supabase.auth.getUser();

  // 🔴 暂时注释掉下面这行，不让它踢人，先看看界面长啥样
  // if (!user) { redirect("/"); }

  // 如果没有用户，我们用一个假数据来测试界面显示
  const displayUser = user || {
    user_metadata: {
      character_name: "未登录测试员",
      character_id: 1 // 用 1 号 ID 显示 EVE 默认头像
    }
  };

  return (
    <div className="min-h-screen bg-[#ecf0f5] text-[#333] font-sans">
      {/* 侧边栏 */}
      <Sidebar user={displayUser} />

      {/* 右侧主体内容 */}
      <div className="ml-64 min-h-screen flex flex-col transition-all">
        
        {/* 顶部蓝色导航条 */}
        <header className="h-[50px] bg-[#3c8dbc] text-white flex items-center justify-between px-4 shadow-sm z-40">
          <div className="font-bold text-lg tracking-wide flex items-center gap-2">
            <span>EVE RDA</span>
            {!user && <span className="bg-red-500 text-xs px-2 py-1 rounded">调试模式: 未检测到 Session</span>}
          </div>
          <div className="flex items-center gap-4">
             {/* 这里的 isLogged 只是为了显示注销按钮样式 */}
             <AuthButton isLogged={!!user} />
          </div>
        </header>

        {/* 页面内容 */}
        <main className="p-6">
           {children}
        </main>

        <footer className="mt-auto bg-white p-4 text-xs text-gray-600 border-t flex justify-between">
            <span><strong>SeAT 风格面板</strong> | Next.js 15</span>
            <span>Version 3.0.23</span>
        </footer>
      </div>
    </div>
  );
}