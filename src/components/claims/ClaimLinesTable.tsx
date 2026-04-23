import type { ClaimLine } from '@/types/claim';

const LETTERS = 'ABCDEFGHIJKL';

function fmt(value: string | null | undefined, prefix = ''): string {
  if (!value) return '—';
  const n = parseFloat(value);
  if (isNaN(n)) return '—';
  return (
    prefix +
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  );
}

function fmtCurrency(value: string | null | undefined): string {
  return fmt(value);
}

function sumLines(lines: ClaimLine[], field: keyof ClaimLine): number {
  return lines.reduce((acc, l) => {
    const v = l[field];
    if (typeof v !== 'string') return acc;
    const n = parseFloat(v);
    return acc + (isNaN(n) ? 0 : n);
  }, 0);
}

function formatTotal(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

interface ClaimLinesTableProps {
  lines: ClaimLine[];
}

export function ClaimLinesTable({ lines }: ClaimLinesTableProps) {
  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
        <p className="text-sm text-zinc-500">No claim lines recorded.</p>
      </div>
    );
  }

  const totalBilled = sumLines(lines, 'fee');
  const totalPaid = sumLines(lines, 'paidAmount');

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              CPT
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              Modifiers
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              Dx
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
              Units
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
              Fee
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
              Allowed
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
              Paid
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
              Adjustment
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              Adj Code
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {lines.map((line) => {
            const modStr = (line.modifiers ?? []).filter(Boolean).join(', ') || '—';
            const dxStr =
              line.diagnosisPointers
                .map((p) => LETTERS[p - 1] ?? String(p))
                .join(', ') || '—';
            return (
              <tr key={line.id} className="px-4 py-3 text-sm text-zinc-700">
                <td className="px-4 py-3 font-mono text-sm text-zinc-900">{line.cptCode}</td>
                <td className="px-4 py-3 text-sm text-zinc-700">{modStr}</td>
                <td className="px-4 py-3 text-sm text-zinc-700">{dxStr}</td>
                <td className="px-4 py-3 text-right text-sm text-zinc-700">{line.units}</td>
                <td className="px-4 py-3 text-right text-sm text-zinc-700">{fmtCurrency(line.fee)}</td>
                <td className="px-4 py-3 text-right text-sm text-zinc-700">{fmtCurrency(line.allowedAmount)}</td>
                <td className="px-4 py-3 text-right text-sm font-medium text-green-700">
                  {fmtCurrency(line.paidAmount)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-zinc-700">
                  {fmtCurrency(line.adjustmentAmount)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-700">{line.adjustmentCode ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-zinc-200 bg-zinc-50">
            <td colSpan={4} className="px-4 py-3 text-right text-sm text-zinc-500">
              Total billed:
            </td>
            <td className="px-4 py-3 text-right text-sm font-semibold text-zinc-900">
              {formatTotal(totalBilled)}
            </td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3 text-right text-sm font-semibold text-green-700">
              {formatTotal(totalPaid)}
            </td>
            <td colSpan={2} className="px-4 py-3" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
