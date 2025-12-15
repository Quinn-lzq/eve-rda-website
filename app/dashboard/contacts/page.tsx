// app/dashboard/contacts/page.tsx
export default function ContactsPage() {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-normal text-gray-800">联系人</h1>
            <span className="text-sm text-gray-500">关系网审计</span>
        </div>
    
        <div className="bg-white border-t-[3px] border-purple-400 p-8 rounded shadow-sm text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-bold text-gray-700">联系人功能开发中</h2>
            <p className="text-gray-500 mt-2">
                用于查看好友、黑名单及军团成员列表。
            </p>
        </div>
      </div>
    );
  }