import { getPanelState } from "@/lib/display-state";
import { notFound } from "next/navigation";
import AutoRefresh from "./AutoRefresh";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    <div className="w-screen h-screen bg-black text-white flex flex-col overflow-hidden font-sans">
      <AutoRefresh intervalMs={12 * 60 * 60 * 1000} />

      {!state.hasContent ? (
        <Placeholder panel={panel} />
      ) : (
        <>
          {/* =========================================================
              HEADER
          ========================================================= */}
          <header className="w-full shrink-0">
            {/* Top A&M / 12th Man bar */}
            <div className="h-5 w-full bg-[#500000]" />

            <div className="px-10 pt-8 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold tracking-[0.35em] text-gray-500 uppercase">
                    Texas A&M Athletics
                  </div>

                  <div className="text-2xl font-black tracking-[0.18em] uppercase text-white mt-1">
                    12th Man Productions
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold tracking-[0.3em] text-gray-600 uppercase">
                    Production Staff
                  </div>
                  <div className="text-lg font-bold text-[#a7a9ac]">
                    PANEL {panel}
                  </div>
                </div>
              </div>
            </div>

            {/* =======================================================
                MATCHUP
            ======================================================= */}
            <div className="px-8 mt-4">
              <div className="rounded-2xl border border-[#3a0a0a] bg-gradient-to-b from-[#160000] to-black overflow-hidden">
                {/* Sport */}
                <div className="px-6 pt-5 text-center">
                  <div className="inline-block text-sm font-black tracking-[0.35em] uppercase text-[#b7b9bc]">
                    {state.title}
                  </div>
                </div>

                {/* Teams / logos */}
                <div className="flex items-center justify-center gap-6 px-5 py-7">
                  {/* Texas A&M */}
                  <div className="w-[30%] flex justify-center items-center">
                    <div className="w-32 h-32 flex items-center justify-center">
                      <img
                        src="/tamu-logo.png"
                        alt="Texas A&M"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Matchup */}
                  <div className="flex-1 text-center min-w-0">
                    <div className="text-5xl font-black tracking-tight leading-none">
                      TEXAS A&M
                    </div>

                    {state.opponent && (
                      <>
                        <div className="flex items-center justify-center gap-4 my-3">
                          <div className="h-[3px] w-10 bg-[#500000]" />
                          <div className="text-2xl font-black text-[#a7a9ac]">
                            VS
                          </div>
                          <div className="h-[3px] w-10 bg-[#500000]" />
                        </div>

                        <div className="text-5xl font-black tracking-tight leading-none text-[#f0f0f0]">
                          {state.opponent.toUpperCase()}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Opponent logo */}
                  <div className="w-[30%] flex justify-center items-center">
                    {state.logoUrl ? (
                      <div className="w-32 h-32 flex items-center justify-center">
                        <img
                          src={state.logoUrl}
                          alt={state.opponent ?? "Opponent"}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-full border-2 border-gray-800 flex items-center justify-center">
                        <span className="text-xs font-bold tracking-widest text-gray-700 uppercase">
                          Opponent
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="border-t border-[#300000] bg-[#0c0000] px-6 py-4 text-center">
                  <div className="text-2xl font-bold tracking-wide text-gray-300">
                    {state.dateLabel}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* =========================================================
              MAIN CONTENT
          ========================================================= */}
          <main className="w-full flex-1 min-h-0 px-8 pb-8 flex flex-col">
            {/* =======================================================
                SCHEDULE
            ======================================================= */}
            {state.schedule && state.schedule.length > 0 && (
              <section className="mt-7 shrink-0">
                <SectionHeader title="Game Schedule" />

                <div className="mt-3 rounded-xl border border-gray-900 overflow-hidden">
                  <table className="w-full text-2xl font-bold">
                    <tbody>
                      {state.schedule.map((s, i) => (
                        <tr
                          key={i}
                          className={`${
                            i !== state.schedule!.length - 1
                              ? "border-b border-gray-900"
                              : ""
                          } bg-[#080808]`}
                        >
                          <td className="py-3 px-5 text-gray-400 uppercase tracking-wide w-1/2">
                            {s.label}
                          </td>

                          <td className="py-3 px-5 text-right text-[#f1c40f]">
                            {s.time || (
                              <span className="text-gray-700">
                                TBD
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* =======================================================
                CREW
            ======================================================= */}
            <section className="mt-7 flex-1 min-h-0 overflow-hidden">
              <SectionHeader title="Production Staff" />

              <div className="mt-3 h-full overflow-hidden rounded-xl border border-gray-900">
                <table className="w-full text-2xl font-bold">
                  <tbody>
                    {state.sport === "Football" && (
                      <tr className="border-b border-gray-900 bg-[#080808]">
                        <td className="py-3 px-5 text-[#a7a9ac] uppercase tracking-wide w-[34%] align-top">
                          Game Producer
                        </td>

                        <td className="py-3 px-5 text-white align-top">
                          Buddy
                        </td>
                      </tr>
                    )}
                    {state.crew
                      ?.filter((r) => r.names.length > 0)
                      .map((row, i) => (
                        <tr
                          key={i}
                          className={`${
                            i !==
                            state.crew!.filter(
                              (r) => r.names.length > 0
                            ).length -
                              1
                              ? "border-b border-gray-900"
                              : ""
                          } bg-[#080808]`}
                        >
                          <td className="py-3 px-5 text-[#a7a9ac] uppercase tracking-wide w-[34%] align-top">
                            {row.short_label}
                          </td>

                          <td className="py-3 px-5 text-white align-top">
                            {row.names.join(" | ")}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>

          {/* =========================================================
              FOOTER ACCENT
          ========================================================= */}
          <div className="h-5 w-full bg-[#500000] shrink-0" />
        </>
      )}
    </div>
  );
}


/* ===============================================================
   SECTION HEADER
   =============================================================== */

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-8 w-2 rounded-full bg-[#500000]" />

      <div className="text-xl font-black tracking-[0.22em] uppercase text-white">
        {title}
      </div>

      <div className="flex-1 h-px bg-gray-900" />
    </div>
  );
}


/* ===============================================================
   EMPTY PANEL
   =============================================================== */

function Placeholder({ panel }: { panel: number }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
      <div className="h-5 w-full bg-[#500000] absolute top-0 left-0" />

      <div className="text-center">
        <div className="text-sm font-bold tracking-[0.4em] text-gray-600 uppercase mb-4">
          Texas A&M Athletics
        </div>

        <div className="text-7xl font-black tracking-tight text-gray-700">
          PANEL {panel}
        </div>

        <div className="mt-6 text-2xl font-bold tracking-widest uppercase text-gray-600">
          No event scheduled
        </div>
      </div>

      <div className="h-5 w-full bg-[#500000] absolute bottom-0 left-0" />
    </div>
  );
}