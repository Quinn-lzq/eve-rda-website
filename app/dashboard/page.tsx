// app/dashboard/page.tsx
import { createClient } from "@/utils/supabase/server";
import Link from "next/link"; // 👈 记得导入 Link
import { 
  refreshAccessToken, 
  getCharacterWallet, getCharacterSkills, getCharacterLocation, getCharacterShip,
  getSkillQueue, getWalletJournal, resolveNames,
  formatISK, formatNumber 
} from "@/utils/eve-api";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Please Log In</div>;

  const charName = user.user_metadata.character_name;
  const charId = user.user_metadata.character_id;
  const refreshToken = user.user_metadata.eve_refresh_token;

  // 默认数据
  let walletBalance = 0;
  let totalSP = 0;
  let locationName = "N/A";
  let shipName = "N/A";
  let shipTypeId = 670;
  let activeSkillName = "无训练中技能";
  let skillProgress = 0;
  let skillEndTime = "";
  let recentTransactions: any[] = [];

  try {
    if (refreshToken) {
      const accessToken = await refreshAccessToken(refreshToken);
      
      const [walletData, spData, locId, shipData, skillData, journalData] = await Promise.all([
        getCharacterWallet(charId, accessToken),
        getCharacterSkills(charId, accessToken),
        getCharacterLocation(charId, accessToken),
        getCharacterShip(charId, accessToken),
        getSkillQueue(charId, accessToken),
        getWalletJournal(charId, accessToken)
      ]);

      walletBalance = walletData;
      totalSP = spData || 0;
      if (shipData) shipTypeId = shipData.ship_type_id;

      const idsToResolve: number[] = [];
      if (locId) idsToResolve.push(locId);
      if (shipTypeId) idsToResolve.push(shipTypeId);
      if (skillData?.skill_id) idsToResolve.push(skillData.skill_id);
      journalData?.forEach((t: any) => {
        if (t.first_party_id) idsToResolve.push(t.first_party_id);
        if (t.second_party_id) idsToResolve.push(t.second_party_id);
      });

      const namesMap = await resolveNames(idsToResolve);

      if (locId) locationName = namesMap[locId];
      if (shipTypeId) shipName = namesMap[shipTypeId];
      
      if (skillData) {
        activeSkillName = `${namesMap[skillData.skill_id] || 'Unknown Skill'} (${skillData.finished_level}级)`;
        const start = new Date(skillData.start_date).getTime();
        const end = new Date(skillData.finish_date).getTime();
        const now = Date.now();
        skillProgress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
        skillEndTime = new Date(skillData.finish_date).toLocaleString();
      }

      recentTransactions = journalData.map((t: any) => ({
        ...t,
        desc: namesMap[t.second_party_id] || 'Unknown',
        partyName: t.amount > 0 ? namesMap[t.first_party_id] : namesMap[t.second_party_id]
      }));

    }
  } catch (e) {
    console.error("ESI Error:", e);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 顶部标题 */}
      <div className="flex items-baseline gap-2 mb-2">
        <h1 className="text-2xl font-normal text-gray-800">指挥中心</h1>
        <span className="text-sm text-gray-500"> / 仪表盘</span>
      </div>

      {/* 1. 概览卡片 (Info Boxes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <InfoBox color="bg-[#00c0ef]" icon="📍" label="当前位置" value={locationName} sub="Tranquility" />
        
        <div className="bg-white rounded-sm shadow-sm flex overflow-hidden group hover:shadow-md transition-shadow">
            <div className="bg-[#00a65a] w-[90px] flex items-center justify-center p-2">
                <img src={`https://images.evetech.net/types/${shipTypeId}/render?size=64`} alt={shipName} className="w-12 h-12 object-contain filter drop-shadow-lg group-hover:scale-110 transition-transform" />
            </div>
            <div className="p-3 flex-1 flex flex-col justify-center min-w-0">
                <span className="block text-sm uppercase text-gray-500 font-medium">驾驶舰船</span>
                <span className="block text-lg font-bold text-gray-800 my-1 truncate" title={shipName}>{shipName}</span>
            </div>
        </div>
        
        <InfoBox color="bg-[#f39c12]" icon="💳" label="钱包余额" value={formatISK(walletBalance)} sub="ISK" />
        <InfoBox color="bg-[#dd4b39]" icon="🎓" label="总技能点" value={formatNumber(totalSP)} sub="SP" />
      </div>

      {/* 🔥 新增：快捷入口 (Quick Links) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
         <Link href="/dashboard/assets" className="group block">
            <div className="bg-white border-l-4 border-green-500 p-4 shadow-sm rounded-sm flex items-center justify-between hover:bg-green-50 transition-colors">
                <div>
                    <h3 className="font-bold text-gray-700 group-hover:text-green-700">📦 资产管理</h3>
                    <p className="text-xs text-gray-500 mt-1">查看仓库物资与舰船</p>
                </div>
                <span className="text-2xl text-green-200 group-hover:text-green-500">➔</span>
            </div>
         </Link>

         <Link href="/dashboard/market" className="group block">
            <div className="bg-white border-l-4 border-blue-500 p-4 shadow-sm rounded-sm flex items-center justify-between hover:bg-blue-50 transition-colors">
                <div>
                    <h3 className="font-bold text-gray-700 group-hover:text-blue-700">⚖️ 市场与合同</h3>
                    <p className="text-xs text-gray-500 mt-1">审计订单与交易合同</p>
                </div>
                <span className="text-2xl text-blue-200 group-hover:text-blue-500">➔</span>
            </div>
         </Link>

         <Link href="/dashboard/contacts" className="group block">
            <div className="bg-white border-l-4 border-purple-500 p-4 shadow-sm rounded-sm flex items-center justify-between hover:bg-purple-50 transition-colors">
                <div>
                    <h3 className="font-bold text-gray-700 group-hover:text-purple-700">👥 联系人</h3>
                    <p className="text-xs text-gray-500 mt-1">查看好友与声望</p>
                </div>
                <span className="text-2xl text-purple-200 group-hover:text-purple-500">➔</span>
            </div>
         </Link>
      </div>

      {/* 下方功能区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 技能训练队列 */}
        <div className="bg-white border-t-[3px] border-[#3c8dbc] shadow-sm rounded-sm p-4">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h3 className="text-lg font-light text-gray-700">🎓 技能训练中</h3>
                <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded">实时同步</span>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center border">
                    <span className="text-2xl">📚</span>
                </div>
                <div>
                    <div className="font-bold text-gray-800">{activeSkillName}</div>
                    <div className="text-xs text-gray-500">完成时间: {skillEndTime || '暂停中'}</div>
                </div>
            </div>

            <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                    <span className="text-xs font-semibold inline-block text-blue-600">进度</span>
                    <span className="text-xs font-semibold inline-block text-blue-600">{skillProgress.toFixed(1)}%</span>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                    <div style={{ width: `${skillProgress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-1000"></div>
                </div>
            </div>
        </div>

        {/* 钱包审计日志 */}
        <div className="bg-white border-t-[3px] border-[#f39c12] shadow-sm rounded-sm p-4">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h3 className="text-lg font-light text-gray-700">💸 最近交易 (RDA审计)</h3>
            </div>
            <div className="space-y-3">
                {recentTransactions.length === 0 ? (
                    <div className="text-gray-400 text-sm text-center py-4">无近期交易记录</div>
                ) : (
                    recentTransactions.map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0">
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-700">{t.partyName || 'Market/System'}</span>
                                <span className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString()} · {t.ref_type}</span>
                            </div>
                            <span className={`font-mono font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {t.amount > 0 ? '+' : ''}{formatISK(t.amount)}
                            </span>
                        </div>
                    ))
                )}
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
                <span className="block text-lg font-bold text-gray-800 my-1 truncate" title={String(value)}>{value}</span>
                {sub && <div className="text-xs text-gray-400 border-t pt-1 mt-1 truncate">{sub}</div>}
            </div>
        </div>
    )
}