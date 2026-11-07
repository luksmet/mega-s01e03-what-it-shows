<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem } from '#lib/kb/problems';

  // `tickets`: where each problem is filed now, problem → link.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Partial<Record<Problem, { label: string; href: string }>> } =
    $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const counted = $derived(split.groups.reduce((n, g) => n + g.reports.length, 0));
  const list = (xs: [string, number][]) => xs.map(([k, n]) => `${k} ×${n}`).join(' · ');
</script>

<p class="sum">
  <strong>{split.unique}</strong> reports merged into #{ticket} ·
  <strong>{split.groups.length}</strong> {split.groups.length === 1 ? 'problem' : 'problems'}
  <span class="aside">({split.rows} rows in the export, {split.rows - split.unique} of them repeats of the same id)</span>
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>channels</th><th>intake tagged as</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td><strong>{g.reports.length}</strong></td>
        <td>{g.tenants.length}</td>
        <td class="small">{list(g.channels)}</td>
        <td class="small">{list(g.taggedAs)}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if tickets[g.problem]}<a href={tickets[g.problem]?.href}>{tickets[g.problem]?.label}</a>{:else}<span class="none">none yet</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr><td>total</td><td><strong>{counted}</strong></td><td colspan="5" class="small">{counted === split.unique ? 'every report placed once' : `${split.unique - counted} reports not placed`}</td></tr>
  </tfoot>
</table>

{#each split.groups.filter((g) => g.reports.length < 10) as g (g.problem)}
  <p class="small"><code>{g.problem}</code> reports: {g.reports.map((r) => r.id).join(', ')}</p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .aside, .small { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); }
  tfoot td { border-bottom: none; }
</style>
