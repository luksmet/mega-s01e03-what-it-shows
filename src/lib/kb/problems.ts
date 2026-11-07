// Splits a merged ticket into the problems its reports really are. Pages explain it; this file is what runs.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

// `parser` and `hint` come from causes.ts. `shift` is a date that moved by one day instead of
// flipping day and month: a different bug, read by the desk (desk-notes.json, `oneDayMove`).
export type Problem = 'parser' | 'hint' | 'shift' | 'unplaced';

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'shift';
  return causeOf(r, t) ?? 'unplaced';
}

const tally = (rs: Report[], key: (r: Report) => string): [string, number][] =>
  Object.entries(rs.reduce<Record<string, number>>((n, r) => ({ ...n, [key(r)]: (n[key(r)] ?? 0) + 1 }), {})).sort(
    (a, b) => b[1] - a[1],
  );

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: [string, number][];
  channels: [string, number][];
  taggedAs: [string, number][];
  firstSeen: string;
  lastSeen: string;
};

export type Split = { rows: number; unique: number; groups: ProblemGroup[] };

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): Split {
  const rows = all.filter((r) => r.mergedInto === ticket);
  const merged = uniqueById(rows);
  const byProblem = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  const groups = [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: tally(rs, (r) => r.tenant),
        channels: tally(rs, (r) => r.channel),
        taggedAs: tally(rs, (r) => r.meta.intakeTag),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { rows: rows.length, unique: merged.length, groups };
}
