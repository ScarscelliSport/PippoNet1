export default function Card({
  title,
  children,
  className,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg shadow-sm p-5 ${
        className ?? ""
      }`}
    >
      {title && (
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
