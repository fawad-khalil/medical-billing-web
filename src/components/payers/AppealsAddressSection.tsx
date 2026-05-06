'use client';

interface AppealsAddressSectionProps {
  values: {
    appealsAddress?: string;
    appealsCity?: string;
    appealsState?: string;
    appealsZip?: string;
    appealsPhone?: string;
    appealsFax?: string;
  };
  onChange: (field: string, value: string) => void;
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

export function AppealsAddressSection({ values, onChange }: AppealsAddressSectionProps) {
  return (
    <fieldset>
      <legend className="block text-sm font-medium text-zinc-700">Appeals / Correspondence Address</legend>
      <p className="mt-0.5 text-xs text-zinc-500">Used for paper appeals and correspondence. Leave blank to use payer portal.</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="appealsAddress" className="block text-xs font-medium text-zinc-600">Street Address</label>
          <input
            id="appealsAddress"
            type="text"
            value={values.appealsAddress ?? ''}
            onChange={(e) => onChange('appealsAddress', e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="appealsCity" className="block text-xs font-medium text-zinc-600">City</label>
          <input
            id="appealsCity"
            type="text"
            value={values.appealsCity ?? ''}
            onChange={(e) => onChange('appealsCity', e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="appealsState" className="block text-xs font-medium text-zinc-600">State</label>
            <select
              id="appealsState"
              value={values.appealsState ?? ''}
              onChange={(e) => onChange('appealsState', e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">—</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="appealsZip" className="block text-xs font-medium text-zinc-600">ZIP</label>
            <input
              id="appealsZip"
              type="text"
              value={values.appealsZip ?? ''}
              onChange={(e) => onChange('appealsZip', e.target.value)}
              maxLength={10}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label htmlFor="appealsPhone" className="block text-xs font-medium text-zinc-600">Phone</label>
          <input
            id="appealsPhone"
            type="tel"
            value={values.appealsPhone ?? ''}
            onChange={(e) => onChange('appealsPhone', e.target.value)}
            placeholder="e.g. 800-555-0100"
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="appealsFax" className="block text-xs font-medium text-zinc-600">Fax</label>
          <input
            id="appealsFax"
            type="tel"
            value={values.appealsFax ?? ''}
            onChange={(e) => onChange('appealsFax', e.target.value)}
            placeholder="e.g. 800-555-0101"
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </fieldset>
  );
}
