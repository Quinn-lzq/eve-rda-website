'use client';

import { Home, Users, Briefcase, Package, Settings, Search, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const charName = user?.user_metadata?.character_name || 'Guest';
  const charId = user?.user_metadata?.character_id;

  return (
    // 背景色改为 #222d32 (SeAT 经典黑)
    <aside className="w-[230px] h-screen bg-[#222d32] text-[#b8c7ce] flex flex-col fixed left-0 top-0 z-50 font-sans text-sm transition-all duration-300">
      
      {/* 顶部 Logo 区域 (与 Header 高度一致) */}
      <div className="h-[50px] bg-[#367fa9] flex items-center justify-center text-white font-bold text-xl tracking-wider shadow-sm">
        <span className="font-light">Se</span><b>AT</b>
      </div>

      {/* 用户信息区域 */}
      <div className="p-4 flex items-start gap-3 mb-2">
        {charId ? (
           <img 
             src={`https://images.evetech.net/characters/${charId}/portrait?size=128`} 
             className="w-10 h-10 rounded-full border-2 border-gray-600/50 shadow-sm"
             alt="Avatar" 
           />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-500" />
        )}
        <div className="flex flex-col pt-1">
          <span className="font-semibold text-white truncate w-32 mb-1">{charName}</span>
          <div className="flex items-center gap-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#00a65a]"></span>
            <span>在线</span>
          </div>
        </div>
      </div>

      {/* 搜索框 (SeAT 风格) */}
      <div className="px-4 mb-4">
        <div className="relative bg-[#374850] rounded overflow-hidden flex items-center">
          <input 
            type="text" 
            placeholder="搜索..." 
            className="w-full bg-transparent border-none px-3 py-2 text-white text-xs focus:outline-none placeholder-[#687880]"
          />
          <button className="pr-3 text-[#687880] hover:text-white">
            <Search size={14} />
          </button>
        </div>
      </div>

      <div className="px-4 py-3 text-[10px] uppercase text-[#4b646f] font-bold bg-[#1a2226]">主菜单</div>

      {/* 菜单列表 */}
      <nav className="flex-1 overflow-y-auto">
        <MenuItem href="/dashboard" icon={<Home size={14} />} label="首页" currentPath={pathname} exact activeColor="bg-[#3c8dbc] border-[#3c8dbc]" />
        
        {/* 模拟截图里的菜单结构 */}
        <MenuItem href="/dashboard/calendar" icon={<Briefcase size={14} />} label="日历" currentPath={pathname} />
        <MenuItem href="/dashboard/assets" icon={<Package size={14} />} label="角色" currentPath={pathname} />
        <MenuItem href="/dashboard/corp" icon={<Users size={14} />} label="公司" currentPath={pathname} />
        
        <div className="mt-4 px-4 py-3 text-[10px] uppercase text-[#4b646f] font-bold bg-[#1a2226]">工具</div>
        <MenuItem href="/dashboard/settings" icon={<Settings size={14} />} label="设置" currentPath={pathname} />
      </nav>
    </aside>
  );
}

function MenuItem({ href, icon, label, currentPath, exact = false, activeColor = 'border-[#3c8dbc]' }: any) {
  const isActive = exact ? currentPath === href : currentPath.startsWith(href);

  return (
    <Link 
      href={href}
      className={`
        flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-l-[3px] text-[13px]
        ${isActive 
            ? `bg-[#1e282c] text-white ${activeColor}` // 激活状态
            : 'border-transparent hover:bg-[#1e282c] hover:text-white hover:border-transparent' // 普通状态
        }
      `}
    >
      <span className={isActive ? 'text-white' : 'text-[#b8c7ce]'}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}