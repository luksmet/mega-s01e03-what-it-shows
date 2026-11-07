<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import engineering from '#lib/data/engineering-4471.json';
  import { groupByCause, readAs, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  type Link = { label: string; href: string };
  // `tickets`: where each cause is filed now, cause → link. `oneDayMove`: where the one-day moves are tracked.
  let { ticket, tickets = {}, oneDayMove }: { ticket: number; tickets?: Record<string, Link>; oneDayMove?: Link } = $props();

  const rows = $derived((reports as Report[]).filter((r) => r.mergedInto === ticket));
  const merged = $derived(uniqueById(rows));
  const groups = $derived(groupByCause(merged, tenantOf));
  const placed = $derived(groups.reduce((n, g) => n + g.reports.length, 0));
  const outcome = (cause: string) => (engineering.causes as Record<string, { state: string; change: string }>)[cause];
  const list = (counts: Record<string, number>) =>
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ·
  <strong>{groups.length}</strong> {groups.length === 1 ? 'problem' : 'problems'}
  <span class="small">({rows.length} rows in the export, {rows.length - merged.length} of them repeats of the same id)</span>
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>intake tagged as</th><th>seen</th><th>ticket</th><th>outcome</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.cause)}
      <tr>
        <td><code>{g.cause}</code></td>
        <td><strong>{g.reports.length}</strong></td>
        <td>{g.tenants}</td>
        <td class="small">{list(g.taggedAs)}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if tickets[g.cause]}<a href={tickets[g.cause].href}>{tickets[g.cause].label}</a>{:else}<span class="warn">none</span>{/if}</td>
        <td class="small">
          {#if outcome(g.cause)}<b>{outcome(g.cause).state}</b>: {outcome(g.cause).change}{:else}<span class="warn">open</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr><td>total</td><td><strong>{placed}</strong></td><td colspan="5" class="small">{placed === merged.length ? 'every report placed once' : `${merged.length - placed} reports not placed`}</td></tr>
  </tfoot>
</table>

{#each groups as g (g.cause)}
  {@const moved = readAs(g, notes.oneDayMove)}
  {#if moved}
    <p class="small">
      {moved} of the <code>{g.cause}</code> reports read as a one-day move, not a flip
      ({notes.oneDayMove.join(', ')}). Counted under <code>{g.cause}</code> by tenant{#if oneDayMove}; followed up in
        <a href={oneDayMove.href}>{oneDayMove.label}</a>{/if}.
    </p>
  {/if}
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .warn { color: var(--warn); }
  tfoot td { border-bottom: none; }
</style>
