"use client";
import { useEffect, useState } from "react";

interface Display {
  id: number;
  sport: string;
  game_date: string;
  display_type: string;
  ics_start: string;
  control_room_id: number | null;
  manual: number | null;
}

export default function AssignmentsPage() {
  const [displays, setDisplays] = useState<Display[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/displays");
    setDisplays(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const assign = async (displayId: number, controlRoomId: number) => {
    await fetch("/api/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayId, controlRoomId }),
    });
    load();
  };

  const clearPanel = async (controlRoomId: number, date: string) => {
    await fetch("/api/assign", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ controlRoomId, date }),
    });
    load();
  };

  const rebuild = async () => {
    await fetch("/api/rebuild", { method: "POST" });
    load();
  };

  // Group by date
  const byDate = displays.reduce<Record<string, Display[]>>((acc, d) => {
    (acc[d.game_date] ||= []).push(d);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Assignments</h1>
        <button onClick={rebuild} className="px-4 py-2 bg-green-600 rounded hover:bg-green-700">
          Rebuild Auto-Assignments
        </button>
      </div>

      {loading && <p>Loading…</p>}

      {Object.entries(byDate).sort().map(([date, list]) => (
        <div key={date} className="mb-8">
          <h2 className="text-xl font-bold mb-3 text-blue-400">{date}</h2>
          <table className="w-full bg-gray-900 rounded overflow-hidden">
            <thead className="bg-gray-800 text-left">
              <tr>
                <th className="p-3">Sport</th>
                <th className="p-3">Type</th>
                <th className="p-3">Panel</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(d => (
                <tr key={d.id} className="border-t border-gray-800">
                  <td className="p-3">{d.sport}</td>
                  <td className="p-3">{d.display_type}</td>
                  <td className="p-3">{d.control_room_id ?? "—"}</td>
                  <td className="p-3">
                    {d.control_room_id == null ? <span className="text-gray-500">unassigned</span>
                      : d.manual ? <span className="text-yellow-400">manual</span>
                      : <span className="text-green-400">auto</span>}
                  </td>
                  <td className="p-3">
                    <select
                      value={d.control_room_id ?? ""}
                      onChange={e => assign(d.id, Number(e.target.value))}
                      className="bg-gray-800 px-2 py-1 rounded"
                    >
                      <option value="">— assign —</option>
                      {[1,2,3,4].map(p => <option key={p} value={p}>Panel {p}</option>)}
                    </select>
                    {d.control_room_id && (
                      <button
                        onClick={() => clearPanel(d.control_room_id!, d.game_date)}
                        className="ml-2 px-2 py-1 bg-red-700 rounded text-sm hover:bg-red-800"
                      >
                        Clear
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}