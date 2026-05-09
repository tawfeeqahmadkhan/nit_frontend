export function StatCard({ label, value, sub, trend, dark = false, className = '' }) {
  return (
    <div className={`${dark ? 'card-dark' : 'card'} p-5 ${className}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${dark ? 'text-white/50' : 'text-text-muted'}`}>
        {label}
      </p>
      <p className={`text-3xl font-bold tracking-tight ${dark ? 'text-white' : 'text-text-primary'}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-1 ${dark ? 'text-white/40' : 'text-text-muted'}`}>{sub}</p>
      )}
      {trend != null && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          {dark && <span className="text-xs text-white/30">vs last week</span>}
        </div>
      )}
    </div>
  )
}

export function MiniStatRow({ label, value, pct, avatar }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      {avatar && (
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-accent-light text-accent text-xs font-bold flex-shrink-0">
          {avatar}
        </div>
      )}
      <span className="flex-1 text-sm text-text-primary font-medium truncate">{label}</span>
      <span className="text-sm font-semibold text-text-primary">{value}</span>
      <span className="text-xs text-text-muted w-10 text-right">{pct}</span>
    </div>
  )
}
