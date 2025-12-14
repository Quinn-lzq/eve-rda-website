// components/Sidebar.tsx
import { Home, Users, Briefcase, Box, LayoutGrid, Settings, Search } from 'lucide-react';

export default function Sidebar({ user }: { user: any }) {
  const charName = user?.user_metadata?.character_name || 'Guest';
  const charId = user?.user_metadata?.character_id;

  return (
    <aside className="w-64 h-screen bg-[#222d32] text-[#b8c7ce] flex flex-col fixed left-0 top-0 z-50 font-sans text-sm">
      {/* 顶部：用户信息区域 */}
      <div className="p-4 flex items-center gap-3 bg-[#1a2226] mb-4">
        {charId ? (
           <img 
             src={`https://images.evetech.net/characters/${charId}/portrait?size=64`} 
             className="w-12 h-12 rounded-full border-2 border-gray-600"
             alt="Avatar" 
           />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-500" />
        )}
        <div className="flex flex-col">
          <span className="font-semibold text-white truncate w-32" title={charName}>{charName}</span>
          <div className="flex items-center gap-1 text-xs mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>在线</span>
          </div>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="px-4 mb-4">
        <div className="relative bg-[#374850] rounded overflow-hidden">
          <input 
            type="text" 
            placeholder="搜索..." 
            className="w-full bg-transparent border-none px-3 py-2 text-white focus:outline-none placeholder-gray-500"
          />
          <button className="absolute right-2 top-2 text-gray-400">
            <Search size={14} />
          </button>
        </div>
      </div>

      <div className="px-4 py-2 text-xs uppercase text-[#4b646f] font-bold">主菜单</div>

      {/* 菜单列表 */}
      <nav className="flex-1 overflow-y-auto">
        <MenuItem icon={<Home size={16} />} label="首页" active />
        <MenuItem icon={<LayoutGrid size={16} />} label="行动" />
        <MenuItem icon={<Users size={16} />} label="角色" hasSub />
        <MenuItem icon={<Briefcase size={16} />} label="公司" hasSub />
        <MenuItem icon={<Box size={16} />} label="快递管家" />
        <MenuItem icon={<Settings size={16} />} label="工具" hasSub />
      </nav>
    </aside>
  );
}

function MenuItem({ icon, label, active = false, hasSub }: any) {
  return (
    <div className={`
      flex items-center justify-between px-4 py-3 cursor-pointer transition-all border-l-4
      ${active 
        ? 'bg-[#1e282c] text-white border-[#3c8dbc]' 
        : 'hover:bg-[#1e282c] hover:text-white border-transparent text-[#b8c7ce]'}
    `}>
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {hasSub && <span className="text-[10px]">▼</span>}
    </div>
  );
}