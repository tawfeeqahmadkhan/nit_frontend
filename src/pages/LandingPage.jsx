import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Zap, Network, Globe, Brain,
  MapPin, MessageSquare, TrendingUp, Building2,
  Users, CheckCircle, Star,
} from 'lucide-react'
import { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import logoFull from '../assets/logo.png'

// ─── 3D Scene ─────────────────────────────────────────────────────────────────

function FloatingOrb({ position, color, speed = 1, scale = 1 }) {
  const ref = useRef()
  const y0 = position[1]
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = y0 + Math.sin(clock.elapsedTime * speed) * 0.35
    ref.current.rotation.y = clock.elapsedTime * 0.3
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.22 * scale, 32, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.65} roughness={0.1} metalness={0.75} />
    </mesh>
  )
}

function PulsingCore() {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const s = 1 + Math.sin(clock.elapsedTime * 1.8) * 0.09
    ref.current.scale.set(s, s, s)
  })
  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <sphereGeometry args={[0.48, 32, 32]} />
      <meshStandardMaterial color="#F97316" emissive="#F97316" emissiveIntensity={0.9} roughness={0.05} metalness={0.9} />
    </mesh>
  )
}

function Beam({ start, end, index }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current?.material)
      ref.current.material.opacity = 0.25 + Math.sin(clock.elapsedTime * 1.1 + index) * 0.15
  })
  const geom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...start), new THREE.Vector3(...end),
  ])
  return (
    <line ref={ref} geometry={geom}>
      <lineBasicMaterial color="#F97316" opacity={0.3} transparent />
    </line>
  )
}

const ORB_DATA = [
  { position: [-2.9, 0.6, -0.6], color: '#3B82F6', speed: 0.6, scale: 1.2 },
  { position: [0.2, 2.3, -1.2],  color: '#22C55E', speed: 0.8, scale: 1.0 },
  { position: [2.9, 0.4, -0.4],  color: '#8B5CF6', speed: 0.5, scale: 1.3 },
  { position: [0.4, -2.1, 0.9],  color: '#EC4899', speed: 0.9, scale: 0.9 },
  { position: [-2.1, -1.3, -1.0],color: '#EAB308', speed: 0.7, scale: 1.1 },
  { position: [1.9, 1.6, 1.3],   color: '#06B6D4', speed: 0.6, scale: 0.8 },
  { position: [-1.3, 2.1, 1.0],  color: '#F43F5E', speed: 1.0, scale: 0.9 },
]
const BEAM_DATA = [
  [[-2.9,0.6,-0.6],[0,0,0]], [[0.2,2.3,-1.2],[0,0,0]],
  [[2.9,0.4,-0.4],[0,0,0]],  [[0.4,-2.1,0.9],[0,0,0]],
  [[-2.1,-1.3,-1.0],[0,0,0]],[[1.9,1.6,1.3],[0,0,0]],
  [[-1.3,2.1,1.0],[0,0,0]],  [[-2.9,0.6,-0.6],[0.2,2.3,-1.2]],
  [[2.9,0.4,-0.4],[1.9,1.6,1.3]], [[-2.1,-1.3,-1.0],[0.4,-2.1,0.9]],
]

function HeroScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[6, 6, 6]}  intensity={2.2} color="#F97316" />
      <pointLight position={[-6,-6,-6]} intensity={1.2} color="#166534" />
      <PulsingCore />
      {ORB_DATA.map((o, i) => <FloatingOrb key={i} {...o} />)}
      {BEAM_DATA.map((b, i) => <Beam key={i} start={b[0]} end={b[1]} index={i} />)}
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.9} />
    </>
  )
}

// ─── Static data ──────────────────────────────────────────────────────────────

const STEPS = [
  { n:'01', icon: Building2,    title: 'Post Your Business',   desc: 'Add your name, location, services and challenges in under 2 minutes.', accent: 'text-blue-500',   bg: 'bg-blue-50' },
  { n:'02', icon: Brain,        title: 'AI Analyzes & Tags',   desc: 'Groq LLaMA 3 categorizes your profile and extracts semantic keywords.',  accent: 'text-accent',    bg: 'bg-accent-light' },
  { n:'03', icon: MapPin,       title: 'Smart Geo Matching',   desc: 'AI scores every candidate by semantic fit plus geographic proximity.',   accent: 'text-green-600', bg: 'bg-green-50' },
  { n:'04', icon: MessageSquare,title: 'Connect & Collaborate',desc: 'Accept matches and message partners in real-time inside the platform.',  accent: 'text-purple-600',bg: 'bg-purple-50' },
]

