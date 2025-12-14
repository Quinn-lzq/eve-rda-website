// ./app/layout.tsx

// 导入标准的 Google Font (Inter)
// 注意：以下代码已注释，以绕过 Turbopack 字体模块错误。
// import { Inter } from 'next/font/google'; 
 
// 配置 Inter 字体
// const inter = Inter({ subsets: ['latin'] });
// const interClassName = inter.className; // 使用一个占位符变量

// 推荐：如果需要 Inter 字体，可以添加一个空的 className 或使用 'sans-serif' 占位
const interClassName = ''; 

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 将 className 设置为 'sans-serif' 或空字符串，以避免错误。
    // 如果你的CSS中已经定义了字体，这里使用 '' 即可。
    <html lang="zh" className={interClassName}> 
      <body>{children}</body>
    </html>
  );
}