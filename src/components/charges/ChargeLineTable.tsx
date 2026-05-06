'use client';

import { useRef } from 'react';
import type { ChargeLineRow } from '@/types/encounter';

const LETTERS = 'ABCD';
const CPT_RE = /^([A-Z]\d{4}|\d{4}[A-Z]|\d{5})$/i;
const MOD_RE = /^[A-Z0-9]{2}$/i;

function computeTotal(lines: ChargeLineRow[]): number {
  return lines.reduce((sum, l) => {
    const fee = parseFloat(l.fee);
    return sum + (isNaN(fee) ? 0 : fee * l.units);
  }, 0);
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

interface ChargeLineTableProps {
  lines: ChargeLineRow[];
  diagnosisCodes: string[];
  onChange: (lines: ChargeLineRow[]) => void;
  aiExtracted?: Set<string>; // 'line-{i}-{field}' keys
  onFieldEdited?: (key: string) => void;
  locked?: boolean;
}

function emptyRow(): ChargeLineRow {
  return { cptCode: '', diagnosisPointers: [1], units: 1, fee: '', modifiers: [] };
}

export function ChargeLineTable({
  lines,
  diagnosisCodes,
  onChange,
  aiExtracted,
  onFieldEdited,
  locked = false,
}: ChargeLineTableProps) {
  const cptRefs = useRef<(HTMLInputElement | null)[]>([]);

  function updateLine(index: number, patch: Partial<ChargeLineRow>) {
    const next = lines.map((l, i) => (i === index ? { ...l, ...patch } : l));
    onChange(next);
  }

  function addRow() {
    const next = [...lines, emptyRow()];
    onChange(next);
    setTimeout(() => cptRefs.current[next.length - 1]?.focus(), 0);
  }

  function removeRow(index: number) {
    if (lines.length <= 1) return;
    const next = lines.filter((_, i) => i !== index);
    onChange(next);
    setTimeout(() => {
      cptRefs.current[Math.max(0, index - 1)]?.focus();
    }, 0);
  }

  function handleAltEnter(e: React.KeyboardEvent, _index: number) {
    if (e.altKey && e.key === 'Enter') {
      e.preventDefault();
      addRow();
    }
  }

  function markEdited(key: string) {
    onFieldEdited?.(key);
  }

  function togglePointer(lineIndex: number, pointer: number, checked: boolean) {
    const current = lines[lineIndex].diagnosisPointers;
    const next = checked
      ? [...current, pointer].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b)
      : current.filter((p) => p !== pointer);
    updateLine(lineIndex, { diagnosisPointers: next });
    markEdited(`line-${lineIndex}-diagnosisPointers`);
  }

  function updateModifier(lineIndex: number, modIndex: number, value: string) {
    const mods = [...(lines[lineIndex].modifiers ?? [])];
    mods[modIndex] = value.toUpperCase().slice(0, 2);
    // Trim trailing empty entries
    while (mods.length > 0 && mods[mods.length - 1] === '') mods.pop();
    updateLine(lineIndex, { modifiers: mods });
    markEdited(`line-${lineIndex}-modifiers`);
  }

  const total = computeTotal(lines);
  // Show at most 4 diagnosis pointer checkboxes (EDI 837P limit), capped by how many dx codes exist
  const dxCount = Math.min(diagnosisCodes.length, 4);

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">CPT</th>
              <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Modifiers</th>
              <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Dx Pointers</th>
              <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Units</th>
              <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Fee ($)</th>
              {!locked && (
                <th scope="col" className="relative px-3 py-2.5">
                  <span className="sr-only">Remove</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {lines.map((line, i) => {
              const cptAi = aiExtracted?.has(`line-${i}-cptCode`) ?? false;
              const feeAi = aiExtracted?.has(`line-${i}-fee`) ?? false;
              const cptInvalid = line.cptCode.length > 0 && !CPT_RE.test(line.cptCode);

              return (
                <tr key={i} onKeyDown={(e) => handleAltEnter(e, i)}>
                  {/* CPT */}
                  <td className="px-3 py-2">
                    <input
                      ref={(el) => { cptRefs.current[i] = el; }}
                      type="text"
                      value={line.cptCode}
                      maxLength={5}
                      placeholder="CPT"
                      readOnly={locked}
                      aria-label={`CPT code for line ${i + 1}`}
                      aria-invalid={cptInvalid}
                      onChange={(e) => {
                        updateLine(i, { cptCode: e.target.value.toUpperCase() });
                        markEdited(`line-${i}-cptCode`);
                      }}
                      className={`w-24 rounded-md border px-2 py-1 text-sm font-mono uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                        locked
                          ? 'border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed'
                          : cptInvalid
                          ? 'border-red-500 bg-red-50'
                          : cptAi
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-zinc-300 bg-white'
                      }`}
                    />
                  </td>

                  {/* Modifiers — 2 visible, 2 more on demand */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {[0, 1].map((mi) => {
                        const modInvalid =
                          (line.modifiers?.[mi] ?? '').length > 0 &&
                          !MOD_RE.test(line.modifiers?.[mi] ?? '');
                        return (
                          <input
                            key={mi}
                            type="text"
                            value={line.modifiers?.[mi] ?? ''}
                            maxLength={2}
                            placeholder={`M${mi + 1}`}
                            readOnly={locked}
                            aria-label={`Modifier ${mi + 1} for line ${i + 1}`}
                            onChange={(e) => updateModifier(i, mi, e.target.value)}
                            list="common-modifiers"
                            className={`w-10 rounded-md border px-1.5 py-1 text-center text-sm font-mono uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                              locked
                                ? 'border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed'
                                : modInvalid
                                ? 'border-red-500 bg-red-50'
                                : 'border-zinc-300 bg-white'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </td>

                  {/* Diagnosis pointers */}
                  <td className="px-3 py-2">
                    {dxCount === 0 ? (
                      <span className="text-xs text-zinc-400">Add dx above</span>
                    ) : (
                      <fieldset>
                        <legend className="sr-only">Diagnosis pointers for charge line {i + 1}</legend>
                        <div className="flex items-center gap-2">
                          {Array.from({ length: dxCount }, (_, pi) => {
                            const pointer = pi + 1; // 1-based
                            const letter = LETTERS[pi] ?? String(pointer);
                            const checked = line.diagnosisPointers.includes(pointer);
                            return (
                              <label key={pi} className="flex items-center gap-0.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={locked}
                                  aria-label={`Diagnosis pointer ${letter} for line ${i + 1}`}
                                  onChange={(e) => togglePointer(i, pointer, e.target.checked)}
                                  className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                                />
                                <span className="text-xs font-medium text-zinc-600">{letter}</span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    )}
                  </td>

                  {/* Units */}
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={line.units}
                      readOnly={locked}
                      aria-label={`Units for line ${i + 1}`}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1));
                        updateLine(i, { units: val });
                        markEdited(`line-${i}-units`);
                      }}
                      className={`w-16 rounded-md border px-2 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                        locked
                          ? 'border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed'
                          : 'border-zinc-300 bg-white'
                      }`}
                    />
                  </td>

                  {/* Fee */}
                  <td className="px-3 py-2">
                    <div className="flex items-center">
                      <span className="mr-1 text-sm text-zinc-500">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={line.fee}
                        placeholder="0.00"
                        readOnly={locked}
                        aria-label={`Fee for line ${i + 1}`}
                        onChange={(e) => {
                          updateLine(i, { fee: e.target.value });
                          markEdited(`line-${i}-fee`);
                        }}
                        onBlur={(e) => {
                          const n = parseFloat(e.target.value);
                          if (!isNaN(n)) updateLine(i, { fee: n.toFixed(2) });
                        }}
                        className={`w-24 rounded-md border px-2 py-1 text-right text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                          locked
                            ? 'border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed'
                            : feeAi
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-zinc-300 bg-white'
                        }`}
                      />
                    </div>
                  </td>

                  {/* Remove */}
                  {!locked && (
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        disabled={lines.length <= 1}
                        title={lines.length <= 1 ? 'At least one charge line is required.' : undefined}
                        aria-label={`Remove charge line ${i + 1}`}
                        className="rounded p-1 text-zinc-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Common modifiers datalist */}
      <datalist id="common-modifiers">
        {['25', '59', 'GT', 'TC', '26', 'LT', 'RT', '50', '51', '52'].map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      {/* Footer: add row + total */}
      <div className="mt-2 flex items-center justify-between">
        {!locked && (
          <button
            type="button"
            onClick={addRow}
            title="Add another charge line (Alt+Enter)"
            aria-keyshortcuts="Alt+Enter"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            + Add Procedure
          </button>
        )}
        {locked && <div />}
        <div aria-live="polite" className="text-right">
          <span className="text-sm text-zinc-500">Total billed: </span>
          <span className="text-sm font-semibold text-zinc-900">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
