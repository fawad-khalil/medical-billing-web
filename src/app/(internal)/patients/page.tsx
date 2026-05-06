'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PatientSearchBar } from '@/components/patients/PatientSearchBar';
import { PatientTable } from '@/components/patients/PatientTable';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePatients, usePatientSearch } from '@/hooks/usePatients';

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 25;

  const isSearching = searchQuery.trim().length >= 2;

  const listQuery = usePatients(page, LIMIT);
  const searchResults = usePatientSearch(searchQuery);

  const patients = isSearching
    ? (searchResults.data ?? [])
    : (listQuery.data?.data ?? []);

  const isLoading = isSearching ? searchResults.isLoading : listQuery.isLoading;
  const total = isSearching ? patients.length : (listQuery.data?.total ?? 0);
  const totalPages = Math.ceil(total / LIMIT);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  return (
    <div className="px-6 py-8">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Patients</h1>
          {!isSearching && listQuery.data && (
            <p className="mt-0.5 text-sm text-zinc-500">{listQuery.data.total} patients</p>
          )}
        </div>
        <Link
          href="/patients/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          + Add Patient
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <PatientSearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          isLoading={isSearching && searchResults.isLoading}
        />
      </div>

      {/* Error */}
      {listQuery.isError && !isSearching && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load patients. Please refresh.
        </div>
      )}

      {/* Table */}
      {!isLoading && patients.length === 0 ? (
        isSearching ? (
          <EmptyState
            heading={`No patients match "${searchQuery}"`}
            message="Try a different name, date of birth, or member ID."
            action={{ label: 'Clear search', onClick: () => handleSearchChange('') }}
          />
        ) : (
          <EmptyState
            heading="No patients yet"
            message="Add your first patient to get started."
            action={{ label: '+ Add Patient', onClick: () => { window.location.href = '/patients/new'; } }}
          />
        )
      ) : (
        <>
          <PatientTable patients={patients} isLoading={isLoading} />
          {!isSearching && total > LIMIT && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={LIMIT}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
