import db from "./db";
import { initDb } from "./init-db";

interface SeedShift {
  uid: string;
  employee_name: string;
  position: string;
  sport: string;
  department: string;
  dtstart: string;
  dtend: string;
  location: string;
  description: string;
}

function isoOffsetDays(days: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function seedTestData() {
  initDb();

  // Clear only seeded rows (uid prefix SEED-)
  db.prepare(`DELETE FROM shifts WHERE uid LIKE 'SEED-%'`).run();

  const shifts: SeedShift[] = [];
  let n = 0;
  const mk = (
    employee: string,
    position: string,
    sport: string,
    department: string,
    dayOffset: number,
    startHour: number,
    endHour: number,
    desc = ""
  ): SeedShift => ({
    uid: `SEED-${++n}`,
    employee_name: employee,
    position,
    sport,
    department,
    dtstart: isoOffsetDays(dayOffset, startHour),
    dtend: isoOffsetDays(dayOffset, endHour),
    location: sport,
    description: desc,
    raw_summary: `${employee} (Shift as ${position} at ${sport} at ${department})`,
  } as SeedShift & { raw_summary: string });

  // ===== FOOTBALL BIG SCREEN — tomorrow =====
  const fb = (pos: string, emp: string) => shifts.push(mk(emp, pos, "Football", "Big Screen", 0, 6, 15, "Football Game"));
  fb("Big Screen Producer", "Buds Miller");
  fb("Big Screen TD", "Cooper Wright");
  fb("Big Screen Director", "Buns Harmon");
  fb("Big Screen Xpression", "Sarah Klein");
  fb("Big Screen Dreamcatcher", "Haley Rios");
  fb("Big Screen Cam Wireless 1", "Kelly James");
  fb("Big Screen Cam Wireless 1", "Camryn Cary");
  fb("Big Screen Cam Wireless 2", "Annie Joyner");
  fb("Big Screen Cam 1", "Ella Brooks");
  fb("Big Screen Cam 2", "Brenan Cole");
  fb("Big Screen Cam 3", "Jaiden Ford");
  fb("Big Screen Cam 4", "Jackson Reed");
  fb("Big Screen Cam 5", "Ty Bennett");
  fb("Big Screen Cam 6", "Landon Pike");
  fb("Time Out Coordinator", "Savanna Hill");
  fb("Assistant Producer", "Cogan Boyd");

  // ===== BASEBALL BROADCAST — tomorrow =====
  const bb = (pos: string, emp: string) => shifts.push(mk(emp, pos, "Baseball", "Broadcast", 0, 15, 22, "Baseball vs LSU"));
  bb("Producer", "Marcus Lane");
  bb("Director", "Nora Beck");
  bb("Assistant Director", "Ivy Ramos");
  bb("Assistant Producer", "Toby Chen");
  bb("Technical Director", "Rex Owens");
  bb("Bug/Dashboard Operator", "Piper Yates");
  bb("Xpression", "Wes Duran");
  bb("Dreamcatcher 1", "Aria Song");
  bb("Dreamcatcher 2", "Milo Vance");
  bb("Dreamcatcher 3", "Zoe Park");
  bb("Camera 1", "Finn Ward");
  bb("Camera 2", "Nia Hoyt");
  bb("Camera 3", "Kade Ellis");
  bb("Camera 4", "Ruby Tate");
  bb("Camera 5", "Owen Blake");
  bb("Camera 6", "Sadie Mercer");

  // ===== BASEBALL BIG SCREEN — tomorrow (same game, different crew) =====
  const bbg = (pos: string, emp: string) => shifts.push(mk(emp, pos, "Baseball", "Big Screen", 0, 15, 22, "Baseball vs LSU"));
  bbg("Big Screen Producer", "Drew Kaplan");
  bbg("Big Screen TD", "Reese Alvarez");
  bbg("Big Screen Xpression", "Jade Whitman");
  bbg("Big Screen Dreamcatcher", "Otis Frey");
  bbg("Big Screen Cam Wireless 1", "Sky Nolan");
  bbg("Big Screen Cam Wireless 2", "Lena Fitz");

  // ===== SOCCER BROADCAST — day after tomorrow =====
  const sb = (pos: string, emp: string) => shifts.push(mk(emp, pos, "Soccer", "Broadcast", 1, 18, 22, "Soccer vs Alabama"));
  sb("Producer", "Hank Ivers");
  sb("Director", "Cleo March");
  sb("Technical Director", "Bram Suggs");
  sb("Assistant Producer", "June Ott");
  sb("Xpression", "Rhea Cortez");
  sb("Dreamcatcher 1", "Silas Poe");
  sb("Camera 1", "Mabel Kent");
  sb("Camera 2", "Emmet Rowe");
  sb("Camera 3", "Halle Grant");
  sb("Camera 4", "Beau Sinclair");

  const stmt = db.prepare(`
    INSERT INTO shifts (uid, employee_name, position, sport, department, dtstart, dtend, location, description, raw_summary)
    VALUES (@uid, @employee_name, @position, @sport, @department, @dtstart, @dtend, @location, @description, @raw_summary)
  `);
  const tx = db.transaction((rows: SeedShift[]) => { for (const r of rows) stmt.run(r); });
  tx(shifts);

  return { inserted: shifts.length };
}