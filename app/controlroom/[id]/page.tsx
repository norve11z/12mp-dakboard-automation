import { getPanelState } from "@/lib/display-state";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ControlRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date } = await searchParams;
  const panel = parseInt(id, 10);
  if (!panel || panel < 1 || panel > 4) notFound();

  const state = await getPanelState(panel, date);

  return (
    <div className="w-screen h-screen bg-black text-white flex flex-col items-center overflow-hidden font-sans">
      {!state.hasContent ? (
        <Placeholder panel={panel} />
      ) : (
        <>
          <div className="w-full text-center pt-12 pb-4">
            <div className="text-6xl font-black tracking-tight">{state.title}</div>
            {state.opponent && (
              <div className="text-5xl font-bold mt-6 text-yellow-400">
                TEXAS A&M vs {state.opponent.toUpperCase()}
              </div>
            )}
            <div className="text-3xl mt-4 text-gray-300">{state.dateLabel}</div>
          </div>
          <div className="w-11/12 border-t-4 border-white my-6" />
          {state.schedule && state.schedule.length > 0 && (
            <>
              <div className="w-11/12 mb-6">
                <table className="w-full text-3xl font-bold">
                  <tbody>
                    {state.schedule.map((s, i) => (
                      <tr key={i} className="border-b border-gray-800">
                        <td className="py-1 pr-8 text-gray-300 w-1/2">{s.label.toUpperCase()}</td>
                        <td className="py-1 text-yellow-400">
                          {s.time || <span className="text-gray-600">TBD</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="w-11/12 border-t-4 border-white mb-6" />
            </>
          )}
          <div className="w-11/12 flex-1 overflow-hidden">
            <table className="w-full text-4xl font-bold">
              <tbody>
                {state.crew?.map((row, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-2 pr-8 text-gray-400 w-1/3">{row.short_label}</td>
                    <td className="py-2">
                      {row.names.length > 0 ? row.names.join(" / ") : <span className="text-gray-600">TBD</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Placeholder({ panel }: { panel: number }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="text-8xl font-black text-gray-700">PANEL {panel}</div>
      <div className="text-3xl text-gray-600 mt-8">No event scheduled</div>
    </div>
  );
}