"use client";
import { useEffect, useState } from "react";

interface GameInfo {
  id: number;
  sport: string;
  game_date: string;
  opponent: string | null;
  kickoff: string | null;
  notes: string | null;
}

interface Display {
  sport: string;
  game_date: string;
}

export default function GamesPage() {
  const [displays, setDisplays] = useState<Display[]>([]);
  const [games, setGames] = useState<GameInfo[]>([]);

  const load = async () => {
    const [d, g] = await Promise.all([
      fetch("/api/displays").then(r => r.json()),
      fetch("/api/game-info").then(r => r.json()),
    ]);
    setDisplays(d);
    setGames(g);
  };

  useEffect(() => { load(); }, []);

  const save = async (sport: string, game_date: string, opponent: string, kickoff: string, notes: string) => {
    await fetch("/api/game-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport, game_date, opponent, kickoff, notes }),
    });
    load();
  };

  // Unique (sport, date) pairs from displays
  const pairs = Array.from(new Set(displays.map(d => `${d.sport}|${d.game_date}`)))
    .map(k => { const [sport, game_date] = k.split("|"); return { sport, game_date }; })
    .sort((a, b) => a.game_date.localeCompare(b.game_date));

  const getGame = (sport: string, date: string) =>
    games.find(g => g.sport === sport && g.game_date === date);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Game Info</h1>
      <p className="text-gray-400 mb-4 text-sm">
        Set opponent, kickoff time, and notes per game. These are shown on the display pages.
      </p>

      <table className="w-full bg-gray-900 rounded overflow-hidden">
        <thead className="bg-gray-800 text-left">
          <tr>
            <th className="p-3">Date</th>
            <th className="p-3">Sport</th>
            <th className="p-3">Opponent</th>
            <th className="p-3">Kickoff</th>
            <th className="p-3">Notes</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {pairs.map(p => {
            const g = getGame(p.sport, p.game_date);
            return <GameRow key={`${p.sport}|${p.game_date}`} sport={p.sport} date={p.game_date} game={g} onSave={save} />;
          })}
        </tbody>
      </table>
    </div>
  );
}

function GameRow({
  sport, date, game, onSave
}: {
  sport: string;
  date: string;
  game?: GameInfo;
  onSave: (sport: string, date: string, opponent: string, kickoff: string, notes: string) => void;
}) {
  const [opponent, setOpponent] = useState(game?.opponent ?? "");
  const [kickoff, setKickoff] = useState(game?.kickoff ?? "");
  const [notes, setNotes] = useState(game?.notes ?? "");

  return (
    <tr className="border-t border-gray-800">
      <td className="p-2">{date}</td>
      <td className="p-2">{sport}</td>
      <td className="p-2">
        <input value={opponent} onChange={e => setOpponent(e.target.value)}
          className="bg-gray-800 px-2 py-1 rounded w-full" placeholder="e.g. LSU" />
      </td>
      <td className="p-2">
        <input value={kickoff} onChange={e => setKickoff(e.target.value)}
          className="bg-gray-800 px-2 py-1 rounded w-full" placeholder="ISO or time" />
      </td>
      <td className="p-2">
        <input value={notes} onChange={e => setNotes(e.target.value)}
          className="bg-gray-800 px-2 py-1 rounded w-full" />
      </td>
      <td className="p-2">
        <button onClick={() => onSave(sport, date, opponent, kickoff, notes)}
          className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700">Save</button>
      </td>
    </tr>
  );
}