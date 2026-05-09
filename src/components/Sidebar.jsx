import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Network, MessageSquare,
  Star, Clock, ChevronDown, ChevronRight, Settings,
  UserCircle, LogOut, ArrowLeftRight
} from 'lucide-react'
import { useState } from 'react'
import { useBusiness } from '../context/BusinessContext'
import logoIcon from '../assets/full_logo.png'
import logoFull from '../assets/logo.png'

const railItems = [
  { icon: LayoutDashboard, to: '/my-dashboard', label: 'My Dashboard' },
  { icon: Building2,       to: '/businesses',   label: 'Businesses' },
  { icon: Network,         to: '/network',       label: 'Network' },
  { icon: MessageSquare,   to: '/messages',      label: 'Messages' },
]

function RailIcon({ icon: Icon, to, label }) {
  return (
    <NavLink
      to={to}
      title={label}
      className={({ isActive }) =>
        `flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
          isActive ? 'bg-accent text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
        }`
      }
    >
      <Icon size={19} />
    </NavLink>
  )
}

function NavSection({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 w-full px-3 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider hover:text-text-secondary transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {label}
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  )
}

function SubNavLink({ to, label, badge }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ml-2 ${
          isActive
            ? 'text-accent font-semibold'
            : 'text-text-secondary hover:text-text-primary hover:bg-border/40'
        }`
      }
    >
      <span>{label}</span>
      {badge != null && (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold">
          {badge}
        </span>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { current, clearBusiness } = useBusiness()
  const navigate = useNavigate()

  return (
    <aside className="flex h-screen fixed left-0 top-0 z-40">
      {/* Dark icon rail */}
      <div className="w-[56px] bg-rail flex flex-col items-center pt-4 pb-4 gap-2">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white mb-3 cursor-pointer overflow-hidden p-1"
          onClick={() => navigate('/')}
          title="SolveNet"
        >
          <img src={logoIcon} alt="SolveNet" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          {railItems.map(item => (
            <RailIcon key={item.to} {...item} />
          ))}
        </div>
        <NavLink to="/settings" title="Settings"
          className="flex items-center justify-center w-10 h-10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Settings size={19} />
        </NavLink>
      </div>

      {/* White nav panel */}
      <div className="w-52 bg-surface border-r border-border flex flex-col py-4 overflow-y-auto no-scrollbar">

        {/* Brand wordmark */}
        <div className="px-4 mb-4 cursor-pointer" onClick={() => navigate('/')}>
          <img src={logoFull} alt="SolveNet" className="h-8 w-auto object-contain object-left" />
        </div>

        {/* Current business identity */}
        {current ? (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-accent-light border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-accent text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                {current.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-accent truncate">{current.name}</p>
                <p className="text-[10px] text-accent/60 truncate">{current.address?.split(',')[0]}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('/login')}
                className="flex-1 flex items-center justify-center gap-1 text-[10px] text-accent/70 hover:text-accent py-1 rounded-lg hover:bg-accent/10 transition-colors"
              >
                <ArrowLeftRight size={9} /> Switch
              </button>
              <button
                onClick={() => { clearBusiness(); navigate('/login') }}
                className="flex-1 flex items-center justify-center gap-1 text-[10px] text-accent/70 hover:text-red-600 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut size={9} /> Sign out
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="mx-3 mb-3 flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-accent/30 hover:bg-accent-light/30 transition-all"
          >
            <UserCircle size={16} className="text-text-muted" />
            <span className="text-xs font-medium text-text-muted">Sign In to Your Business</span>
          </button>
        )}

        <div className="h-px bg-border mx-3 mb-3" />

        {/* Quick access */}
        <div className="px-3 mb-3 space-y-0.5">
          <button className="nav-item w-full text-left">
            <Star size={14} /> Starred
          </button>
          <button className="nav-item w-full text-left">
            <Clock size={14} /> Recent
          </button>
        </div>

        <div className="h-px bg-border mx-3 mb-3" />

        {/* My Business */}
        {current && (
          <>
            <NavSection label="My Business">
              <SubNavLink to="/my-dashboard" label="My Dashboard" />
              <SubNavLink to={`/businesses/${current._id}`} label="My Profile" />
            </NavSection>
            <div className="h-px bg-border mx-3 my-2" />
          </>
        )}

        {/* Businesses section */}
        <NavSection label="Businesses">
          <SubNavLink to="/businesses" label="All Businesses" />
          <SubNavLink to="/register" label="Post Business" />
        </NavSection>

        <div className="h-px bg-border mx-3 my-2" />

        {/* Matches section */}
        <NavSection label="Matches">
          <SubNavLink to="/matches" label="All Matches" />
          <SubNavLink to="/matches?status=pending" label="Pending" badge={5} />
          <SubNavLink to="/matches?status=accepted" label="Connected" />
          <NavLink
            to="/register"
            className="flex items-center gap-2 ml-2 px-3 py-1.5 rounded-lg text-sm text-accent font-semibold hover:bg-accent-light transition-colors"
          >
            New Match
          </NavLink>
        </NavSection>

        <div className="h-px bg-border mx-3 my-2" />

        {/* Network */}
        <NavSection label="Network" defaultOpen={false}>
          <SubNavLink to="/network" label="3D Graph" />
          <SubNavLink to="/network?filter=internal" label="Internal" />
          <SubNavLink to="/network?filter=external" label="External" />
        </NavSection>

        <div className="mt-auto px-3 pt-3 border-t border-border">
          <button className="nav-item w-full text-left text-xs">
            <Settings size={13} /> Manage Folders
          </button>
        </div>
      </div>
    </aside>
  )
}
