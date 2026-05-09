import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Users, Handshake, Globe, ArrowRight, Filter, ChevronDown } from 'lucide-react'
import { businessApi, matchApi } from '../api/businessApi'
import { StatCard, MiniStatRow } from '../components/StatCard'
import { CategoryBadge, ScoreBadge } from '../components/TagBadge'
import { useSocket } from '../hooks/useSocket'
import { useToast } from '../components/Toast'

export default function Dashboard() {
  const navigate = useNavigate()
  const toast = useToast()

  const [businesses, setBusinesses] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useSocket({
    new_match: (data) => {
      toast('New match found! 🎉', 'success')
      loadData()
    },
    match_accepted: () => loadData()
  })

  async function loadData() {
    try {
      const [bRes, mRes] = await Promise.all([
        businessApi.list({ limit: 50 }),
        matchApi.list()
      ])
      setBusinesses(bRes.data)
      setMatches(mRes.data)
    } catch {
      toast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const totalBusinesses = businesses.length
  const internalMatches = matches.filter(m => m.match_type === 'internal').length
  const accepted = matches.filter(m => m.status === 'accepted').length
  const industries = [...new Set(businesses.map(b => b.ai_tags?.category?.split('>')[0]?.trim()).filter(Boolean))].length

  const topMatches = matches
    .filter(m => m.match_type === 'internal' && m.status !== 'rejected')
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const recentBusinesses = businesses.slice(0, 6)

  // Category distribution for mini stats
  const catMap = businesses.reduce((acc, b) => {
    const cat = b.ai_tags?.category?.split('>')[0]?.trim() || 'Other'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})
  const catStats = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([cat, count]) => ({ cat, count, pct: `${Math.round(count / totalBusinesses * 100)}%` }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Page title area */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted mt-0.5">AI-powered B2B match overview</p>
        </div>
        <button onClick={() => navigate('/register')} className="btn-primary flex items-center gap-2">
          <span>Post Business</span> <ArrowRight size={14} />
        </button>
      </div>

      {/* Big stat + top stats row */}
      <div className="grid grid-cols-12 gap-4">
        {/* Main stat — dark card */}
        <div className="col-span-4 card-dark p-6 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Best Match</p>
            <span className="text-white/20">★</span>
          </div>
          {topMatches[0] ? (
            <>
              <div>
                <p className="text-3xl font-bold text-white">
                  {Math.round(topMatches[0].score * 100)}%
                </p>
                <p className="text-sm text-white/60 mt-1 line-clamp-1">
                  {topMatches[0].business_a?.name} ↔ {topMatches[0].business_b?.name}
                </p>
              </div>
              <button
                onClick={() => navigate('/network')}
                className="mt-4 flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
              >
                View in network <ArrowRight size={11} />
              </button>
            </>
          ) : (
            <p className="text-white/40 text-sm">No matches yet. Post a business!</p>
          )}
        </div>

        {/* 3 stat cards */}
        <div className="col-span-8 grid grid-cols-3 gap-4">
          <StatCard
            label="Businesses"
            value={totalBusinesses}
            sub="registered on platform"
            trend={12}
          />
          <StatCard
            label="AI Matches"
            value={internalMatches}
            sub="internal connections found"
            trend={8}
          />
          <StatCard
            label="Connected"
            value={accepted}
            sub="collaborations accepted"
          />
        </div>
      </div>

      {/* Middle row: top matches list + category breakdown + industries */}
      <div className="grid grid-cols-12 gap-4">

        {/* Top matches table — wide card */}
        <div className="col-span-7 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Top Matches by Score</h2>
            <div className="flex items-center gap-2">
              <button className="btn-ghost flex items-center gap-1 text-xs">
                <Filter size={12} /> Filters
              </button>
            </div>
          </div>
          {topMatches.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">No matches yet.</p>
          ) : (
            <div className="space-y-0">
              {topMatches.map(m => {
                const a = m.business_a
                const b = m.business_b
                return (
                  <div
                    key={m._id}
                    onClick={() => navigate(`/businesses/${a?._id}`)}
                    className="flex items-center gap-3 py-3 border-b border-border last:border-0 hover:bg-bg/60 -mx-2 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-accent-light text-accent font-bold text-sm flex-shrink-0">
                      {(a?.name || '?')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {a?.name} <span className="text-text-muted font-normal">↔</span> {b?.name}
                      </p>
                      <p className="text-xs text-text-muted truncate">{m.reason}</p>
                    </div>
                    <ScoreBadge score={m.score} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      m.status === 'accepted' ? 'bg-green-50 text-green-700' :
                      m.status === 'rejected' ? 'bg-gray-100 text-gray-500' :
                      'bg-orange-50 text-orange-600'
                    }`}>{m.status}</span>
                  </div>
                )
              })}
            </div>
          )}
          <button
            onClick={() => navigate('/matches')}
            className="mt-3 text-xs text-accent font-medium hover:underline"
          >
            View all matches →
          </button>
        </div>

        {/* Right column */}
        <div className="col-span-5 flex flex-col gap-4">
          {/* Industry breakdown */}
          <div className="card p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-primary">Industries</h2>
              <span className="text-xs text-text-muted">{industries} sectors</span>
            </div>
            {catStats.map(({ cat, count, pct }) => (
              <MiniStatRow
                key={cat}
                label={cat}
                value={count}
                pct={pct}
                avatar={cat[0]}
              />
            ))}
            {catStats.length === 0 && (
              <p className="text-xs text-text-muted text-center py-4">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: recent businesses grid */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Recent Businesses</h2>
          <button
            onClick={() => navigate('/businesses')}
            className="text-xs text-accent font-medium hover:underline"
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {recentBusinesses.map(b => (
            <div
              key={b._id}
              onClick={() => navigate(`/businesses/${b._id}`)}
              className="p-3 rounded-xl border border-border hover:border-accent/30 hover:shadow-card-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-accent-light text-accent font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {b.name[0]}
                </div>
                <p className="text-sm font-medium text-text-primary truncate">{b.name}</p>
              </div>
              <CategoryBadge category={b.ai_tags?.category} />
              <p className="text-xs text-text-muted mt-1.5 truncate">{b.address}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
