// app/dashboard/market/page.tsx
export default function MarketPage() {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-normal text-gray-800">市场与合同</h1>
          <span className="text-sm text-gray-500">审计中心</span>
        </div>
  
        <div className="bg-white border-t-[3px] border-yellow-400 p-8 rounded shadow-sm text-center">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-xl font-bold text-gray-700">功能开发中</h2>
            <p className="text-gray-500 mt-2">
                市场订单与合同审计模块正在建设中。<br/>
                请稍后回来查看。
            </p>
        </div>
      </div>
    );
  }