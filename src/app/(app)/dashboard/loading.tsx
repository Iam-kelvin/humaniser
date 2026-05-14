export default function DashboardLoading() {
  return (
    <div className="container-shell py-4 md:py-6 lg:py-8">
      <div className="grid gap-4 md:gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="panel h-32 animate-pulse bg-white/70 lg:h-72" />
        <div className="panel h-[28rem] animate-pulse bg-white/70" />
      </div>
    </div>
  );
}
