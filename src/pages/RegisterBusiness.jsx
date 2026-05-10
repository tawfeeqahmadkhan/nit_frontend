import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, X, Check, Loader2, Eye, EyeOff,
  Building2, Wrench, AlertCircle, ClipboardList, MapPin, Mail,
  Lock, User, Zap, ArrowRight,
} from 'lucide-react'
import { authApi } from '../api/businessApi'
import { useToast } from '../components/Toast'
import { useBusiness } from '../context/BusinessContext'

// ─── Step metadata ────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Basic Info',  icon: Building2,    hint: 'Your identity on the platform' },
  { label: 'Services',    icon: Wrench,        hint: 'What you offer to others' },
  { label: 'Challenges',  icon: AlertCircle,   hint: 'What you need help with' },
  { label: 'Review',      icon: ClipboardList, hint: 'Confirm and submit' },
]

// ─── Tag input ────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange, placeholder, variant }) {
  const [input, setInput] = useState('')

  function addTag(val) {
    const t = val.trim()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
  }
  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input) }
    if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1))
  }

  const pill = variant === 'problem'
    ? 'bg-red-50 text-red-700 border border-red-100'
    : 'bg-green-50 text-green-700 border border-green-100'
  const ring = variant === 'problem' ? 'focus-within:ring-red-100 focus-within:border-red-300' : 'focus-within:ring-green-100 focus-within:border-green-300'

  return (
    <div className={`min-h-[100px] bg-bg border border-border rounded-2xl p-3 flex flex-wrap gap-2 focus-within:ring-2 transition-all cursor-text ${ring}`}>
      {tags.map(tag => (
        <span key={tag} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${pill}`}>
          {tag}
          <button onClick={() => onChange(tags.filter(t => t !== tag))} className="opacity-50 hover:opacity-100 ml-0.5">
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[150px] bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted py-1"
        placeholder={tags.length === 0 ? placeholder : 'Add more...'}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => input.trim() && addTag(input)}
      />
    </div>
  )
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, hint, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold text-text-secondary mb-1.5">
        {Icon && <Icon size={11} className="text-text-muted" />}
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-text-muted mt-1">{hint}</p>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RegisterBusiness() {
  const navigate   = useNavigate()
  const toast      = useToast()
  const { signIn } = useBusiness()

  const [step,       setStep]       = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(null)
  const [showPw,     setShowPw]     = useState(false)
  const [showPwC,    setShowPwC]    = useState(false)

  const [form, setForm] = useState({
    name: '', owner_email: '', password: '', password_confirm: '', address: '',
    services: [], challenges: [],
  })

  const update = (field, val) => setForm(p => ({ ...p, [field]: val }))

  function canNext() {
    if (step === 0) return form.name && form.owner_email && form.address &&
      form.password.length >= 6 && form.password === form.password_confirm
    if (step === 1) return form.services.length > 0
    if (step === 2) return form.challenges.length > 0
    return true
  }

  async function submit() {
    setSubmitting(true)
    try {
      const { name, owner_email, password, address, services, challenges } = form
      const res = await authApi.register({ name, owner_email, password, address, services, challenges })
      signIn(res.data.token, res.data.business)
      setDone(res.data.business)
      toast('Business registered! AI is finding your matches.', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Registration failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center px-4">
        <div className="w-20 h-20 rounded-3xl bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100">
          <Check size={34} strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-extrabold text-text-primary mb-2">You're all set!</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-8 max-w-xs mx-auto">
          AI is analyzing <strong>{done.name}</strong> and scanning for matching businesses in the background.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/my-dashboard')} className="btn-primary flex items-center gap-2 px-6 py-3">
            Go to Dashboard <ArrowRight size={14} />
          </button>
          <button onClick={() => navigate(`/businesses/${done._id}`)} className="btn-ghost border border-border px-6 py-3">
            View Profile
          </button>
        </div>
      </div>
    )
  }

  const progress = ((step) / (STEPS.length - 1)) * 100

  return (
    <div className="max-w-2xl mx-auto pb-12">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-accent-light flex items-center justify-center">
            <Building2 size={15} className="text-accent" />
          </div>
          <span className="text-xs font-bold text-accent uppercase tracking-widest">Register</span>
        </div>
        <h1 className="text-2xl font-extrabold text-text-primary">Post Your Business</h1>
        <p className="text-sm text-text-muted mt-1">Let AI find businesses that solve your challenges</p>
      </div>

      {/* ── Step indicator ── */}
      <div className="mb-8">
        {/* Progress bar */}
        <div className="h-1.5 bg-border rounded-full mb-5 overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step pills */}
        <div className="flex items-center gap-0">
          {STEPS.map(({ label, icon: Icon }, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${
                  i < step  ? 'bg-accent border-accent text-white' :
                  i === step ? 'bg-accent-light border-accent text-accent' :
                               'bg-surface border-border text-text-muted'
                }`}>
                  {i < step ? <Check size={13} strokeWidth={3} /> : <Icon size={14} />}
                </div>
                <div className="hidden sm:block">
                  <p className={`text-[11px] font-bold leading-none ${i <= step ? 'text-accent' : 'text-text-muted'}`}>{label}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{STEPS[i].hint}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 transition-colors ${i < step ? 'bg-accent' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="card p-7 mb-5 shadow-card-md">

        {/* Step 0 — Basic Info */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-text-primary">Basic Information</h2>
              <p className="text-xs text-text-muted mt-0.5">Your public identity on SolveNet</p>
            </div>
            <Field label="Business Name" icon={Building2}>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input className="input pl-9" placeholder="e.g. GreenPack Co." value={form.name} onChange={e => update('name', e.target.value)} autoFocus />
              </div>
            </Field>
            <Field label="Owner Email" icon={Mail} hint="You'll use this to sign in">
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input className="input pl-9" type="email" placeholder="you@company.com" value={form.owner_email} onChange={e => update('owner_email', e.target.value)} />
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Password" icon={Lock}>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    className="input pl-9 pr-9"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                    {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {form.password.length > 0 && form.password.length < 6 && (
                  <p className="text-[11px] text-red-500 mt-1">At least 6 characters</p>
                )}
              </Field>
              <Field label="Confirm Password" icon={Lock}>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    className={`input pl-9 pr-9 ${form.password_confirm && form.password !== form.password_confirm ? 'border-red-300 focus:border-red-400' : form.password_confirm && form.password === form.password_confirm ? 'border-green-300' : ''}`}
                    type={showPwC ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={form.password_confirm}
                    onChange={e => update('password_confirm', e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPwC(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                    {showPwC ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {form.password_confirm && form.password !== form.password_confirm && (
                  <p className="text-[11px] text-red-500 mt-1">Passwords don't match</p>
                )}
                {form.password_confirm && form.password === form.password_confirm && form.password.length >= 6 && (
                  <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1"><Check size={9} /> Passwords match</p>
                )}
              </Field>
            </div>
            <Field label="Business Address" icon={MapPin} hint="Used to prioritize nearby matches">
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input className="input pl-9" placeholder="Mumbai, Maharashtra, India" value={form.address} onChange={e => update('address', e.target.value)} />
              </div>
            </Field>
          </div>
        )}

        {/* Step 1 — Services */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-text-primary">Your Services</h2>
              <p className="text-xs text-text-muted mt-0.5">What does your business offer to others?</p>
            </div>
            <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
              <p className="text-xs font-bold text-green-700 mb-1">💡 Tip for better matches</p>
              <p className="text-xs text-green-700/80 leading-relaxed">Be specific! Instead of "packaging", write "eco-friendly kraft paper packaging for food products". The more detail, the better your AI matches.</p>
            </div>
            <Field label="Services Offered" icon={Wrench} hint="Press Enter or comma after each service to add it">
              <TagInput tags={form.services} onChange={v => update('services', v)} placeholder="e.g. eco packaging, bulk supply, logistics..." variant="solution" />
            </Field>
            {form.services.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-green-700">
                <Check size={12} /> <span><strong>{form.services.length}</strong> service{form.services.length !== 1 ? 's' : ''} added</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Challenges */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-text-primary">Your Challenges</h2>
              <p className="text-xs text-text-muted mt-0.5">What problems is your business facing?</p>
            </div>
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
              <p className="text-xs font-bold text-red-700 mb-1">💡 Tip for better matches</p>
              <p className="text-xs text-red-700/80 leading-relaxed">Describe the problem, not just the category. Instead of "supplier", write "need reliable raw cotton supplier for textile production at scale". This helps AI find the right solution providers.</p>
            </div>
            <Field label="Challenges / Problems" icon={AlertCircle} hint="Press Enter or comma after each challenge to add it">
              <TagInput tags={form.challenges} onChange={v => update('challenges', v)} placeholder="e.g. need raw material supplier, delivery delays..." variant="problem" />
            </Field>
            {form.challenges.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-red-700">
                <Check size={12} /> <span><strong>{form.challenges.length}</strong> challenge{form.challenges.length !== 1 ? 's' : ''} added</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-text-primary">Review &amp; Submit</h2>
              <p className="text-xs text-text-muted mt-0.5">Everything look right? Hit submit to go live.</p>
            </div>

            {/* Business identity */}
            <div className="p-4 bg-bg rounded-2xl border border-border">
              <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-3">Business Identity</p>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-light text-accent font-extrabold text-lg flex items-center justify-center flex-shrink-0">
                  {form.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-text-primary">{form.name}</p>
                  <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5"><Mail size={10} /> {form.owner_email}</p>
                  <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5"><MapPin size={10} /> {form.address}</p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="p-4 bg-green-50/60 rounded-2xl border border-green-100">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] text-green-700 uppercase font-bold tracking-widest">Services you offer</p>
                <button onClick={() => setStep(1)} className="text-[10px] text-green-600 hover:underline">Edit</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.services.map(s => (
                  <span key={s} className="px-2.5 py-1 rounded-xl bg-green-100 text-green-700 text-xs font-semibold">{s}</span>
                ))}
              </div>
            </div>

            {/* Challenges */}
            <div className="p-4 bg-red-50/60 rounded-2xl border border-red-100">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] text-red-700 uppercase font-bold tracking-widest">Challenges you face</p>
                <button onClick={() => setStep(2)} className="text-[10px] text-red-600 hover:underline">Edit</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.challenges.map(c => (
                  <span key={c} className="px-2.5 py-1 rounded-xl bg-red-100 text-red-700 text-xs font-semibold">{c}</span>
                ))}
              </div>
            </div>

            {/* AI notice */}
            <div className="flex items-start gap-3 p-4 bg-accent-light rounded-2xl border border-accent/20">
              <Zap size={16} className="text-accent flex-shrink-0 mt-0.5" />
              <p className="text-xs text-accent leading-relaxed">
                <strong>AI will immediately start</strong> tagging, categorizing, and finding matching businesses after you submit. Check your dashboard for results.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : navigate('/')}
          className="btn-ghost flex items-center gap-1.5 px-5 py-2.5"
        >
          <ChevronLeft size={15} /> {step === 0 ? 'Cancel' : 'Back'}
        </button>

        <div className="flex items-center gap-2">
          {/* Dot indicators */}
          <div className="flex gap-1 mr-2">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-accent' : 'w-1.5 bg-border'}`} />
            ))}
          </div>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-accent/20"
            >
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold px-7 py-2.5 rounded-xl transition-all shadow-md shadow-accent/25 hover:shadow-accent/40 disabled:opacity-50"
            >
              {submitting
                ? <><Loader2 size={14} className="animate-spin" /> Finding Matches...</>
                : <><Check size={14} /> Submit &amp; Find Matches</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
