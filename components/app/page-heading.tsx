export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#3158d8]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[28px] font-semibold tracking-[-.04em] sm:text-[32px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69758a]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#ccd5e0] bg-white px-6 py-14 text-center">
      <div className="mx-auto grid size-11 place-items-center rounded-xl bg-[#edf2ff] text-[#3158d8]">
        {icon}
      </div>
      <h2 className="mt-5 text-lg font-semibold tracking-[-.02em]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#718095]">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
