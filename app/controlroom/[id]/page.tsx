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
    <div className="control-room w-screen h-screen bg-black text-white flex flex-col overflow-hidden font-sans">
      <AutoRefresh intervalMs={12 * 60 * 60 * 1000} />

      <style>{`
        .control-room {
          --panel-height: 100vh;
        }

        /* =========================================================
           HEADER
           ========================================================= */

        .header-padding {
          padding-left: clamp(18px, 3vw, 36px);
          padding-right: clamp(18px, 3vw, 36px);
          padding-top: clamp(8px, 0.9vh, 18px);
          padding-bottom: clamp(5px, 0.55vh, 11px);
        }

        .eyebrow-text {
          font-size: clamp(9px, 0.95vh, 18px);
        }

        .header-title {
          font-size: clamp(15px, 1.55vh, 30px);
        }

        .panel-label {
          font-size: clamp(8px, 0.75vh, 14px);
        }

        .panel-number {
          font-size: clamp(13px, 1.25vh, 24px);
        }

        .matchup-margin {
          margin-left: clamp(18px, 2.7vw, 32px);
          margin-right: clamp(18px, 2.7vw, 32px);
          margin-top: clamp(3px, 0.35vh, 7px);
        }

        .matchup-top {
          padding-top: clamp(6px, 0.65vh, 13px);
        }

        .sport-title {
          font-size: clamp(9px, 0.9vh, 17px);
        }

        .matchup-teams {
          padding-top: clamp(8px, 0.85vh, 17px);
          padding-bottom: clamp(8px, 0.85vh, 17px);
        }

        /* Larger logos */
        .team-logo {
          width: clamp(90px, 10.5vh, 190px);
          height: clamp(90px, 10.5vh, 190px);
        }

        .team-name {
          font-size: clamp(25px, 3.05vh, 58px);
        }

        .vs-text {
          font-size: clamp(14px, 1.55vh, 29px);
        }

        .matchup-divider {
          gap: clamp(7px, 0.7vh, 14px);
          margin-top: clamp(4px, 0.4vh, 8px);
          margin-bottom: clamp(4px, 0.4vh, 8px);
        }

        .date-bar {
          padding-top: clamp(6px, 0.6vh, 12px);
          padding-bottom: clamp(6px, 0.6vh, 12px);
        }

        .date-text {
          font-size: clamp(14px, 1.5vh, 29px);
        }

        .opponent-placeholder {
          font-size: clamp(8px, 0.7vh, 13px);
        }

        /* =========================================================
           MAIN CONTENT
           ========================================================= */

        .main-content {
          padding-left: clamp(18px, 2.7vw, 32px);
          padding-right: clamp(18px, 2.7vw, 32px);
          padding-bottom: clamp(5px, 0.65vh, 12px);
        }

        .schedule-section {
          margin-top: clamp(6px, 0.65vh, 13px);
        }

        .crew-section {
          margin-top: clamp(6px, 0.65vh, 13px);
        }

        /* =========================================================
           SECTION HEADERS
           ========================================================= */

        .section-header {
          gap: clamp(7px, 0.65vh, 13px);
        }

        .section-accent {
          height: clamp(19px, 1.85vh, 36px);
          width: clamp(3px, 0.3vh, 6px);
        }

        .section-title {
          font-size: clamp(15px, 1.8vh, 34px);
        }

        .section-line {
          height: 1px;
        }

        /* =========================================================
           SCHEDULE
           ========================================================= */

        .schedule-text {
          font-size: clamp(15px, 1.75vh, 33px);
        }

        .schedule-cell {
          padding-top: clamp(4px, 0.45vh, 9px);
          padding-bottom: clamp(4px, 0.45vh, 9px);
          padding-left: clamp(9px, 1vw, 16px);
          padding-right: clamp(9px, 1vw, 16px);
          line-height: 1.1;
        }

        /* =========================================================
           CREW / PRODUCTION STAFF

           This is intentionally larger than the schedule.
           Reduced vertical padding lets the bigger names fit.
           ========================================================= */

        .crew-text {
          font-size: clamp(18px, 2.15vh, 41px);
        }

        .crew-cell {
          padding-top: clamp(3px, 0.38vh, 7px);
          padding-bottom: clamp(3px, 0.38vh, 7px);
          padding-left: clamp(9px, 1vw, 16px);
          padding-right: clamp(9px, 1vw, 16px);
          line-height: 1.08;
        }

        /* =========================================================
           FOOTER
           ========================================================= */

        .footer-accent {
          height: clamp(6px, 0.6vh, 12px);
        }

        /* =========================================================
           1080 x 1920 VERTICAL DISPLAY

           At the intended 1920px height, prioritize crew text
           while keeping the total layout inside the screen.
           ========================================================= */

        @media (min-height: 1600px) {
          .header-padding {
            padding-top: 10px;
            padding-bottom: 6px;
          }

          .matchup-teams {
            padding-top: 9px;
            padding-bottom: 9px;
          }

          .team-logo {
            width: 180px;
            height: 180px;
          }

          .team-name {
            font-size: 56px;
          }

          .date-bar {
            padding-top: 7px;
            padding-bottom: 7px;
          }

          .date-text {
            font-size: 28px;
          }

          .schedule-section {
            margin-top: 9px;
          }

          .schedule-text {
            font-size: 32px;
          }

          .schedule-cell {
            padding-top: 5px;
            padding-bottom: 5px;
          }

          .crew-section {
            margin-top: 9px;
          }

          /* Larger crew names / positions */
          .crew-text {
            font-size: 40px;
          }

          /* Tight rows so large text still fits */
          .crew-cell {
            padding-top: 4px;
            padding-bottom: 4px;
            line-height: 1.05;
          }

          .section-title {
            font-size: 34px;
          }
        }

        /* =========================================================
           SHORTER VERTICAL DISPLAYS

           If the display is shorter than the intended 1920px,
           automatically scale the content down slightly.
           ========================================================= */

        @media (max-height: 1600px) {
          .team-logo {
            width: 120px;
            height: 120px;
          }

          .team-name {
            font-size: clamp(24px, 3vh, 48px);
          }

          .crew-text {
            font-size: clamp(16px, 2vh, 32px);
          }
        }

        @media (max-height: 1200px) {
          .team-logo {
            width: 90px;
            height: 90px;
          }

          .team-name {
            font-size: 25px;
          }

          .matchup-teams {
            padding-top: 6px;
            padding-bottom: 6px;
          }

          .crew-text {
            font-size: 18px;
          }

          .crew-cell {
            padding-top: 3px;
            padding-bottom: 3px;
          }
        }
      `}</style>

      {!state.hasContent ? (
        <Placeholder panel={panel} />
      ) : (
        <>
          {/* =========================================================
              HEADER
          ========================================================= */}
          <header className="w-full shrink-0">
            {/* Top A&M / 12th Man bar */}
            <div className="h-[clamp(6px,0.6vh,12px)] w-full bg-[#500000]" />

            <div className="header-padding">
              <div className="flex items-center justify-between">
                <div>
                  <div className="eyebrow-text font-bold tracking-[0.3em] text-[#8f9398] uppercase">
                    Texas A&M Athletics
                  </div>

                  <div className="header-title font-black tracking-[0.16em] uppercase text-white mt-1">
                    12th Man Productions
                  </div>
                </div>

                <div className="text-right">
                  <div className="panel-label font-bold tracking-[0.25em] text-[#85898e] uppercase">
                    Production Staff
                  </div>

                  <div className="panel-number font-bold text-[#d0d2d4]">
                    PANEL {panel}
                  </div>
                </div>
              </div>
            </div>

            {/* =======================================================
                MATCHUP
            ======================================================= */}
            <div className="matchup-margin">
              <div className="rounded-xl border border-[#551010] bg-gradient-to-b from-[#1e0000] via-[#100000] to-black overflow-hidden">
                {/* Sport */}
                <div className="matchup-top text-center">
                  <div className="sport-title inline-block font-black tracking-[0.3em] uppercase text-[#d0d2d4]">
                    {state.title}
                  </div>
                </div>

                {/* Teams / logos */}
                <div className="flex items-center justify-center gap-3 matchup-teams">
                  {/* Texas A&M */}
                  <div className="w-[28%] flex justify-center items-center">
                    <div className="team-logo flex items-center justify-center">
                      <img
                        src="https://a.espncdn.com/i/teamlogos/ncaa/500/245.png"
                        alt="Texas A&M"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Matchup */}
                  <div className="flex-1 text-center min-w-0">
                    <div className="team-name font-black tracking-tight leading-none text-white">
                      TEXAS A&M
                    </div>

                    {state.opponent && (
                      <>
                        <div className="flex items-center justify-center matchup-divider">
                          <div className="h-[2px] w-8 bg-[#700000]" />

                          <div className="vs-text font-black text-[#c4c6c8]">
                            VS
                          </div>

                          <div className="h-[2px] w-8 bg-[#700000]" />
                        </div>

                        <div className="team-name font-black tracking-tight leading-none text-[#f5f5f5]">
                          {state.opponent.toUpperCase()}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Opponent logo */}
                  <div className="w-[28%] flex justify-center items-center">
                    {state.logoUrl ? (
                      <div className="team-logo flex items-center justify-center">
                        <img
                          src={state.logoUrl}
                          alt={state.opponent ?? "Opponent"}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="team-logo rounded-full border-2 border-[#333] flex items-center justify-center">
                        <span className="opponent-placeholder font-bold tracking-widest text-[#666] uppercase">
                          Opponent
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="border-t border-[#481111] bg-[#160000] date-bar text-center">
                  <div className="date-text font-bold tracking-wide text-[#e2e2e2]">
                    {state.dateLabel}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* =========================================================
              MAIN CONTENT
          ========================================================= */}
          <main className="w-full flex-1 min-h-0 main-content flex flex-col">
            {/* =======================================================
                SCHEDULE
            ======================================================= */}
            {state.schedule && state.schedule.length > 0 && (
              <section className="schedule-section shrink-0">
                <SectionHeader title="Game Schedule" />

                <div className="mt-1 rounded-lg border border-[#2b2b2b] overflow-hidden">
                  <table className="w-full schedule-text font-bold">
                    <tbody>
                      {state.schedule.map((s, i) => (
                        <tr
                          key={i}
                          className="border-b border-[#2b2b2b] bg-[#101010] last:border-b-0"
                        >
                          <td className="schedule-cell text-[#c9cbcd] uppercase tracking-wide w-1/2">
                            {s.label}
                          </td>

                          <td className="schedule-cell text-right text-[#ffd21a]">
                            {s.time || (
                              <span className="text-[#777]">
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
            <section className="crew-section flex-1 min-h-0 overflow-hidden">
              <SectionHeader title="Production Staff" />

              <div className="mt-1 h-full overflow-hidden rounded-lg border border-[#2b2b2b]">
                <table className="w-full crew-text font-bold">
                  <tbody>
                    {state.sport === "Football" && (
                      <tr className="border-b border-[#2b2b2b] bg-[#101010]">
                        <td className="crew-cell text-[#c9cbcd] uppercase tracking-wide w-[34%] align-top">
                          Game Producer
                        </td>

                        <td className="crew-cell text-white align-top">
                          Buddy
                        </td>
                      </tr>
                    )}

                    {state.crew
                      ?.filter((r) => r.names.length > 0)
                      .map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-[#2b2b2b] bg-[#101010] last:border-b-0"
                        >
                          <td className="crew-cell text-[#c9cbcd] uppercase tracking-wide w-[34%] align-top">
                            {row.short_label}
                          </td>

                          <td className="crew-cell text-white align-top">
                            {row.names.join("   |   ")}
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
          <div className="footer-accent w-full bg-[#500000] shrink-0" />
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
    <div className="flex items-center section-header">
      <div className="section-accent rounded-full bg-[#650000]" />

      <div className="section-title font-black tracking-[0.22em] uppercase text-white">
        {title}
      </div>

      <div className="flex-1 section-line bg-[#303030]" />
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
