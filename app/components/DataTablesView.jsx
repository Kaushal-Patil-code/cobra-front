// History "all tables" view. A shared date range + tab bar over every browsable
// table. The Verdicts tab keeps the rich buckets+log view (HistoryView); the rest
// are config-driven PaginatedTables (keyset "Load more"). Per-table filters live
// in a small FilterBar. fyers_tokens / zones are intentionally not browsable.

'use client';

import { useEffect, useState } from 'react';

import {
  fetchHistory,
  fetchInstruments,
  fetchLadders,
  fetchMetrics,
  fetchSnapshots,
  fetchWalls,
} from '../lib/api.js';
import DateRangePicker from './DateRangePicker.jsx';
import HistoryView from './HistoryView.jsx';
import PaginatedTable from './PaginatedTable.jsx';
import Tabs from './Tabs.jsx';

// ---- formatters -----------------------------------------------------------
const num = (v) => (v == null ? '—' : typeof v === 'number' ? v.toLocaleString('en-IN') : String(v));
const fixed2 = (v) => (v == null ? '—' : Number(v).toFixed(2));
const dateOnly = (v) => (v ? String(v).slice(0, 10) : '—');
const arr = (v) => (Array.isArray(v) ? v.join(' · ') : v ?? '—');
const pct = (v) => (v == null ? '—' : `${v > 0 ? '+' : ''}${Number(v).toFixed(1)}%`);
const time = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// ---- column configs -------------------------------------------------------
const SNAP_COLS = [
  { key: 'ts', label: 'Time', mono: true, render: time },
  { key: 'index_name', label: 'Index' },
  { key: 'option_type', label: 'Type' },
  { key: 'strike', label: 'Strike', mono: true, align: 'right' },
  { key: 'expiry', label: 'Expiry', mono: true, render: dateOnly },
  { key: 'oi', label: 'OI', mono: true, align: 'right', render: num },
  { key: 'ltp', label: 'LTP', mono: true, align: 'right', render: num },
  { key: 'volume', label: 'Vol', mono: true, align: 'right', render: num },
  { key: 'oichp', label: 'OI%chg', mono: true, align: 'right', render: pct },
];
const METRIC_COLS = [
  { key: 'ts', label: 'Time', mono: true, render: time },
  { key: 'index_name', label: 'Index' },
  { key: 'spot', label: 'Spot', mono: true, align: 'right', render: num },
  { key: 'atm', label: 'ATM', mono: true, align: 'right', render: num },
  { key: 'max_pain', label: 'Max-pain', mono: true, align: 'right', render: num },
  { key: 'pcr', label: 'PCR', mono: true, align: 'right', render: fixed2 },
  { key: 'call_oi', label: 'Call OI', mono: true, align: 'right', render: num },
  { key: 'put_oi', label: 'Put OI', mono: true, align: 'right', render: num },
  { key: 'vix', label: 'VIX', mono: true, align: 'right', render: fixed2 },
];
const LADDER_COLS = [
  { key: 'trading_date', label: 'Date', mono: true, render: dateOnly },
  { key: 'index_name', label: 'Index' },
  { key: 'expiry', label: 'Expiry', mono: true, render: dateOnly },
  { key: 'spot_at_lock', label: 'Spot@lock', mono: true, align: 'right', render: num },
  { key: 'atm', label: 'ATM', mono: true, align: 'right', render: num },
  { key: 'interval', label: 'Step', mono: true, align: 'right' },
  { key: 'strikes', label: 'Ladder (8 rungs)', mono: true, render: arr },
];
const WALL_COLS = [
  { key: 'trading_date', label: 'Date', mono: true, render: dateOnly },
  { key: 'side', label: 'Side' },
  { key: 'index_name', label: 'Index' },
  { key: 'option_type', label: 'Type' },
  { key: 'expiry', label: 'Expiry', mono: true, render: dateOnly },
  { key: 'wall_strike', label: 'Wall', mono: true, align: 'right', render: num },
  { key: 'monitored', label: 'Monitored', mono: true, render: arr },
  { key: 'wall_oi_at_lock', label: 'OI@lock', mono: true, align: 'right', render: num },
];
const INSTR_COLS = [
  { key: 'name', label: 'Name' },
  { key: 'symbol', label: 'Symbol', mono: true },
  { key: 'strike_interval', label: 'Interval', align: 'right' },
  { key: 'lot_size', label: 'Lot', align: 'right' },
  { key: 'expiry_weekday', label: 'Expiry day' },
  { key: 'price_mult', label: '×Nifty', align: 'right', render: fixed2 },
  { key: 'is_active', label: 'Active', render: (v) => (v ? 'yes' : 'no') },
];

