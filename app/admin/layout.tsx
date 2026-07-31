import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-6">
        <Link href="/admin" className="font-bold text-lg">Control Room Admin</Link>
        <Link href="/admin" className="hover:text-blue-400">Dashboard</Link>
        <Link href="/admin/positions" className="hover:text-blue-400">Positions</Link>
        <Link href="/admin/schedule-times" className="hover:text-blue-400">Schedule Times</Link>
        <div className="flex-1" />
        <LogoutButton />
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}