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
      className="rounded-lg border border-danger-border px-4 py-2 text-sm text-danger transition hover:border-danger hover:text-danger-strong"
    >
      {label}
    </button>
  );
}
