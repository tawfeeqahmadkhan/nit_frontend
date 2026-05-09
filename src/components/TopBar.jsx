import { Bell, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBusiness } from '../context/BusinessContext'

export default function TopBar() {
  const navigate = useNavigate()
  const { current } = useBusiness()
  const [realtime, setRealtime] = useState(true)

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-surface border-b border-border sticky top-0 z-30">
      {/* Page context */}
      <div className="flex items-center gap-3">
        {current ? (
          <button
            onClick={() => navigate('/select')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border hover:bg-bg transition-colors"
          >
            <div className="w-5 h-5 rounded-md bg-accent text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
              {current.name?.[0]}
            </div>
            <span className="text-sm font-medium text-text-primary">{current.name}</span>
            <span className="text-xs text-text-muted truncate max-w-[120px]">{current.address?.split(',')[0]}</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/select')}
            className="text-sm font-medium text-text-muted hover:text-accent transition-colors"
          >
            Select Your Business →
          </button>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Realtime toggle */}
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <button
            onClick={() => setRealtime(!realtime)}
            className={`relative w-9 h-5 rounded-full transition-colors ${realtime ? 'bg-accent' : 'bg-border'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${realtime ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          <span>Live</span>
        </div>

        {/* Notification bell */}
        <button className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-bg border border-border text-text-secondary hover:text-text-primary transition-colors">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        </button>

        {/* Post Business */}
        <button
          onClick={() => navigate('/register')}
          className="btn-primary flex items-center gap-1.5 text-xs"
        >
          <Plus size={13} /> Post Business
        </button>

        {/* Current business avatar */}
        {current ? (
          <div
            onClick={() => navigate('/select')}
            title={current.name}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-white text-xs font-bold cursor-pointer select-none border-2 border-accent-hover"
          >
            {current.name?.[0]}
          </div>
        ) : (
          <div
            onClick={() => navigate('/select')}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-card-dark text-white text-xs font-bold cursor-pointer border-2 border-surface"
          >
            ?
          </div>
        )}
      </div>
    </header>
  )
}
