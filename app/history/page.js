// COBRA — History / Backtest view (route: /history).
//
// All browsable data tables behind a shared date range + tab bar: Verdicts (rich
// buckets + log), Snapshots, Metrics, Ladders, Walls, Instruments. Each tab
// fetches its own data (keyset-paginated) and falls back to bundled fixtures when
// the backend is down. The orchestration lives in DataTablesView.

'use client';

import DataTablesView from '../components/DataTablesView.jsx';

export default function HistoryPage() {
  return (
    <>
      <div className="header-top">
        <div className="header-meta">
          <span className="last-updated">backtest log · all tables</span>
        </div>
      </div>

      <main className="app-main">
        <DataTablesView />
      </main>
    </>
  );
}
