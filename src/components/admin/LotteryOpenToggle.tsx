"use client";

import {
  updateLotteryDrawOpen,
  updateLotterySpinEnabled
} from "@/app/[locale]/admin/(protected)/bookings/lottery-actions";

function Toggle({
  action,
  drawId,
  fieldName,
  id,
  defaultChecked,
  label
}: {
  action: (formData: FormData) => void;
  drawId: string;
  fieldName: string;
  id: string;
  defaultChecked: boolean;
  label: string;
}) {
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="drawId" value={drawId} />
      <input
        type="checkbox"
        id={id}
        name={fieldName}
        defaultChecked={defaultChecked}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-4 w-4"
      />
      <label htmlFor={id} className="text-sm text-fg-muted">
        {label}
      </label>
    </form>
  );
}

export default function LotteryOpenToggle({
  drawId,
  defaultOpen,
  openLabel
}: {
  drawId: string;
  defaultOpen: boolean;
  openLabel: string;
}) {
  return (
    <Toggle
      action={updateLotteryDrawOpen}
      drawId={drawId}
      fieldName="open"
      id="lottery-open"
      defaultChecked={defaultOpen}
      label={openLabel}
    />
  );
}

export function LotterySpinEnabledToggle({
  drawId,
  defaultSpinEnabled,
  label
}: {
  drawId: string;
  defaultSpinEnabled: boolean;
  label: string;
}) {
  return (
    <Toggle
      action={updateLotterySpinEnabled}
      drawId={drawId}
      fieldName="spinEnabled"
      id="lottery-spin-enabled"
      defaultChecked={defaultSpinEnabled}
      label={label}
    />
  );
}
