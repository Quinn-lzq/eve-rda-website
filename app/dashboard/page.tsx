// app/dashboard/page.tsx
import { createClient } from "@/utils/supabase/server";
import { refreshAccessToken, getCharacterWallet, getCharacterSkills, formatISK, formatNumber } from "@/utils/eve-api";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Please Log In</div>;

  const charName = user.user_metadata.character_name;
  const charId = user.user_metadata.character_id;
  const refreshToken = user.user_metadata.eve_refresh_token;

  // 初始化数据
  let walletBalance = 0;
  let totalSP = 0;
  let errorMsg = "";

  try {
    if (refreshToken) {
      // 1. 先获取新的通行证 (Access Token)
      const accessToken = await refreshAccessToken(refreshToken);
      
      // 2. 🚀 并行请求：同时查询钱包和技能点，速度翻倍！
      const [walletData, spData] = await Promise.all([
        getCharacterWallet(charId, accessToken),
        getCharacterSkills(charId, accessToken)
      ]);

      walletBalance = walletData;
      totalSP = spData || 0; // 如果 spData 是 null (比如没权限)，就显示 0
    } else {
      errorMsg = "令牌缺失";
    }
  } catch (e) {
    console.error("ESI 数据同步失败:", e);
    errorMsg = "数据同步失败";
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-baseline gap-2 mb-2">
        <h1 className="text-2xl font-normal text-gray-800">首页</h1>
        <span className="text-gray-500 text-sm">仪表盘</span>
        {errorMsg && <span className="text-red-500 text-xs ml-2">⚠️ {errorMsg}</span>}
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <InfoBox color="bg-[#00c0ef]" icon="👥" label="在线玩家" value="36,254" sub="Tranquility Server" />
        <InfoBox color="bg-[#00a65a]" icon="🔗" label="当前角色ID" value={charId} />
        
        {/* 真实的钱包数据 */}
        <InfoBox 
            color="bg-[#f39c12]" 
            icon="💳" 
            label="总角色 ISK" 
            value={formatISK(walletBalance)} 
            sub="实时余额"
        />
        
        {/* 真实的技能点数据 */}
        <InfoBox 
            color="bg-[#dd4b39]" 
            icon="🎓" 
            label="总角色技能点" 
            value={formatNumber(totalSP)} 
            sub={totalSP > 0 ? "已注入技能点" : "权限不足或获取失败"} 
        />
      </div>

      {/* 图表区域 (静态占位) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border-t-[3px] border-[#00c0ef] shadow-sm rounded-sm">
            <div className="p-3 border-b border-gray-100 flex justify-between">
                <h3 className="text-base font-normal">同时在线人数</h3>
            </div>
            <div className="p-4 h-64 flex items-end gap-1 justify-center bg-gray-50">
                {[30,45,60,50,70,85,60,40,30,25,30,40,55,70,80].map((h, i) => (
                    <div key={i} className="flex-1 bg-[#3c8dbc]/60 hover:bg-[#3c8dbc] transition-all rounded-t" style={{height: `${h}%`}}></div>
                ))}
            </div>
        </div>

        <div className="bg-white border-t-[3px] border-[#dd4b39] shadow-sm rounded-sm">
            <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-black"></div>
                <h3 className="text-base font-normal">{charName} 的技能</h3>
            </div>
            <div className="p-4 h-64 flex items-center justify-center bg-gray-50 text-gray-400">
                 图表功能开发中...
            </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ color, icon, label, value, sub }: any) {
    return (
        <div className="bg-white rounded-sm shadow-sm flex overflow-hidden group hover:shadow-md transition-shadow">
            <div className={`${color} text-white w-[90px] flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500`}>
                {icon}
            </div>
            <div className="p-3 flex-1 flex flex-col justify-center min-w-0">
                <span className="block text-sm uppercase text-gray-500 font-medium">{label}</span>
                <span className="block text-lg font-bold text-gray-800 my-1 truncate" title={String(value)}>
                    {value}
                </span>
                {sub && <div className="text-xs text-gray-400 border-t pt-1 mt-1 truncate">{sub}</div>}
            </div>
        </div>
    )
}