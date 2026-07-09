/**
 * 统计概览卡片 — PC端列表视图使用
 */
export default function StatCard({ label, value, color = 'gray', icon }) {
  const colors = {
    green: 'bg-green-50 text-green-700 border-green-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
  }

  return (
    <div className={`${colors[color]} rounded-xl p-4 border transition-all hover:shadow-sm`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm opacity-70">{label}</p>
        {icon && <span className="text-base opacity-50">{icon}</span>}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