const FEATURES = [
  { icon: Zap,           iconCls: 'bg-accent-light text-accent',   title: 'Groq LLaMA 3 Matching',   desc: 'Semantic understanding of your challenges — not just keyword search. AI reads context.',     badge: 'AI-Powered',   badgeCls: 'bg-accent-light text-accent' },
  { icon: Network,       iconCls: 'bg-purple-50 text-purple-600',  title: '3D Network Graph',         desc: 'Visualize every business and connection in an interactive rotating 3D network.',           badge: 'Live',         badgeCls: 'bg-purple-50 text-purple-600' },
  { icon: Globe,         iconCls: 'bg-blue-50 text-blue-600',      title: 'External Fallback Search', desc: 'No internal match? We search the web and AI-parse the most relevant businesses.',           badge: 'Smart',        badgeCls: 'bg-blue-50 text-blue-600' },
  { icon: MapPin,        iconCls: 'bg-green-50 text-green-600',    title: 'Geo-Proximity Boost',      desc: 'Local businesses get priority — nearby partners are easier to actually work with.',         badge: 'Local-First',  badgeCls: 'bg-green-50 text-green-600' },
  { icon: MessageSquare, iconCls: 'bg-rose-50 text-rose-500',      title: 'Built-in Messaging',       desc: 'Real-time chat between matched businesses. Everything lives in one place.',                 badge: 'Real-time',    badgeCls: 'bg-rose-50 text-rose-500' },
  { icon: TrendingUp,    iconCls: 'bg-amber-50 text-amber-600',    title: 'Personal Dashboard',       desc: 'Each business gets a private view of their matches, connection map and history.',          badge: 'Personal',     badgeCls: 'bg-amber-50 text-amber-600' },
]

const LIVE = [
  { a: 'FreshFarm Co.',  b: 'GreenPack Ltd.',  score: 92, label: 'Agriculture → Packaging', ago: '2 min ago' },
  { a: 'TechBridge AI',  b: 'LogiCore Inc.',   score: 87, label: 'Technology → Logistics',  ago: '8 min ago' },
  { a: 'NatureFiber',    b: 'EcoWeave Ltd.',   score: 91, label: 'Textile → Sustainability', ago: '15 min ago' },
]

