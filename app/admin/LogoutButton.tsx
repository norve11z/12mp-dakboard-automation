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
      className="text-sm text-gray-400 hover:text-white"
    >
      Sign out
    </button>
  );
}