import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { SkeletonRow } from '@/components/ui/SkeletonRow';
import type { PatientListItem } from '@/types/patient';

interface PatientTableProps {
  patients: PatientListItem[];
  isLoading?: boolean;
  primaryPayers?: Record<string, string>; // patientId → payer name (optional enrichment)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

export function PatientTable({ patients, isLoading = false }: PatientTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500" aria-sort="ascending">
              Last Name
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              First Name
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              Chart #
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              Date Added
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
            : patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="cursor-pointer hover:bg-zinc-50"
                  onClick={() => { window.location.href = `/patients/${patient.id}`; }}
                >
                  <td className="px-4 py-3 text-sm font-medium text-zinc-900">{patient.lastName}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700">{patient.firstName}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{patient.chartNumber ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={patient.isActive ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{formatDate(patient.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/patients/${patient.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                      <Link
                        href={`/charges/new?patientId=${patient.id}`}
                        className="text-sm font-medium text-zinc-500 hover:text-zinc-700"
                      >
                        Add Charge
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
