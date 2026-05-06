import Link from 'next/link';

const navItems = [
  { href: '/patients', label: 'Patients' },
  { href: '/providers', label: 'Providers' },
  { href: '/payers', label: 'Payers' },
  { href: '/charges', label: 'Charges' },
  { href: '/claims', label: 'Claims' },
  { href: '/payments', label: 'Payments' },
  { href: '/denials', label: 'Denials' },
  { href: '/ar', label: 'AR' },
  { href: '/admin/clearinghouse-config', label: 'Clearinghouse' },
];

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-zinc-200 bg-white">
        <div className="px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">MedBilling</p>
        </div>
        <nav aria-label="Main navigation">
          <ul className="space-y-0.5 px-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-zinc-50">
        {children}
      </main>
    </div>
  );
}
