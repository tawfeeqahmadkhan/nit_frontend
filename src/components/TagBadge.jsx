const CATEGORY_STYLES = {
  Manufacturing: 'bg-blue-50 text-blue-700',
  Logistics:     'bg-orange-50 text-orange-700',
  Agriculture:   'bg-green-50 text-green-700',
  Technology:    'bg-purple-50 text-purple-700',
  Retail:        'bg-pink-50 text-pink-700',
  Food:          'bg-yellow-50 text-yellow-700',
  Healthcare:    'bg-teal-50 text-teal-700',
  Finance:       'bg-slate-100 text-slate-700',
}

function getCategoryStyle(category = '') {
  const key = Object.keys(CATEGORY_STYLES).find(k =>
    category.toLowerCase().includes(k.toLowerCase())
  )
  return CATEGORY_STYLES[key] || 'bg-gray-100 text-gray-600'
}

export function CategoryBadge({ category }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle(category)}`}>
      {category || 'Uncategorized'}
    </span>
  )
}

export function TagBadge({ tag, variant = 'default' }) {
  const styles = {
    default:  'bg-bg text-text-secondary border border-border',
    problem:  'bg-red-50 text-red-700 border border-red-100',
    solution: 'bg-green-50 text-green-700 border border-green-100',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${styles[variant]}`}>
      {tag}
    </span>
  )
}

export function ScoreBadge({ score }) {
  const pct = Math.round(score * 100)
  const color = pct >= 80 ? 'text-green-600 bg-green-50' : pct >= 65 ? 'text-orange-600 bg-orange-50' : 'text-text-secondary bg-bg'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {pct >= 80 ? '↑' : ''}{pct}%
    </span>
  )
}
