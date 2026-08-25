export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading workspace">
      <div className="h-9 w-56 rounded-lg bg-[#e5eaf1]" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-36 rounded-2xl bg-[#e9edf3]" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-[#e9edf3]" />
    </div>
  );
}
