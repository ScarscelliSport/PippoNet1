"use client";

import { useRef } from "react";

export default function AutoSubmitSelect({
  action,
  name,
  defaultValue,
  options,
  className,
  hiddenFields,
}: {
  action: (formData: FormData) => void | Promise<void>;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  className?: string;
  hiddenFields?: Record<string, string>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action}>
      {hiddenFields &&
        Object.entries(hiddenFields).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      <select
        name={name}
        defaultValue={defaultValue}
        className={className}
        onChange={() => formRef.current?.requestSubmit()}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </form>
  );
}
