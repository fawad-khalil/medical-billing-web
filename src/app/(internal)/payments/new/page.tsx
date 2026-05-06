'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCreateBatch } from '@/hooks/usePaymentBatches';
import type { PaymentType, CreateBatchInput } from '@/types/payment-posting';

export default function NewBatchPage() {
  const router = useRouter();
  const createBatch = useCreateBatch();

  const [paymentType, setPaymentType] = useState<PaymentType>('INSURANCE');
  const [paymentDate, setPaymentDate] = useState('');
  const [payerId, setPayerId] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [checkDate, setCheckDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!paymentDate) errs.paymentDate = 'Payment date is required';
    if (!totalAmount || parseFloat(totalAmount) < 0) errs.totalAmount = 'Amount must be greater than or equal to zero';
    if (paymentType === 'INSURANCE' && !payerId) errs.payerId = 'Select a payer';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setServerError('');
    try {
      const data: CreateBatchInput = {
        paymentDate,
        paymentType,
        payerId: paymentType === 'INSURANCE' ? payerId : undefined,
        checkNumber: checkNumber || undefined,
        checkDate: checkDate || undefined,
        totalAmount: parseFloat(totalAmount).toFixed(2),
        notes: notes || undefined,
      };
      const batch = await createBatch.mutateAsync(data);
      router.push(`/payments/${batch.id}`);
    } catch {
      setServerError('Could not create batch — check your connection and try again.');
    }
  }

  const types: Array<{ value: PaymentType; label: string }> = [
    { value: 'INSURANCE', label: 'Insurance' },
    { value: 'PATIENT', label: 'Patient' },
    { value: 'ADJUSTMENT', label: 'Adjustment' },
  ];

  return (
    <div className="px-6 py-8 bg-zinc-50 min-h-full">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/payments" className="text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          Payment Batches
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-700">New Batch</span>
      </nav>

      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">New Payment Batch</h1>

      <div className="max-w-2xl rounded-lg border border-zinc-200 bg-white p-6">
        <form onSubmit={handleSubmit} noValidate>
          {/* Payment Type */}
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-zinc-700">Payment Type</p>
            <div role="group" aria-label="Payment type" className="flex gap-0 rounded-md border border-zinc-300 bg-zinc-50 p-0.5 w-fit">
              {types.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={paymentType === t.value}
                  onClick={() => setPaymentType(t.value)}
                  className={`rounded px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    paymentType === t.value
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="payment-date" className="block text-sm font-medium text-zinc-700 mb-1">
                Payment Date <span aria-hidden="true">*</span>
              </label>
              <input id="payment-date" type="date" value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className={`w-full rounded-md border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${errors.paymentDate ? 'border-red-500 bg-red-50' : 'border-zinc-300'}`}
              />
              {errors.paymentDate && <p className="mt-0.5 text-xs text-red-600">{errors.paymentDate}</p>}
            </div>

            {paymentType === 'INSURANCE' && (
              <div>
                <label htmlFor="payer-id" className="block text-sm font-medium text-zinc-700 mb-1">
                  Payer <span aria-hidden="true">*</span>
                </label>
                <input id="payer-id" type="text" value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                  placeholder="Payer ID (UUID)"
                  className={`w-full rounded-md border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${errors.payerId ? 'border-red-500 bg-red-50' : 'border-zinc-300'}`}
                />
                {errors.payerId && <p className="mt-0.5 text-xs text-red-600">{errors.payerId}</p>}
              </div>
            )}

            <div>
              <label htmlFor="check-number" className="block text-sm font-medium text-zinc-700 mb-1">Check / EFT Number</label>
              <input id="check-number" type="text" value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                placeholder="e.g. 45892"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              />
            </div>

            <div>
              <label htmlFor="total-amount" className="block text-sm font-medium text-zinc-700 mb-1">
                Total Amount <span aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                <input id="total-amount" type="number" min="0" step="0.01" value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full rounded-md border py-2 pl-7 pr-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${errors.totalAmount ? 'border-red-500 bg-red-50' : 'border-zinc-300'}`}
                />
              </div>
              {errors.totalAmount && <p className="mt-0.5 text-xs text-red-600">{errors.totalAmount}</p>}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="notes" className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
            <textarea id="notes" rows={2} value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            />
          </div>

          {serverError && (
            <p role="alert" className="mt-3 text-sm text-red-600">{serverError}</p>
          )}

          <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-4">
            <Link href="/payments"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              Cancel
            </Link>
            <button type="submit" disabled={createBatch.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50">
              {createBatch.isPending ? 'Creating…' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
