export interface PcrRow {
  label: string;
  value: string;
}

export interface PcrPanel {
  assignment: string | null;   // e.g. "BASEBALL BROADCAST"
  rows: PcrRow[];
}

export interface PcrAssignments {
  eventTitle: string;          // e.g. "Baseball Regionals"
  pcr1: PcrPanel;
  pcr2: PcrPanel;
  pcr3: PcrPanel;
  pcr4: PcrPanel;
  dreamcatcher: PcrRow[];
  shading: PcrRow[];
  audio: PcrRow[];
}