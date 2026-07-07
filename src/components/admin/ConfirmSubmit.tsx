"use client";

export default function ConfirmSubmit({
  label,
  confirmText
}: {
  label: string;
  confirmText: string;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      className="rounded-lg border border-red-900 px-4 py-2 text-sm text-red-400 transition hover:border-red-700 hover:text-red-300"
    >
      {label}
    </button>
  );
}
