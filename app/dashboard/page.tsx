// app/dashboard/page.tsx
import { createClient } from "@/utils/supabase/server";
import { 
  refreshAccessToken, getCharacterWallet, getCharacterSkills, 
  getCharacterLocation, getCharacterShip, resolveNames,
  formatISK, formatNumber 
} from "@/utils/eve-api";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 模拟数据 (防止没登录时报错，方便你看效果)
  const charName = user?.user_metadata?.character_name || "Unknown Pilot";
  const charId = user?.user_metadata?.character_id || 1;
  let walletBalance = 0;
  let totalSP = 0;
  let shipName = "Capsule";
  let locationName = "Jita";
  let errorMsg = "";

  // 尝试获取真实数据
  try {
      if (user?.user_metadata?.eve_refresh_token) {
          const token = await refreshAccessToken(user.user_metadata.eve_refresh_token);
          const [w, s, l, sh] = await Promise.all([
              getCharacterWallet(charId, token),
              getCharacterSkills(charId, token),
              getCharacterLocation(charId, token),
              getCharacterShip(charId, token)
          ]);
          walletBalance = w;
          totalSP = s || 0;
          if (l || sh) {
              const names = await resolveNames([l, sh?.ship_type_id].filter(Boolean));
              locationName = names[l] || locationName;
              shipName = names[sh?.ship_type_id] || shipName;
          }
      }
  } catch (e) {
      console.error(e);
      errorMsg = "ESI Sync Error";
  }

  return (
    <div className="space-y-4">
      
      {/* 顶部面包屑区 */}
      <div className="bg-transparent p-4 flex justify-between items-center mb-2">
        <div>
            <h1 className="text-2xl text-[#333] font-normal">
                首页 <small className="text-xs text-gray-500 pl-1">仪表盘</small>
            </h1>
        </div>
        <div className="text-xs text-gray-500 bg-[#d2d6de] px-2 py-1 rounded-sm">
            Home &gt; Dashboard
        </div>
      </div>

      <div className="px-4">
          
          {/* 第一行卡片：按照截图布局 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* 1. 在线玩家 (白色背景) */}
            <div className="bg-white rounded-[3px] shadow-sm flex items-center p-2 min-h-[90px]">
                 <div className="bg-[#222d32] text-white w-[80px] h-[80px] flex items-center justify-center text-4xl rounded-[3px]">
                    <span className="text-3xl">🖥️</span>
                 </div>
                 <div className="pl-4">
                    <span className="block text-[13px] uppercase text-[#333]">在线玩家</span>
                    <span className="block text-xl font-bold text-[#333]">24655</span>
                 </div>
            </div>

            {/* 2. 链接的角色 (绿色背景) */}
            <InfoBox 
                bgColor="bg-[#00a65a]" // 绿色
                icon="🔑" 
                label="链接的角色" 
                value="1" 
                fullColor={true} // 全色模式
            />

            {/* 3. 总角色 ISK (蓝色背景) */}
            <InfoBox 
                bgColor="bg-[#3c8dbc]" // 蓝色 (SeAT Blue)
                icon="💵" 
                label="总角色 ISK" 
                value={formatISK(walletBalance)} 
                fullColor={true}
            />

            {/* 4. Total Mined (紫色背景) */}
            <InfoBox 
                bgColor="bg-[#605ca8]" // 紫色
                icon="💎" 
                label="Total Mined ISK (this month)" 
                value="0" 
                fullColor={true}
            />

            {/* 5. 技能点 (黑色/白色背景混搭) */}
            <div className="bg-white rounded-[3px] shadow-sm flex items-center min-h-[90px] overflow-hidden">
                 <div className="bg-black text-white w-[90px] h-[90px] flex items-center justify-center text-4xl">
                    🎓
                 </div>
                 <div className="pl-4 flex-1">
                    <span className="block text-[13px] uppercase text-[#333]">总角色技能点</span>
                    <span className="block text-xl font-bold text-[#333]">{formatNumber(totalSP)}</span>
                 </div>
            </div>

             {/* 6. 击杀报告 (红色背景) */}
             <InfoBox 
                bgColor="bg-[#dd4b39]" // 红色
                icon="🚀" 
                label="总击杀报告数量 (this month)" 
                value="15" 
                fullColor={true}
            />

          </div>

          {/* 第二行：图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 左：同时在线人数 */}
            <ChartBox title="同时在线人数" />

            {/* 右：ESI 响应时间 */}
            <ChartBox title="ESI 响应时间" />

          </div>
          
          {/* 第三行：技能详情 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <ChartBox title={`${charName} 的技能`} subTitle="每级的技能" />
              <ChartBox title={`${charName} 的技能`} subTitle="技能覆盖率 (百分比)" />
          </div>

      </div>
    </div>
  );
}

// AdminLTE 风格的 InfoBox
// fullColor=true 时，整个卡片都是那个颜色 (如绿色、蓝色卡片)
// fullColor=false 时，左边有色，右边白色 (如在线玩家卡片)
function InfoBox({ bgColor, icon, label, value, fullColor = false }: any) {
    if (fullColor) {
        return (
            <div className={`${bgColor} rounded-[3px] shadow-sm flex items-center min-h-[90px] text-white relative overflow-hidden`}>
                <div className="w-[90px] h-full flex items-center justify-center text-4xl bg-black/20 absolute left-0 top-0 bottom-0">
                    {icon}
                </div>
                <div className="pl-[100px] py-2 pr-2">
                    <span className="block text-[13px] uppercase opacity-90">{label}</span>
                    <span className="block text-xl font-bold mt-1">{value}</span>
                </div>
            </div>
        )
    }
    // 默认样式 (左侧图标，右侧白底)
    return (
        <div className="bg-white rounded-[3px] shadow-sm flex items-center min-h-[90px] overflow-hidden">
             <div className={`${bgColor} text-white w-[90px] h-full min-h-[90px] flex items-center justify-center text-4xl`}>
                {icon}
             </div>
             <div className="pl-4 flex-1">
                <span className="block text-[13px] uppercase text-[#333]">{label}</span>
                <span className="block text-xl font-bold text-[#333]">{value}</span>
             </div>
        </div>
    )
}

// AdminLTE 风格的 Chart Box (白底，带蓝线)
function ChartBox({ title, subTitle }: any) {
    return (
        <div className="bg-white border-t-[3px] border-[#d2d6de] shadow-sm rounded-t-[3px] rounded-b-[3px]">
            <div className="p-3 border-b border-[#f4f4f4] flex justify-between items-center">
                <h3 className="text-lg font-light text-[#444]">{title}</h3>
                {/* 最小化/关闭按钮模拟 */}
                <div className="flex gap-1">
                    <div className="w-3 h-1 bg-[#d2d6de]"></div>
                </div>
            </div>
            <div className="p-4 relative">
                {subTitle && <h4 className="text-right font-bold text-gray-600 mb-4">{subTitle}</h4>}
                
                {/* 模拟图表区域 */}
                <div className="h-[200px] w-full bg-[#fbfbfb] border border-dashed border-[#d2d6de] flex items-center justify-center text-[#999]">
                    [ Chart.js Canvas Placeholder ]
                </div>
            </div>
        </div>
    )
}