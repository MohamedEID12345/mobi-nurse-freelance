/** Date range filters used by the admin dashboard/reports (server local time). */
export function rangeFrom(range: string | null, from: string | null, to: string | null): { from: Date; to: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  switch (range) {
    case 'yesterday': { const f = new Date(start); f.setDate(f.getDate() - 1); return { from: f, to: start }; }
    case 'week': { const f = new Date(start); f.setDate(f.getDate() - 6); return { from: f, to: new Date(now.getTime() + 1000) }; }
    case 'month': { const f = new Date(start); f.setDate(1); return { from: f, to: new Date(now.getTime() + 1000) }; }
    case 'all': return { from: new Date('2020-01-01'), to: new Date(now.getTime() + 1000) };
    case 'custom':
      if (from && to && !Number.isNaN(Date.parse(from)) && !Number.isNaN(Date.parse(to))) {
        return { from: new Date(from), to: new Date(new Date(to).getTime() + 86_400_000) };
      }
      return { from: start, to: new Date(now.getTime() + 1000) };
    default: return { from: start, to: new Date(now.getTime() + 1000) };
  }
}
