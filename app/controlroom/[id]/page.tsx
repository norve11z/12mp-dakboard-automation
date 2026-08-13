import { getPanelState } from "@/lib/display-state";
import { notFound } from "next/navigation";
import AutoRefresh from "./AutoRefresh";
import VideoLoop from "./VideoLoop";
import type { UpcomingGame } from "@/lib/display-state";

const VIDEOS = [
  "/videos/am-hype-1.mp4",
  "/videos/am-hype-2.mp4",
  "/videos/am-hype-3.mp4",
];

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

const crewRows =
  (state.sport === "Football" ? 1 : 0) +
  (state.crew?.filter((r) => r.names.length > 0).length ?? 0);

const crewFontSize =
  crewRows <= 5
    ? "45px"
    : crewRows === 6
      ? "45px"
      : crewRows === 7
        ? "45px"
        : crewRows === 8
          ? "45px"
          : crewRows === 9
            ? "40px"
            : crewRows === 10
              ? "45px"
              : crewRows === 11
                ? "40px"
                : "35px";

const crewCellPadding =
  crewRows <= 6
    ? "8px"
    : crewRows <= 8
      ? "6px"
      : "2px";

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
          FOOTER
          ========================================================= */

        .footer-accent {
          height: clamp(6px, 0.6vh, 12px);
        }

        /* =========================================================
          1080 x 1920 VERTICAL DISPLAY
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

          .section-title {
            font-size: 34px;
          }
        }

        /* =========================================================
          SHORTER VERTICAL DISPLAYS
          ========================================================= */

        @media (max-height: 1600px) {
          .team-logo {
            width: 120px;
            height: 120px;
          }

          .team-name {
            font-size: clamp(24px, 3vh, 48px);
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
        }
      `
      }</style>

      {!state.hasContent ? (
        <Placeholder panel={panel} upcoming={state.upcoming || []} />
      ) : (
        <>
          {/* =========================================================
              HEADER
          ========================================================= */}
          <header className="w-full shrink-0">
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
                    Broadcast Staff
                  </div>

                  <div className="panel-number font-bold text-[#d0d2d4]">
                    PCR {panel}
                  </div>
                </div>
              </div>
            </div>

            {/* =======================================================
                MATCHUP
            ======================================================= */}
            <div className="matchup-margin">
              <div className="rounded-xl border border-[#551010] bg-gradient-to-b from-[#1e0000] via-[#100000] to-black overflow-hidden">
                <div className="matchup-top text-center">
                  <div className="sport-title inline-block font-black tracking-[0.3em] uppercase text-[#d0d2d4]">
                    {state.title}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 matchup-teams">
                  {/* Opponent logo — LEFT */}
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

                  {/* Matchup */}
                  <div className="flex-1 text-center min-w-0">
                    {/* Opponent — TOP */}
                    <div className="team-name font-black tracking-tight leading-none text-[#f5f5f5]">
                      {state.opponent?.toUpperCase()}
                    </div>

                    {state.opponent && (
                      <>
                        <div className="flex items-center justify-center matchup-divider">
                          <div className="h-[2px] w-8 bg-[#700000]" />

                          <div className="vs-text font-black text-[#c4c6c8]">
                            @
                          </div>

                          <div className="h-[2px] w-8 bg-[#700000]" />
                        </div>

                        {/* Texas A&M — BOTTOM */}
                        <div className="team-name font-black tracking-tight leading-none text-white">
                          TEXAS A&M
                        </div>
                      </>
                    )}
                  </div>

                  {/* Texas A&M logo — RIGHT */}
                  <div className="w-[28%] flex justify-center items-center">
                    <div className="team-logo flex items-center justify-center">
                      <img
                        src="https://a.espncdn.com/i/teamlogos/ncaa/500/245.png"
                        alt="Texas A&M"
                        className="max-w-full max-h-full object-contain"
                        style={{
                          filter:
                            "drop-shadow(1px 0 0 white) drop-shadow(-1px 0 0 white) drop-shadow(0 1px 0 white) drop-shadow(0 -1px 0 white)",
                        }}
                      />
                    </div>
                  </div>
                </div>

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
                <table
                  className="w-full font-bold"
                  style={{
                    fontSize: crewFontSize,
                    lineHeight: 1.05,
                  }}
                >
                  <tbody>
                    {state.sport === "Football" && (
                      <tr className="border-b border-[#2b2b2b] bg-[#101010]">
                        <td
                          className="text-[#c9cbcd] uppercase tracking-wide w-[34%] align-top"
                          style={{
                            paddingTop: crewCellPadding,
                            paddingBottom: crewCellPadding,
                            paddingLeft: "9px",
                            paddingRight: "9px",
                          }}
                        >
                          Game Producer
                        </td>

                        <td
                          className="text-white align-top"
                          style={{
                            paddingTop: crewCellPadding,
                            paddingBottom: crewCellPadding,
                            paddingLeft: "9px",
                            paddingRight: "9px",
                          }}
                        >
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
                          <td
                            className="text-[#c9cbcd] uppercase tracking-wide w-[34%] align-top"
                            style={{
                              paddingTop: crewCellPadding,
                              paddingBottom: crewCellPadding,
                              paddingLeft: "9px",
                              paddingRight: "9px",
                            }}
                          >
                            {row.short_label}
                          </td>

                          <td
                            className="text-white align-top"
                            style={{
                              paddingTop: crewCellPadding,
                              paddingBottom: crewCellPadding,
                              paddingLeft: "9px",
                              paddingRight: "9px",
                            }}
                          >
                            {row.names.map((name, nameIndex) => (
                              <div key={nameIndex}>{name}</div>
                            ))}
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

function Placeholder({ upcoming }: { panel: number; upcoming: UpcomingGame[] }) {
  const bySport = upcoming.reduce<Record<string, UpcomingGame[]>>((acc, g) => {
    (acc[g.sport] ||= []).push(g);
    return acc;
  }, {});
  const sports = Object.keys(bySport).sort();

  const fmtDate = (d: string) => {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  const fmtTime = (iso: string | null) => iso
    ? new Date(iso).toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div className="w-full h-full flex flex-col bg-[#500000] text-white">
      {/* Video header */}
      <div className="w-full" style={{ height: "40%" }}>
        <VideoLoop videos={VIDEOS} />
      </div>

      {/* Brand strip */}
      <div className="w-full py-4 flex items-center justify-center gap-4 border-y-4 border-white bg-[#3a0000]">
        <span className="text-4xl font-black tracking-wider">TEXAS A&M</span>
        <span className="text-2xl font-light text-gray-300">•</span>
        <span className="text-3xl font-bold text-gray-200">12TH MAN PRODUCTIONS</span>
      </div>

      {/* Upcoming */}
      <div className="flex-1 overflow-hidden px-8 py-6">
        <div className="text-3xl font-black mb-4 tracking-wide">UPCOMING</div>
        {sports.length === 0 ? (
          <div className="text-2xl text-gray-300">No upcoming games scheduled.</div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 overflow-hidden">
            {sports.map(sport => (
              <div key={sport}>
                <div className="text-xl font-bold text-yellow-200 uppercase mb-2 border-b border-yellow-300/40 pb-1">
                  {sport}
                </div>
                <ul className="space-y-2">
                  {bySport[sport].slice(0, 4).map((g, i) => (
                    <li key={i} className="flex items-center gap-3">
                      {g.logo_url ? (
                        <img src={g.logo_url} alt="" className="w-10 h-10 object-contain bg-white/10 rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-white/10 rounded" />
                      )}
                      <div className="flex-1">
                        <div className="text-lg font-bold leading-tight">
                          vs {g.opponent || "TBD"}
                        </div>
                        <div className="text-sm text-gray-300">
                          {fmtDate(g.game_date)}
                          {fmtTime(g.kickoff) && ` • ${fmtTime(g.kickoff)}`}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
