import React from "react";

// ─── SHARED ───────────────────────────────────────────────────────────────────
const styles = `
  .tbl-wrap {
    background: var(--color-bg, #383838);
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 12px;
    overflow: hidden;
    font-family: inherit;
    width: 100%;
  }
  .tbl-wrap table {
    width: 100%;
    border-collapse: collapse;
    font-size: 15px;
  }
  .tbl-wrap th {
    background: rgba(0,0,0,0.025);
    color: #888;
    font-weight: 500;
    font-size: 13px;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    padding: 10px 16px;
    text-align: left;
    border-bottom: 1px solid rgba(247, 247, 247, 0.06);
  }
  .tbl-wrap td {
    padding: 11px 16px;
    border-bottom: 1px solid rgba(0,0,0,0.05);
    vertical-align: middle;
    line-height: 1.4;
    color: inherit;
  }
  .tbl-wrap tr:last-child td { border-bottom: none; }
  .tbl-wrap tr:hover td { background: rgba(0,0,0,0.02); }

  .tbl-badge-green {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    background: #EAF3DE;
    color: #3B6D11;
  }
  .tbl-winner {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    background: #EAF3DE;
    color: #3B6D11;
  }
  .tbl-neutral { color: #888; font-size: 12px; }
  .tbl-mono {
    font-family: monospace;
    font-size: 11px;
    color: #888;
    background: rgba(0,0,0,0.04);
    padding: 1px 6px;
    border-radius: 4px;
    display: inline-block;
    margin-top: 2px;
  }
  .tbl-muted { color: #888; font-size: 14px; }
  .tbl-bold { font-weight: 500; font-size: 13px; }
  .tbl-center { text-align: left; }

  .tbl-total-row td {
    background: rgba(0,0,0,0.025);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    font-weight: 500;
  }
  .tbl-input-row td { background: rgba(0,0,0,0.015); }

  .tbl-summary-bar {
    display: flex;
    border-top: 1px solid rgba(0,0,0,0.06);
  }
  .tbl-summary-cell {
    flex: 1;
    padding: 12px 16px;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
  }
  .tbl-summary-cell:last-child { border-right: none; }
  .tbl-summary-label {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-bottom: 4px;
  }
  .tbl-summary-value { font-size: 16px; font-weight: 500; }
  .tbl-summary-value.green { color: #3B6D11; }
`;

const InjectStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: styles }} />
);

// ─── 1. SPEC TABLE ────────────────────────────────────────────────────────────
/**
 * Props:
 *   model   {string}   — car name shown in column header
 *   rows    {Array}    — [{ label, value, highlight }]
 *                        highlight: "green" | undefined
 *
 * Example:
 *   <SpecTable
 *     model="Tata Nexon Diesel"
 *     rows={[
 *       { label: "Engine", value: "1.5L Revotorq" },
 *       { label: "Mileage (ARAI)", value: "24.08 kmpl", highlight: "green" },
 *       { label: "Safety", value: "5-star GNCAP", highlight: "green" },
 *     ]}
 *   />
 */
