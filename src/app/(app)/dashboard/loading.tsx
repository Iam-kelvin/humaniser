export default function DashboardLoading() {
  return (
    <div className="container-shell py-8">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="panel h-72 animate-pulse bg-white/70" />
        <div className="panel h-[28rem] animate-pulse bg-white/70" />
      </div>
    </div>
  );
}
