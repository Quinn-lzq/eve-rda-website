// app/dashboard/page.tsx
import { createClient } from "@/utils/supabase/server";

// 🚀 强制动态渲染，解决“数据不刷新”的问题
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const charName = user?.user_metadata?.character_name || "Unknown";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 标题栏 */}
      <div className="flex items-baseline gap-2 mb-2">
        <h1 className="text-2xl font-normal text-gray-800">首页</h1>
        <span className="text-gray-500 text-sm">仪表盘</span>
      </div>

      {/* 概览卡片行 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <InfoBox color="bg-[#00c0ef]" icon="👥" label="在线玩家" value="36,254" sub="最新更新于: 3分钟前" />
        <InfoBox color="bg-[#00a65a]" icon="🔗" label="链接的角色" value="2" />
        <InfoBox color="bg-[#f39c12]" icon="💳" label="总角色 ISK" value="69,689,403.27" />
        <InfoBox color="bg-[#dd4b39]" icon="🎓" label="总角色技能点" value="26,916,669" />
      </div>

      {/* 主体图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 左侧：同时在线 */}
        <div className="bg-white border-t-[3px] border-[#00c0ef] shadow-sm rounded-sm">
            <div className="p-3 border-b border-gray-100 flex justify-between">
                <h3 className="text-base font-normal">同时在线人数</h3>
            </div>
            <div className="p-4 h-64 flex items-end gap-1 justify-center bg-gray-50">
                {/* 假装是图表 */}
                {[30,45,60,50,70,85,60,40,30,25,30,40,55,70,80].map((h, i) => (
                    <div key={i} className="flex-1 bg-[#3c8dbc]/60 hover:bg-[#3c8dbc] transition-all rounded-t" style={{height: `${h}%`}}></div>
                ))}
            </div>
        </div>

        {/* 右侧：技能 */}
        <div className="bg-white border-t-[3px] border-[#dd4b39] shadow-sm rounded-sm">
            <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-black"></div>
                <h3 className="text-base font-normal">{charName} 的技能</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4 h-64">
                 <div className="flex items-center justify-center border border-dashed text-gray-400 text-xs">饼状图区域</div>
                 <div className="flex items-center justify-center border border-dashed text-gray-400 text-xs">雷达图区域</div>
            </div>
        </div>

      </div>
    </div>
  );
}

// 小组件：信息卡片
function InfoBox({ color, icon, label, value, sub }: any) {
    return (
        <div className="bg-white rounded-sm shadow-sm flex overflow-hidden">
            <div className={`${color} text-white w-[90px] flex items-center justify-center text-4xl`}>
                {icon}
            </div>
            <div className="p-3 flex-1">
                <span className="block text-sm uppercase text-gray-500 font-medium">{label}</span>
                <span className="block text-lg font-bold text-gray-800 my-1">{value}</span>
                {sub && <div className="text-xs text-gray-400 border-t pt-1 mt-1">{sub}</div>}
            </div>
        </div>
    )
}