const TABLES = {
  snapshots: { label: 'Snapshots', fetcher: fetchSnapshots, filters: ['index', 'option_type', 'strike'], columns: SNAP_COLS },
  metrics: { label: 'Metrics', fetcher: fetchMetrics, filters: ['index'], columns: METRIC_COLS },
  ladders: { label: 'Ladders', fetcher: fetchLadders, filters: ['index'], columns: LADDER_COLS },
  walls: { label: 'Walls', fetcher: fetchWalls, filters: ['index', 'side'], columns: WALL_COLS },
  instruments: { label: 'Instruments', fetcher: fetchInstruments, filters: [], columns: INSTR_COLS, paginated: false, noRange: true },
};

const TAB_LIST = [
  { key: 'verdicts', label: 'Verdicts' },
  ...Object.entries(TABLES).map(([key, cfg]) => ({ key, label: cfg.label })),
];

const FILTER_DEFS = {
  index: { label: 'Index', options: [['', 'All'], ['NIFTY', 'NIFTY'], ['SENSEX', 'SENSEX']] },
  side: { label: 'Side', options: [['', 'All'], ['CAP', 'CAP'], ['FLOOR', 'FLOOR']] },
  option_type: { label: 'Type', options: [['', 'All'], ['CE', 'CE'], ['PE', 'PE']] },
};

// ---- helpers --------------------------------------------------------------
function isoToday() {
  return new Date().toISOString().slice(0, 10);
}
function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function FilterBar({ fields, values, onChange }) {
  return (
    <div className="filter-bar">
      {fields.map((f) =>
        f === 'strike' ? (
          <label key="strike" className="filter-field">
            <span className="filter-label">Strike</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="any"
              value={values.strike || ''}
              onChange={(e) => onChange({ ...values, strike: e.target.value })}
            />
          </label>
        ) : (
          <label key={f} className="filter-field">
            <span className="filter-label">{FILTER_DEFS[f].label}</span>
            <select value={values[f] || ''} onChange={(e) => onChange({ ...values, [f]: e.target.value })}>
              {FILTER_DEFS[f].options.map(([val, lab]) => (
                <option key={val} value={val}>{lab}</option>
              ))}
            </select>
          </label>
        )
      )}
    </div>
  );
}

function TableTab({ cfg, start, end }) {
  const [filters, setFilters] = useState({});
  const params = {};
  if (!cfg.noRange) {
    params.start = start;
    params.end = end;
  }
  for (const [k, v] of Object.entries(filters)) {
    if (v !== '' && v != null) params[k] = v;
  }
  return (
    <>
      {cfg.filters.length > 0 && <FilterBar fields={cfg.filters} values={filters} onChange={setFilters} />}
      <PaginatedTable fetcher={cfg.fetcher} params={params} columns={cfg.columns} paginated={cfg.paginated !== false} />
    </>
  );
}

function VerdictsTab({ start, end }) {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { history: h, error: err } = await fetchHistory(start, end);
      if (!cancelled) {
        setHistory(h);
        setError(err);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [start, end]);

  if (loading && !history) return <div className="loading">Loading…</div>;
  if (!history) {
    return (
      <div className="state-note error-note">
        Backend unavailable — could not load /api/history{error ? ` (${error})` : ''}.
      </div>
    );
  }
  return <HistoryView history={history} />;
}

export default function DataTablesView() {
  const [start, setStart] = useState(() => isoDaysAgo(14));
  const [end, setEnd] = useState(() => isoToday());
  const [tab, setTab] = useState('verdicts');

  return (
    <div className="tables-view">
      <div className="tables-controls">
        <DateRangePicker start={start} end={end} onStart={setStart} onEnd={setEnd} />
        <Tabs tabs={TAB_LIST} active={tab} onSelect={setTab} />
      </div>

      {tab === 'verdicts' ? (
        <VerdictsTab start={start} end={end} />
      ) : (
        <TableTab key={tab} cfg={TABLES[tab]} start={start} end={end} />
      )}
    </div>
  );
}
