'use client';

// Option Price Projector — a greeks-based "what will this premium be at target spot"
// calculator (modal). You read the live values off your option chain (LTP + greeks)
// and it projects the new premium via a 2nd-order Taylor expansion:
//
//   new = LTP + Δ·move + ½·Γ·move² + Θ·(hrs/24) + Vega·ΔVIX
//
// PE gains when spot falls, CE when it rises (the Δ term is signed by option type;
// Γ is always additive convexity). Pure client-side math — no backend call. The
// palette maps to the app's theme tokens so it works in light and dark.

import { useEffect, useMemo, useState } from 'react';

const num = (v) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
};
const inr = (n, opts) => Number(n).toLocaleString('en-IN', opts);
const fmt = (n) => (n < 0 ? '-' : '') + 'Rs ' + Math.abs(n).toFixed(2);
const fmtR = (n) => (n < 0 ? '-' : '+') + 'Rs ' + inr(Math.abs(n), { maximumFractionDigits: 0 });

// Module-level so inputs keep focus across keystrokes (a nested component would
// remount every render and blur the field).
function Field({ label, value, onChange, step, wide }) {
  return (
    <div className={`opc-field${wide ? ' opc-wide' : ''}`}>
      <label>{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        step={step}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Bar({ name, value, maxAbs }) {
  const w = maxAbs > 0 ? Math.min((Math.abs(value) / maxAbs) * 50, 50) : 0;
  const pos = value >= 0;
  const style = {
    left: pos ? '50%' : `${50 - w}%`,
    width: `${w}%`,
    background: pos ? 'var(--up)' : 'var(--down)',
  };
  return (
    <div className="opc-brk">
      <span className="opc-brk-nm">{name}</span>
      <div className="opc-bar-wrap">
        <span className="opc-mid" />
        <span className="opc-bar" style={style} />
      </div>
      <span className="opc-brk-val" style={{ color: pos ? 'var(--up)' : 'var(--down)' }}>
        {(pos ? '+' : '-') + Math.abs(value).toFixed(1)}
      </span>
    </div>
  );
}

export default function OptionCalculator({ open, onClose }) {
  const [optType, setOptType] = useState('PE');
  const [curSpot, setCurSpot] = useState('24050');
  const [tgtSpot, setTgtSpot] = useState('23900');
  const [strike, setStrike] = useState('23900');
  const [ltp, setLtp] = useState('105.10');
  const [delta, setDelta] = useState('0.37');
  const [gamma, setGamma] = useState('0.0009');
  const [vega, setVega] = useState('12');
  const [theta, setTheta] = useState('-13');
  const [hours, setHours] = useState('0');
  const [vixChg, setVixChg] = useState('0');
  const [lots, setLots] = useState('1');
  const [lotSize, setLotSize] = useState('65');
  const [advOpen, setAdvOpen] = useState(false);

  // Esc closes; lock background scroll while the modal is up.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const r = useMemo(() => {
    const cur = num(curSpot);
    const tgt = num(tgtSpot);
    const l = num(ltp);
    const d = Math.abs(num(delta));
    const g = Math.abs(num(gamma));
    const th = num(theta);
    const vg = num(vega);
    const hrs = num(hours);
    const vix = num(vixChg);
    const lotsN = num(lots) || 1;
    const lot = num(lotSize) || 65;
    const k = num(strike);
    const sign = optType === 'CE' ? 1 : -1;
    const dSpot = tgt - cur;

    const dTerm = sign * d * dSpot;              // direction
    const gTerm = 0.5 * g * dSpot * dSpot;        // convexity (always adds)
    const tTerm = th * (hrs / 24);                // decay
    const vTerm = vg * vix;                        // vol
    const projected = Math.max(l + dTerm + gTerm + tTerm + vTerm, 0);
    const change = projected - l;
    const pct = l > 0 ? (change / l) * 100 : 0;
    const pnlLot = change * lot;
    const pnlTot = pnlLot * lotsN;
    const maxAbs = Math.max(Math.abs(dTerm), Math.abs(gTerm), Math.abs(tTerm), Math.abs(vTerm), 1);
    return { cur, tgt, k, lot, dSpot, dTerm, gTerm, tTerm, vTerm, projected, change, pct, pnlLot, pnlTot, maxAbs };
  }, [optType, curSpot, tgtSpot, strike, ltp, delta, gamma, vega, theta, hours, vixChg, lots, lotSize]);

  if (!open) return null;

  const moveDir = r.dSpot > 0 ? 'up' : r.dSpot < 0 ? 'dn' : '';
  const moveArrow = r.dSpot > 0 ? '▲' : r.dSpot < 0 ? '▼' : '●';
  const gain = r.change >= 0;

  return (
    <div className="opc-backdrop" role="dialog" aria-modal="true" aria-label="Option Price Projector" onClick={onClose}>
      <div className="opc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="opc-head">
          <div className="opc-title">
            <span className="opc-snake" aria-hidden="true">🐍</span>
            <div>
              <h2>Option Price Projector</h2>
              <div className="opc-sub">greeks-based · feed the chain, get the price</div>
            </div>
          </div>
          <button className="opc-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="opc-body">
          {/* Where is Nifty going? */}
          <div className="opc-panel">
            <div className="opc-plabel">Where is Nifty going?</div>
            <div className="opc-row">
              <Field label="Current spot" value={curSpot} onChange={setCurSpot} />
              <Field label="Target spot" value={tgtSpot} onChange={setTgtSpot} />
            </div>
            <div className="opc-move">
              move <b className={moveDir}>{(r.dSpot >= 0 ? '+' : '-') + Math.abs(r.dSpot).toFixed(0)}</b>{' '}
              <span className={moveDir}>{moveArrow}</span> pts
            </div>
          </div>

          {/* The strike */}
          <div className="opc-panel">
            <div className="opc-plabel">The strike (read from your chain)</div>
            <div className="opc-field opc-wide" style={{ marginBottom: 10 }}>
              <label>Option type</label>
              <div className="opc-toggle">
                <button
                  type="button"
                  className={optType === 'PE' ? 'on-pe' : ''}
                  onClick={() => setOptType('PE')}
                >
                  PE (Put)
                </button>
                <button
                  type="button"
                  className={optType === 'CE' ? 'on-ce' : ''}
                  onClick={() => setOptType('CE')}
                >
                  CE (Call)
                </button>
              </div>
            </div>
            <div className="opc-row">
              <Field label="Strike" value={strike} onChange={setStrike} />
              <Field label="Current LTP (Rs)" value={ltp} onChange={setLtp} step="0.05" />
            </div>
            <div className="opc-row3">
              <Field label="Delta" value={delta} onChange={setDelta} step="0.01" />
              <Field label="Gamma" value={gamma} onChange={setGamma} step="0.0001" />
              <Field label="Vega" value={vega} onChange={setVega} step="0.5" />
            </div>

            <button type="button" className="opc-adv-toggle" onClick={() => setAdvOpen((v) => !v)}>
              <span>{advOpen ? '▾' : '▸'}</span> Add time decay &amp; VIX shift (optional)
            </button>
            {advOpen && (
              <div className="opc-adv">
                <div className="opc-row3">
                  <Field label="Theta /day" value={theta} onChange={setTheta} />
                  <Field label="Hours held" value={hours} onChange={setHours} step="0.5" />
                  <Field label="VIX change" value={vixChg} onChange={setVixChg} step="0.25" />
                </div>
                <div className="opc-adv-note">
                  Theta as shown (negative). VIX change in points: +0.5 if VIX rises, -0.5 if it drops.
                </div>
              </div>
            )}
          </div>

          {/* Output */}
          <div className="opc-out">
            <div className="opc-out-top">
              <div>
                <div className="opc-out-lbl">Projected price</div>
                <div className="opc-out-strike">
                  {inr(r.k)} {optType} @ spot {inr(r.tgt)}
                </div>
              </div>
              <div className={`opc-out-chg ${gain ? 'pos' : 'neg'}`}>
                {(gain ? '+' : '-') + 'Rs ' + Math.abs(r.change).toFixed(2)}
                <br />
                <span className="opc-pct">{(gain ? '+' : '') + r.pct.toFixed(1)}%</span>
              </div>
            </div>
            <div className="opc-out-price" style={{ color: gain ? 'var(--up)' : 'var(--down)' }}>
              {fmt(r.projected)}
            </div>

            <div className="opc-brk-lbl">What moves the price</div>
            <Bar name="Delta" value={r.dTerm} maxAbs={r.maxAbs} />
            <Bar name="Gamma" value={r.gTerm} maxAbs={r.maxAbs} />
            <Bar name="Theta" value={r.tTerm} maxAbs={r.maxAbs} />
            <Bar name="Vega" value={r.vTerm} maxAbs={r.maxAbs} />

            <div className="opc-pnl">
              <div className="opc-pnl-box">
                <div className="opc-k">P&amp;L / lot <span className="opc-lot-note">({r.lot})</span></div>
                <div className="opc-v" style={{ color: r.pnlLot >= 0 ? 'var(--up)' : 'var(--down)' }}>
                  {fmtR(r.pnlLot)}
                </div>
              </div>
              <div className="opc-pnl-box">
                <div className="opc-k">
                  Total (
                  <input
                    className="opc-lots-inp"
                    type="number"
                    inputMode="decimal"
                    value={lots}
                    onChange={(e) => setLots(e.target.value)}
                  />{' '}
                  lots)
                </div>
                <div className="opc-v" style={{ color: r.pnlTot >= 0 ? 'var(--up)' : 'var(--down)' }}>
                  {fmtR(r.pnlTot)}
                </div>
              </div>
            </div>

            {Math.abs(r.dSpot) > 200 && (
              <div className="opc-warn">
                ⚠ Move &gt; 200 pts — greeks shift a lot over big moves, so treat this as a ballpark.
                Accurate within ~150 pts.
              </div>
            )}
          </div>

          <div className="opc-field" style={{ marginBottom: 12 }}>
            <label style={{ color: 'var(--text-dim)', fontWeight: 600 }}>
              Lot size (Nifty 65 · Sensex 20)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={lotSize}
              onChange={(e) => setLotSize(e.target.value)}
            />
          </div>

          <div className="opc-formula">
            <b>How it works:</b>
            <br />
            New price = LTP
            <br />
            &nbsp;&nbsp;+ Delta × move <span className="opc-faint">(direction)</span>
            <br />
            &nbsp;&nbsp;+ ½ × Gamma × move² <span className="opc-faint">(convexity)</span>
            <br />
            &nbsp;&nbsp;+ Theta × (hrs÷24) <span className="opc-faint">(decay)</span>
            <br />
            &nbsp;&nbsp;+ Vega × VIX change <span className="opc-faint">(vol)</span>
            <br />
            <span className="opc-faint">
              PE gains when spot falls · CE gains when spot rises · direction auto-handled.
            </span>
          </div>

          <div className="opc-foot">🐍 COBRA · verify live premium before entry</div>
        </div>
      </div>
    </div>
  );
}
