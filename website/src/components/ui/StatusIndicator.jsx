export default function StatusIndicator({ value, label, status = 'safe' }) {
  const colorMap = {
    safe: 'text-green-400',
    warning: 'text-yellow-400',
    risk: 'text-red-400',
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`text-2xl font-bold font-mono ${colorMap[status]}`}>{value}</span>
      <span className="text-sm text-white/60">{label}</span>
    </div>
  )
}
