// components/Header.tsx
'use client'; // <-- 必须保持 'use client'

import React from 'react';
import Link from 'next/link'; 
import dynamic from 'next/dynamic'; 

// 关键修复：使用命名导入 (.then(mod => mod.AuthButton))，
// 它对应于 AuthButton.tsx 中的 `export { AuthButton }`
const AuthButton = dynamic(() => import('./AuthButton').then(mod => mod.AuthButton), { ssr: false });

const navLinks = [
  { name: "军团简介", href: "/about" },
  { name: "如何加入我们", href: "/join" },
  { name: "军团守则", href: "/rules" },
  { name: "新手发展路线", href: "/newbie" },
  { name: "战舰补损系统", href: "/loss-system" }, 
  { name: "军团服务", href: "/services" },
];

const Header: React.FC = () => {
  return (
    <header className="shadow-xl border-b border-blue-600 relative"> 

      {/* 顶部 Logo 和英文标题区 */}
      <div className="py-8 px-4 text-center bg-cover bg-center bg-blue-950/70"
           style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7))' }}>

        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-200 tracking-wider">
          资源开发管理总署
        </h1>
        <p className="text-xl md:text-2xl mt-2 font-light text-cyan-300">
          Resources Development Administration
        </p>
        <span className="absolute top-2 right-4 text-white text-3xl font-serif opacity-80">EVE 曙光服</span>

        {/* 2. 在右侧添加登录按钮 */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6"> 
          <AuthButton /> 
        </div>

      </div>

      {/* 导航按钮区 */}
      <nav className="flex flex-wrap justify-center bg-gray-900 border-t border-b border-gray-700 p-2">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="text-white hover:bg-blue-600 bg-gray-700/50 transition duration-300 px-4 py-2 m-1 rounded-md text-sm md:text-base font-medium whitespace-nowrap"
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default Header;