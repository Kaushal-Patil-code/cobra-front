// Generic keyset-paginated table. Given a `fetcher` (lib/api table fetcher),
// `params` (filters + date range), and `columns` ([{key,label,render?,mono?,align?}]),
// it loads the first page from the real backend and appends pages on "Load more"
// (via the server cursor). No sample fallback: on failure it shows an offline chip
// and an explicit empty state.
//
// Re-fetches the first page whenever `params` changes (keyed on its JSON), so the
// parent just hands down new filters/range and the table resets itself.

'use client';

import { useEffect, useState } from 'react';

export default function PaginatedTable({ fetcher, params, columns, paginated = true }) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const key = JSON.stringify(params);

  // First page (and reset) whenever the filters/range change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error: err } = await fetcher(params);
      if (cancelled) return;
      setItems(data?.items || []);
      setCursor(data?.page?.next_cursor || null);
      setHasMore(Boolean(data?.page?.has_more));
      setError(err);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    const { data, error: err } = await fetcher({ ...params, cursor });
    setItems((prev) => [...prev, ...(data?.items || [])]);
    setCursor(data?.page?.next_cursor || null);
    setHasMore(Boolean(data?.page?.has_more));
    setError(err);
    setLoading(false);
  }

  return (
    <div className="ptable">
      <div className="ptable-head">
        <span className="ptable-count">
          {items.length}
          {hasMore ? '+' : ''} rows
        </span>
        {error && (
          <span className="offline-chip" title={error}>offline — backend unavailable</span>
        )}
      </div>

      <div className="log-scroll">
        <table className="log-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={c.align === 'right' ? 'col-right' : ''}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((row, i) => (
              <tr key={row.id || i}>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`${c.mono ? 'col-mono' : ''} ${c.align === 'right' ? 'col-right' : ''}`.trim()}
                  >
                    {c.render ? c.render(row[c.key], row) : row[c.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={columns.length} className="ptable-empty">
                  {error ? 'Backend unavailable — no data.' : 'No rows for this range / filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {loading && items.length === 0 && <div className="loading">Loading…</div>}

      {paginated && hasMore && (
        <button type="button" className="load-more" onClick={loadMore} disabled={loading}>
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}
