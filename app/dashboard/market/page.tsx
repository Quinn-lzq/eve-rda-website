// app/dashboard/market/page.tsx
import { createClient } from "@/utils/supabase/server";
import { 
  refreshAccessToken, 
  getCharacterOrders, 
  getCharacterContracts, 
  resolveNames, 
  formatISK, 
  formatNumber 
} from "@/utils/eve-api";

export const dynamic = 'force-dynamic';

export default async function MarketPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>未登录</div>;

  const charId = user.user_metadata.character_id;
  const refreshToken = user.user_metadata.eve_refresh_token;

  let orders: any[] = [];
  let contracts: any[] = [];
  let nameMap: Record<number, string> = {};

  try {
    if (refreshToken) {
      const accessToken = await refreshAccessToken(refreshToken);
      
      // 1. 并行获取订单和合同
      const [ordersData, contractsData] = await Promise.all([
        getCharacterOrders(charId, accessToken),
        getCharacterContracts(charId, accessToken)
      ]);

      orders = ordersData || [];
      contracts = contractsData || [];

      // 2. 收集需要解析名字的 ID
      const idsToResolve: number[] = [];

      // 收集市场物品和地点
      orders.forEach(o => {
        idsToResolve.push(o.type_id);
        if (o.location_id > 60000000) idsToResolve.push(o.location_id);
      });

      // 收集合同相关 (接收人、发起人)
      contracts.forEach(c => {
        if (c.assignee_id > 0) idsToResolve.push(c.assignee_id); // 接收人
        if (c.issuer_id > 0) idsToResolve.push(c.issuer_id);     // 发起人
        if (c.acceptor_id > 0) idsToResolve.push(c.acceptor_id); // 接受人
      });

      // 3. 批量解析名字
      nameMap = await resolveNames(idsToResolve);
    }
  } catch (e) {
    console.error("Market/Contract Error:", e);
  }

  // 辅助函数：判断合同状态颜色
  const getContractStatusColor = (status: string) => {
      switch(status) {
          case 'outstanding': return 'bg-yellow-100 text-yellow-800'; // 进行中
          case 'finished': return 'bg-green-100 text-green-800';     // 完成
          case 'rejected': return 'bg-red-100 text-red-800';         // 拒绝
          case 'deleted': return 'bg-gray-100 text-gray-800';        // 删除
          default: return 'bg-gray-50 text-gray-600';
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-normal text-gray-800">市场与合同</h1>
        <span className="text-sm text-gray-500">财务审计</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* === 左侧：市场订单 === */}
        <div className="bg-white border-t-[3px] border-blue-500 shadow-sm rounded-sm">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-light text-gray-700">🛒 市场订单 (Active Orders)</h3>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{orders.length} 单</span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase">
                        <tr>
                            <th className="px-4 py-3">物品</th>
                            <th className="px-4 py-3 text-right">价格</th>
                            <th className="px-4 py-3 text-center">类型</th>
                            <th className="px-4 py-3 text-right">剩余量</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {orders.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">无活跃市场订单</td></tr>
                        ) : (
                            orders.map((order, i) => {
                                const isBuy = order.is_buy_order;
                                const typeName = nameMap[order.type_id] || `Type ${order.type_id}`;
                                return (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                            <div className="font-semibold text-gray-700">{typeName}</div>
                                            <div className="text-xs text-gray-400 truncate w-32" title={nameMap[order.location_id]}>
                                                {nameMap[order.location_id] || order.location_id}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono text-gray-600">
                                            {formatISK(order.price)}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`text-[10px] px-2 py-1 rounded ${isBuy ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {isBuy ? '收购' : '出售'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right text-xs">
                                            {formatNumber(order.volume_remain)} / {formatNumber(order.volume_total)}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* === 右侧：合同 === */}
        <div className="bg-white border-t-[3px] border-purple-500 shadow-sm rounded-sm">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-light text-gray-700">📜 合同记录 (Contracts)</h3>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{contracts.length} 条</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase">
                        <tr>
                            <th className="px-4 py-3">说明</th>
                            <th className="px-4 py-3">类型 / 接收人</th>
                            <th className="px-4 py-3 text-right">金额 (ISK)</th>
                            <th className="px-4 py-3 text-center">状态</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {contracts.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">无合同记录</td></tr>
                        ) : (
                            contracts.slice(0, 15).map((contract, i) => { // 只显示前15条
                                const assigneeName = contract.assignee_id === 0 ? 'Public (公开)' : (nameMap[contract.assignee_id] || contract.assignee_id);
                                const isFree = contract.price === 0 && contract.reward === 0;
                                
                                return (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                            <div className="font-semibold text-gray-700 truncate w-40" title={contract.title}>
                                                {contract.title || '(无标题)'}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(contract.date_issued).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="text-xs font-bold text-gray-600 uppercase">{contract.type.replace('_', ' ')}</div>
                                            <div className="text-xs text-blue-500 truncate w-24" title={String(assigneeName)}>
                                                To: {assigneeName}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono">
                                            {contract.type === 'courier' ? (
                                                <span className="text-green-600">+{formatISK(contract.reward)}</span>
                                            ) : (
                                                <span className={isFree ? 'text-red-500 font-bold' : 'text-gray-600'}>
                                                    {formatISK(contract.price)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`text-[10px] px-2 py-1 rounded uppercase ${getContractStatusColor(contract.status)}`}>
                                                {contract.status}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
}