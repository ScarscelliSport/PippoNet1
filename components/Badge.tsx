export default function Badge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
        className ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {label}
    </span>
  );
}
