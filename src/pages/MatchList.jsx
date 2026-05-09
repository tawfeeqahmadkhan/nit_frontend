import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { matchApi } from '../api/businessApi'
import MatchCard from '../components/MatchCard'
import { Loader2, LayoutDashboard } from 'lucide-react'
import { useToast } from '../components/Toast'
import { useBusiness } from '../context/BusinessContext'

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Connected', value: 'accepted' },
  { label: 'Dismissed', value: 'rejected' },
]

export default function MatchList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { current } = useBusiness()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const activeStatus = searchParams.get('status') || ''
  const myOnly = searchParams.get('mine') === '1'

  async function load() {
    setLoading(true)
    try {
      const params = {}
      if (activeStatus) params.status = activeStatus
      const res = await matchApi.list(params)
      let data = res.data
      // Filter to current business only when "mine" toggle is active
      if (myOnly && current?._id) {
        const myId = current._id.toString()
        data = data.filter(m => {
          const aId = m.business_a?._id?.toString() || m.business_a?.toString()
          const bId = m.business_b?._id?.toString() || m.business_b?.toString()
          return aId === myId || bId === myId
        })
      }
      setMatches(data)
    } catch {
      toast('Failed to load matches', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [activeStatus, myOnly])

  const internal = matches.filter(m => m.match_type === 'internal')
  const external = matches.filter(m => m.match_type === 'external')

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Matches</h1>
          <p className="text-sm text-text-muted mt-0.5">{matches.length} total · {internal.length} internal · {external.length} external</p>
        </div>
        <div className="flex items-center gap-2">
          {current && (
            <button
              onClick={() => {
                const next = new URLSearchParams(searchParams)
                if (myOnly) next.delete('mine')
                else next.set('mine', '1')
                setSearchParams(next)
              }}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
                myOnly
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              <LayoutDashboard size={12} />
              {myOnly ? `${current.name}'s matches` : 'All matches'}
            </button>
          )}
          {current && (
            <button
              onClick={() => navigate('/my-dashboard')}
              className="btn-ghost text-xs border border-border"
            >
              My Dashboard →
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-bg rounded-xl border border-border w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setSearchParams(tab.value ? { status: tab.value } : {})}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeStatus === tab.value
                ? 'bg-surface shadow-card text-text-primary'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-accent" size={24} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {matches.map(m => (
            <MatchCard key={m._id} match={m} onUpdate={load} />
          ))}
          {matches.length === 0 && (
            <div className="col-span-2 text-center py-16 text-text-muted">
              <p>No matches in this category yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
