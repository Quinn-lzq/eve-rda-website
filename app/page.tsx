// app/page.tsx
import AuthButton from "@/components/AuthButton"; // 这里不需要花括号 {}

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8 text-blue-400">EVE RDA System</h1>
      <AuthButton />
    </main>
  );
}