const INDUSTRIES = [
  'Agriculture','Logistics','Technology','Manufacturing','Healthcare',
  'Finance','Retail','Energy','Education','Real Estate',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActiveStep(s => (s + 1) % 4), 2800)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-8 py-3 bg-surface/85 backdrop-blur-lg border-b border-border">
        <img
          src={logoFull} alt="SolveNet"
          className="h-9 w-auto object-contain cursor-pointer"
          onClick={() => navigate('/')}
        />
        <div className="hidden md:flex items-center gap-0.5">
          {[['Businesses','/businesses'],['Network','/network'],['Matches','/matches']].map(([l,r]) => (
            <button key={l} onClick={() => navigate(r)} className="btn-ghost text-sm">{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/login')} className="btn-ghost text-sm">Sign In</button>
          <button onClick={() => navigate('/register')} className="btn-primary flex items-center gap-1.5 text-sm shadow-sm">
            Post Business <ArrowRight size={13} />
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative px-8 pt-16 pb-20 max-w-7xl mx-auto overflow-hidden">
        {/* ambient glow */}
        <div className="pointer-events-none absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full bg-accent/6 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-[440px] h-[440px] rounded-full bg-[#166534]/6 blur-[100px]" />

        <div className="relative flex items-center gap-14">
          {/* left */}
          <div className="flex-1 max-w-[520px]">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-light border border-accent/30 text-accent text-xs font-bold mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              AI-Powered B2B Matching · Free · Real-time
            </div>

            <h1 className="text-[58px] font-extrabold text-text-primary leading-[1.08] tracking-tight mb-5">
              Your problem is<br />
              someone's{' '}
              <span className="relative inline-block text-accent">
                solution.
                <svg className="absolute -bottom-1 left-0 w-full" height="7" viewBox="0 0 200 7" preserveAspectRatio="none">
                  <path d="M0 6 Q100 1 200 6" stroke="#F97316" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.45" />
                </svg>
              </span>
            </h1>

            <p className="text-[17px] text-text-secondary leading-relaxed mb-9 max-w-[420px]">
              SolveNet uses AI to connect businesses that can solve each other's challenges.
              Post once. Get matched instantly.
            </p>

            <div className="flex items-center gap-3 mb-10">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-accent/30 hover:shadow-accent/45 hover:-translate-y-0.5 text-[15px]"
              >
                Enter Dashboard <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/network')}
                className="flex items-center gap-2 bg-surface border border-border hover:border-accent/40 hover:text-accent text-text-secondary font-semibold px-7 py-3.5 rounded-xl transition-all text-[15px] hover:-translate-y-0.5"
              >
                <Network size={16} /> Live Network
              </button>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-8 pt-6 border-t border-border">
              {[['15+','Businesses'],['12','AI Matches'],['5','Industries'],['100%','Free']].map(([v,l]) => (
                <div key={l}>
                  <p className="text-2xl font-extrabold text-text-primary leading-none">{v}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* right: 3D canvas */}
          <div className="w-[460px] h-[420px] flex-shrink-0 relative">
            <div className="absolute inset-0 rounded-2xl overflow-hidden ring-1 ring-border shadow-card-md">
              <Canvas camera={{ position:[0,0,7.2], fov:50 }} style={{ background:'#0B1A0B' }}>
                <Suspense fallback={null}><HeroScene /></Suspense>
              </Canvas>
            </div>
            {/* Floating chips */}
            <div className="absolute -left-5 top-10 bg-surface border border-border rounded-xl px-3 py-2 shadow-card-md flex items-center gap-2 text-xs font-semibold text-text-primary">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Match Found
            </div>
            <div className="absolute -right-5 bottom-14 bg-surface border border-border rounded-xl px-3 py-2 shadow-card-md flex items-center gap-2 text-xs font-semibold text-text-primary">
              <Zap size={11} className="text-accent" /> AI Score: 94%
            </div>
            <div className="absolute left-4 bottom-4 bg-surface/90 backdrop-blur border border-border rounded-xl px-3 py-2 flex items-center gap-1.5 text-[10px] font-semibold text-text-muted">
              <Star size={9} className="text-amber-400 fill-amber-400" /> Top match in Agriculture
            </div>
          </div>
        </div>
      </section>

      {/* ── Industry Ticker ─────────────────────────────────────────────────── */}
      <div className="border-y border-border bg-surface/60 py-3 overflow-hidden">
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {[...INDUSTRIES,...INDUSTRIES,...INDUSTRIES].map((ind, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-xs text-text-muted font-medium flex-shrink-0">
              <span className="w-1 h-1 rounded-full bg-accent/50" />{ind}
            </span>
          ))}
        </div>
      </div>

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section className="px-8 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-[11px] font-extrabold text-accent uppercase tracking-[0.15em] mb-3">How It Works</p>
          <h2 className="text-3xl font-extrabold text-text-primary mb-3">From Problem to Partnership</h2>
          <p className="text-text-muted text-sm max-w-sm mx-auto">Four simple steps from posting your business to finding the perfect match.</p>
        </div>

        {/* Step progress bar */}
        <div className="flex gap-2 mb-8 max-w-xs mx-auto">
          {STEPS.map((_,i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 cursor-pointer ${i === activeStep ? 'bg-accent' : 'bg-border'}`}
              onClick={() => setActiveStep(i)}
            />
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4">
          {STEPS.map(({ n, icon: Icon, title, desc, accent, bg }, i) => (
            <div
              key={n}
              onClick={() => setActiveStep(i)}
              className={`relative flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                activeStep === i
                  ? 'border-accent bg-accent-light shadow-card-md scale-[1.02]'
                  : 'border-transparent bg-surface hover:border-border hover:shadow-card'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all ${activeStep === i ? 'bg-accent text-white shadow-md shadow-accent/30' : `${bg} ${accent}`}`}>
                <Icon size={20} />
              </div>
              <span className={`text-[10px] font-extrabold tracking-widest mb-1 ${activeStep === i ? 'text-accent' : 'text-text-muted'}`}>{n}</span>
              <h3 className="text-sm font-bold text-text-primary mb-2">{title}</h3>
              <p className="text-[11px] text-text-secondary leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="px-8 py-20 bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-extrabold text-accent uppercase tracking-[0.15em] mb-3">Features</p>
            <h2 className="text-3xl font-extrabold text-text-primary mb-3">Everything in One Platform</h2>
            <p className="text-text-muted text-sm max-w-sm mx-auto">Built on the best free-tier AI — no hidden costs, no setup friction.</p>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, iconCls, title, desc, badge, badgeCls }) => (
              <div key={title} className="group card p-6 hover:shadow-card-md hover:-translate-y-1 transition-all">
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-11 h-11 rounded-2xl ${iconCls} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon size={20} />
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${badgeCls}`}>{badge}</span>
                </div>
                <h3 className="text-sm font-bold text-text-primary mb-2">{title}</h3>
                <p className="text-[12px] text-text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Activity ───────────────────────────────────────────────────── */}
      <section className="px-8 py-20 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[11px] font-extrabold text-accent uppercase tracking-[0.15em] mb-2">Live Activity</p>
            <h2 className="text-3xl font-extrabold text-text-primary">Matches Happening Now</h2>
          </div>
          <button
            onClick={() => navigate('/matches')}
            className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-accent transition-colors"
          >
            View all <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {LIVE.map((m, i) => (
            <div key={i} className="card p-5 hover:shadow-card-md transition-all group cursor-default">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] text-text-muted font-medium">{m.ago}</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                  <CheckCircle size={9} /> {m.score}% match
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 bg-bg rounded-xl px-3 py-2.5 text-xs font-bold text-text-primary truncate">{m.a}</div>
                <div className="w-8 h-8 rounded-full bg-accent-light border border-accent/20 flex items-center justify-center flex-shrink-0">
                  <ArrowRight size={12} className="text-accent" />
                </div>
                <div className="flex-1 bg-bg rounded-xl px-3 py-2.5 text-xs font-bold text-text-primary truncate text-right">{m.b}</div>
              </div>
              <p className="text-[11px] text-text-muted text-center font-medium">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="px-8 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl bg-card-dark overflow-hidden px-16 py-20 text-center">
            {/* glow blobs inside CTA */}
            <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-accent/20 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-[#166534]/30 blur-[80px]" />
            {/* grid dot texture */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
            />

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/70 text-xs font-bold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Free to use · No account required
              </div>
              <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
                Ready to find your match?
              </h2>
              <p className="text-white/50 text-base mb-10 max-w-sm mx-auto leading-relaxed">
                Post your business in under 2 minutes. AI handles matching, scoring and connecting.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold px-8 py-4 rounded-xl transition-all shadow-xl shadow-accent/35 hover:shadow-accent/55 hover:-translate-y-0.5 text-[15px]"
                >
                  Post Your Business <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => navigate('/businesses')}
                  className="flex items-center gap-2 bg-white/8 hover:bg-white/14 border border-white/15 text-white font-semibold px-8 py-4 rounded-xl transition-all text-[15px]"
                >
                  <Users size={16} /> Browse Businesses
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-8 py-6 bg-surface">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src={logoFull} alt="SolveNet" className="h-7 w-auto object-contain" />
            <div className="flex items-center gap-4">
              {[['Businesses','/businesses'],['Network','/network'],['Register','/register']].map(([l,r]) => (
                <button key={l} onClick={() => navigate(r)} className="text-xs text-text-muted hover:text-text-secondary transition-colors">{l}</button>
              ))}
            </div>
          </div>
          <p className="text-xs text-text-muted">Built for hackathon · Powered by Groq LLaMA 3</p>
        </div>
      </footer>
    </div>
  )
}