export const SpecTable = ({ model = "Model", rows = [] }) => (
  <>
    <InjectStyles />
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th style={{ width: "40%" }}>Specification</th>
            <th>{model}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="tbl-muted">{row.label}</td>
              <td className="tbl-bold">
                {row.highlight === "green"
                  ? <span className="tbl-badge-green">{row.value}</span>
                  : row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

// ─── 2. COMPARISON TABLE ──────────────────────────────────────────────────────
/**
 * Props:
 *   cars    {string[]} — ["Tata Harrier", "Tata Safari"]
 *   rows    {Array}    — [{ feature, values: [val1, val2], winner: 0|1|null }]
 *                        winner: index of the better option (0 or 1), or null for tie
 *
 * Example:
 *   <ComparisonTable
 *     cars={["Tata Harrier", "Tata Safari"]}
 *     rows={[
 *       { feature: "Seating",    values: ["5", "6–7"],        winner: 1 },
 *       { feature: "Price",      values: ["₹14–25L", "₹14.6–26L"], winner: 0 },
 *       { feature: "3rd row",    values: ["No", "Yes"],       winner: 1 },
 *       { feature: "Boot space", values: ["406 L", "420 L"],  winner: 1 },
 *     ]}
 *   />
 */
export const ComparisonTable = ({ cars = [], rows = [] }) => (
  <>
    <InjectStyles />
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th style={{ width: "28%" }}>Feature</th>
            {cars.map((c, i) => (
              <th key={i} className="tbl-center">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="tbl-muted">{row.feature}</td>
              {row.values.map((val, j) => (
                <td key={j} className="tbl-center">
                  {row.winner === j
                    ? <span className="tbl-winner">{val}</span>
                    : row.winner === null
                      ? <span>{val}</span>
                      : <span className="tbl-neutral">{val}</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

// ─── 3. CALCULATION TABLE ─────────────────────────────────────────────────────
/**
 * Props:
 *   title    {string}   — e.g. "EMI Calculation — Nexon Creative Diesel"
 *   inputs   {Array}    — [{ label, value }]  shown with subtle bg
 *   steps    {Array}    — [{ label, formula, result }]
 *   total    {object}   — { label, value }
 *   summary  {Array}    — [{ label, value, green }]  bottom summary bar (optional)
 *
 * Example:
 *   <CalculationTable
 *     title="EMI Calculation"
 *     inputs={[
 *       { label: "On-road price",     value: "₹11,50,000" },
 *       { label: "Down payment (20%)", value: "₹2,30,000" },
 *       { label: "Loan amount",       value: "₹9,20,000" },
 *       { label: "Interest · Tenure", value: "9.5% p.a. · 60 months" },
 *     ]}
 *     steps={[
 *       { label: "Monthly rate",  formula: "r = 9.5 ÷ 12 ÷ 100", result: "0.7917%" },
 *       { label: "EMI formula",   formula: "P×r×(1+r)^n ÷ [(1+r)^n−1]", result: "₹19,300/mo" },
 *       { label: "Total interest paid", result: "₹2,58,000" },
 *     ]}
 *     total={{ label: "Total paid (5 yr)", value: "₹11,78,000" }}
 *     summary={[
 *       { label: "Monthly EMI",   value: "₹19,300" },
 *       { label: "Total interest", value: "₹2,58,000" },
 *       { label: "Effective cost", value: "₹11,78,000", green: true },
 *     ]}
 *   />
 */
export const CalculationTable = ({
  title,
  inputs = [],
  steps = [],
  total = null,
  summary = [],
}) => (
  <>
    <InjectStyles />
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th style={{ width: "55%" }}>{title || "Calculation"}</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {/* inputs */}
          {inputs.map((inp, i) => (
            <tr key={`inp-${i}`} className="tbl-input-row">
              <td className="tbl-muted">{inp.label}</td>
              <td className="tbl-bold">{inp.value}</td>
            </tr>
          ))}

          {/* steps */}
          {steps.map((step, i) => (
            <tr key={`step-${i}`}>
              <td className="tbl-muted">
                {step.label}
                {step.formula && (
                  <div className="tbl-mono">{step.formula}</div>
                )}
              </td>
              <td className="tbl-bold">{step.result}</td>
            </tr>
          ))}

          {/* total */}
          {total && (
            <tr className="tbl-total-row">
              <td className="tbl-muted">{total.label}</td>
              <td style={{ fontSize: 15 }}>{total.value}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* summary bar */}
      {summary.length > 0 && (
        <div className="tbl-summary-bar">
          {summary.map((s, i) => (
            <div key={i} className="tbl-summary-cell">
              <div className="tbl-summary-label">{s.label}</div>
              <div className={`tbl-summary-value${s.green ? " green" : ""}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </>
);
