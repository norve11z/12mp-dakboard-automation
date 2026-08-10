"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/login", { method: "DELETE" });
        router.push("/");
      }}
      className="amdb-mono text-[11px] uppercase tracking-widest text-[#8a8a8f] hover:text-[#c96060] transition-colors"
    >
      Sign Out
    </button>
  );
}
