export const StatCard = ({ title, value, hint, icon }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value ?? '-'}</p>
        </div>
        {icon ? <span className="h-8 w-8 text-slate-400" aria-hidden>{icon}</span> : null}
      </div>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
};

export default StatCard;


