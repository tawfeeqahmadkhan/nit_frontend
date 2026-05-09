import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, ArrowRight, MapPin, CheckCircle, Building2 } from 'lucide-react'
import { businessApi } from '../api/businessApi'
import { useBusiness } from '../context/BusinessContext'
import { CategoryBadge, TagBadge } from '../components/TagBadge'
import logoFull from '../assets/logo.png'

export default function SelectBusiness() {
  const navigate = useNavigate()
  const { selectBusiness, current } = useBusiness()

  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selecting, setSelecting] = useState(null)

  useEffect(() => {
    businessApi.list({ limit: 100 })
      .then(res => setBusinesses(res.data))
      .finally(() => setLoading(false))
  }, [])

  function handleSelect(biz) {
    setSelecting(biz._id)
    selectBusiness(biz)
    setTimeout(() => navigate('/my-dashboard'), 300)
  }

  const filtered = businesses.filter(b =>
    !search ||
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.address?.toLowerCase().includes(search.toLowerCase()) ||
    b.owner_email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-surface border-b border-border">
        <img
          src={logoFull}
          alt="SolveNet"
          className="h-9 w-auto object-contain cursor-pointer"
          onClick={() => navigate('/')}
        />
        <button onClick={() => navigate('/')} className="btn-ghost text-sm">← Back to Home</button>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-text-primary mb-2">Which business are you?</h1>
          <p className="text-text-secondary text-sm">
            Select your business to see your personal dashboard, matches, and connections.
            <br />New here? Register your business below.
          </p>
        </div>

        {/* Currently selected banner */}
        {current && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-accent-light border border-accent/20 rounded-xl">
            <CheckCircle size={16} className="text-accent flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-accent truncate">
                Currently signed in as: {current.name}
              </p>
              <p className="text-xs text-accent/70">{current.address}</p>
            </div>
            <button
              onClick={() => navigate('/my-dashboard')}
              className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline flex-shrink-0"
            >
              Go to my dashboard <ArrowRight size={12} />
            </button>
          </div>
        )}

        {/* Register CTA */}
        <button
          onClick={() => navigate('/register')}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-dashed border-border hover:border-accent/40 hover:bg-accent-light/30 transition-all group mb-6"
        >
          <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Plus size={18} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-text-primary">Register a New Business</p>
            <p className="text-xs text-text-muted">Post your services and challenges — AI finds your matches</p>
          </div>
          <ArrowRight size={14} className="ml-auto text-text-muted group-hover:text-accent transition-colors" />
        </button>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            className="input pl-8"
            placeholder="Search by business name, email, location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Business grid */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(biz => {
              const isActive = current?._id === biz._id
              const isSelecting = selecting === biz._id
              return (
                <button
                  key={biz._id}
                  onClick={() => handleSelect(biz)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all hover:shadow-card-md ${
                    isActive
                      ? 'border-accent bg-accent-light'
                      : 'border-border bg-surface hover:border-accent/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl font-bold text-base flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-accent text-white' : 'bg-accent-light text-accent'
                    }`}>
                      {isSelecting ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : biz.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary truncate">{biz.name}</p>
                        {isActive && <CheckCircle size={13} className="text-accent flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-text-muted flex-shrink-0" />
                        <p className="text-xs text-text-muted truncate">{biz.address}</p>
                      </div>
                      <div className="mt-2">
                        <CategoryBadge category={biz.ai_tags?.category} />
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-text-muted">{biz.matched_businesses?.length || 0} matches</p>
                    </div>
                  </div>

                  {biz.services?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border">
                      {biz.services.slice(0, 3).map(s => (
                        <TagBadge key={s} tag={s} variant="solution" />
                      ))}
                      {biz.services.length > 3 && (
                        <span className="text-xs text-text-muted">+{biz.services.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}

            {filtered.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-16 gap-3 text-center">
                <Building2 size={28} className="text-text-muted" />
                <p className="text-sm text-text-muted">No businesses found.<br />Be the first to register!</p>
                <button onClick={() => navigate('/register')} className="btn-primary mt-2">
                  Register Your Business
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
