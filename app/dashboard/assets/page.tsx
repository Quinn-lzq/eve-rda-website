// app/dashboard/assets/page.tsx
import { createClient } from "@/utils/supabase/server";
import { refreshAccessToken, getCharacterAssets, resolveNames, formatNumber } from "@/utils/eve-api";

export const dynamic = 'force-dynamic';

export default async function AssetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>未登录</div>;

  const charId = user.user_metadata.character_id;
  const refreshToken = user.user_metadata.eve_refresh_token;
  
  let assets: any[] = [];
  let nameMap: Record<number, string> = {};

  try {
    if (refreshToken) {
      const accessToken = await refreshAccessToken(refreshToken);
      assets = await getCharacterAssets(charId, accessToken);
      
      // 收集所有需要解析的名字 (物品ID + 地点ID)
      const idsToResolve: number[] = [];
      assets.forEach(a => {
        idsToResolve.push(a.type_id);
        // ESI 的 location_id 有些是物品编号(放在箱子里)，有些是空间站ID
        // 这里简单处理，只解析可能是空间站的大数字
        if (a.location_id > 60000000) idsToResolve.push(a.location_id);
      });

      nameMap = await resolveNames(idsToResolve);
    }
  } catch (e) {
    console.error("Assets Error:", e);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-normal text-gray-800">资产审计</h1>
        <span className="text-sm text-gray-500">显示前 50 项高价值/堆叠资产</span>
      </div>

      <div className="bg-white border-t-[3px] border-blue-500 shadow-sm rounded-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b">
            <tr>
              <th className="px-6 py-3">物品 (Type)</th>
              <th className="px-6 py-3">数量</th>
              <th className="px-6 py-3">位置 (Location)</th>
              <th className="px-6 py-3">Flag (位置类型)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assets.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-400">暂无资产数据或获取失败</td></tr>
            ) : (
              assets.map((item, idx) => {
                const itemName = nameMap[item.type_id] || `Type ${item.type_id}`;
                const locationName = nameMap[item.location_id] || `Location ${item.location_id}`;
                
                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 flex items-center gap-3">
                      <img 
                        src={`https://images.evetech.net/types/${item.type_id}/icon?size=32`} 
                        alt="" 
                        className="w-8 h-8 rounded bg-gray-900 border border-gray-600"
                      />
                      <span className="font-semibold text-gray-700">{itemName}</span>
                    </td>
                    <td className="px-6 py-3 font-mono text-gray-600">{formatNumber(item.quantity)}</td>
                    <td className="px-6 py-3 text-gray-600 truncate max-w-xs" title={locationName}>
                      {locationName}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-400">{item.location_flag}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}