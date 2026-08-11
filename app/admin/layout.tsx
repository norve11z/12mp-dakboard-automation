import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e5e2]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .amdb-display { font-family: 'Oswald', 'Arial Narrow', sans-serif; }
        .amdb-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }
      `}</style>

      <nav className="bg-[#0a0a0a]/97 backdrop-blur border-b border-[#3d1414] px-6 flex items-center gap-7 sticky top-0 z-30">
        <Link href="/admin" className="flex items-baseline gap-3 py-4">
          <span className="amdb-display text-[17px] font-semibold uppercase tracking-wide text-[#c96060]">
            12th Man Productions
          </span>
          <span className="amdb-mono text-[10px] uppercase tracking-[0.22em] text-[#65656b]">
            PCR Panels
          </span>
        </Link>

        <div className="w-px h-5 bg-[#232326]" />

        <Link href="/admin/shifts"
          className="amdb-mono text-[11px] uppercase tracking-widest text-[#8a8a8f] hover:text-[#e7e5e2] transition-colors">
          Shifts
        </Link>
        <Link href="/admin/positions"
          className="amdb-mono text-[11px] uppercase tracking-widest text-[#8a8a8f] hover:text-[#e7e5e2] transition-colors">
          Positions
        </Link>
        <Link href="/admin/schedule-times"
          className="amdb-mono text-[11px] uppercase tracking-widest text-[#8a8a8f] hover:text-[#e7e5e2] transition-colors">
          Schedule Times
        </Link>
        <Link href="/admin/panel-rules"
          className="amdb-mono text-[11px] uppercase tracking-widest text-[#8a8a8f] hover:text-[#e7e5e2] transition-colors">
          Panel Rules
        </Link>

        <div className="flex-1" />

        <LogoutButton />
      </nav>

      <main className="p-6">{children}</main>
    </div>
  );
}
