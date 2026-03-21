'use client';

export default function DeleteButton({
  label,
  confirmMessage,
}: {
  label?: string;
  confirmMessage: string;
}) {
  return (
    <button
      type="submit"
      className="text-xs text-red-500 hover:text-red-400 transition-colors"
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {label ?? 'Delete'}
    </button>
  );
}
