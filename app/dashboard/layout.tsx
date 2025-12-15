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
  const { data: { user } } = await supabase.auth.getUser();

  // 临时用假用户测试界面，实际使用时取消注释下面这行
  // if (!user) redirect("/");
  
  const displayUser = user || { user_metadata: { character_name: "Jerry Scintilla", character_id: 1 } };

  return (
    // 背景色改为 #ecf0f5 (AdminLTE 浅灰)
    <div className="min-h-screen bg-[#ecf0f5] text-[#333] font-sans antialiased">
      <Sidebar user={displayUser} />

      {/* 给左侧留出 230px 空间 */}
      <div className="ml-[230px] min-h-screen flex flex-col transition-all">
        
        {/* 顶部 Header: #3c8dbc (SeAT Blue) */}
        <header className="h-[50px] bg-[#3c8dbc] text-white flex items-center justify-between px-4 shadow-sm z-40 sticky top-0">
          <div className="flex items-center">
            {/* 汉堡菜单图标 */}
            <button className="p-2 hover:bg-[#367fa9] rounded transition text-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
            </button>
            <span className="ml-4 text-sm font-light hidden md:block">Resource Development & Audit</span>
          </div>

          <div className="flex items-center gap-4">
             {/* 顶部右侧菜单 */}
             <div className="flex items-center gap-3 text-sm">
                <span className="hover:bg-[#367fa9] px-2 py-3 cursor-pointer">🔔 <span className="bg-red-500 text-[10px] px-1 rounded-sm relative top-[-8px] right-[5px]">0</span></span>
                <span className="hover:bg-[#367fa9] px-2 py-3 cursor-pointer">🚩 <span className="bg-yellow-500 text-[10px] px-1 rounded-sm relative top-[-8px] right-[5px]">6</span></span>
                <span className="font-semibold px-2">{displayUser.user_metadata.character_name}</span>
             </div>
             <AuthButton isLogged={!!user} size="normal" />
          </div>
        </header>

        {/* 页面内容 (包含面包屑区域) */}
        <main className="p-0">
           {children}
        </main>

        <footer className="mt-auto bg-white p-4 text-xs text-gray-600 border-t flex justify-between ml-4 mr-4 mb-4 rounded-sm">
            <span><strong>Copyright &copy; 2025 SeAT.</strong> All rights reserved.</span>
            <span><b>Version</b> 4.0.0</span>
        </footer>
      </div>
    </div>
  );
}