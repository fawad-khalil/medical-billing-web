interface EmptyStateProps {
  icon?: React.ReactNode;
  heading: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, heading, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-zinc-300">{icon}</div>}
      <p className="text-base font-semibold text-zinc-900">{heading}</p>
      <p className="mt-1 text-sm text-zinc-500">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
