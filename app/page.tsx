// app/page.tsx
import Header from "@/components/Header";

export default function Home() {
  return (
    // 设置全局深色背景，模拟 EVE 网站的风格
    <main className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="p-4 md:p-8">
        <h2 className="text-2xl font-bold text-blue-400 mb-4">欢迎加入资源开发管理总署！！</h2>
        {/* 首页内容区域 */}
      </div>
    </main>
  );
}