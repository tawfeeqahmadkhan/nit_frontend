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

// Unified input class — 4px radius, cream fill, #E5E5E5 border, 150ms transitions
const inputCls = [
  'w-full bg-[#F5F4F1] border border-[#E5E5E5] rounded',
  'px-3 py-2.5 text-sm text-[#1A1A1A]',
  'placeholder:text-[#9CA3AF]',
  'focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]',
  'transition-all duration-150 ease-out',
].join(' ')

// ─── Tag input ────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange, placeholder }) {
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

  return (
    <div className="min-h-[100px] bg-[#F5F4F1] border border-[#E5E5E5] rounded p-3 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-[#F97316]/20 focus-within:border-[#F97316] transition-all duration-150 ease-out cursor-text">
      {tags.map(tag => (
        <span key={tag} className="flex items-center gap-1.5 px-2 py-1 rounded bg-white text-[#1A1A1A] border border-[#E5E5E5] text-xs font-medium">
          {tag}
          <button onClick={() => onChange(tags.filter(t => t !== tag))} className="opacity-40 hover:opacity-80 ml-0.5 transition-opacity duration-150">
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[150px] bg-transparent outline-none text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] py-1"
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
      <label className="flex items-center gap-1.5 text-[11px] uppercase font-semibold tracking-[0.5px] text-[#666666] mb-2">
        {Icon && <Icon size={11} className="text-[#9CA3AF]" />}
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-[#9CA3AF] mt-1.5">{hint}</p>}
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
        <div className="w-20 h-20 rounded-full bg-[#FFF7ED] text-[#F97316] flex items-center justify-center mx-auto mb-6">
          <Check size={34} strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">You're all set!</h2>
        <p className="text-[#888888] text-sm leading-relaxed mb-8 max-w-xs mx-auto">
          AI is analyzing <strong>{done.name}</strong> and scanning for matching businesses in the background.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/my-dashboard')}
            className="flex items-center gap-2 bg-[#F97316] hover:bg-[#E87D0D] text-white text-sm font-semibold px-6 py-3 rounded-[6px] transition-all duration-150 ease-out"
          >
            Go to Dashboard <ArrowRight size={14} />
          </button>
          <button
            onClick={() => navigate(`/businesses/${done._id}`)}
            className="flex items-center gap-2 text-sm font-medium text-[#666666] hover:text-[#1A1A1A] border border-[#E5E5E5] hover:bg-[#F5F4F1] px-6 py-3 rounded-[6px] transition-all duration-150 ease-out"
          >
            View Profile
          </button>
        </div>
      </div>
    )
  }

  const progress = (step / (STEPS.length - 1)) * 100

  return (
    <div className="max-w-[600px] mx-auto pb-12 px-4 sm:px-0">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded bg-[#FFF7ED] flex items-center justify-center">
            <Building2 size={15} className="text-[#F97316]" />
          </div>
          <span className="text-[11px] font-semibold text-[#F97316] uppercase tracking-widest">Register</span>
        </div>
        <h1 className="text-[32px] leading-tight font-bold text-[#1A1A1A]">Post Your Business</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">Let AI find businesses that solve your challenges</p>
      </div>

      {/* ── Step indicator ── */}
      <div className="mb-8">
        {/* Progress bar — 3px height, #F97316 fill */}
        <div className="h-[3px] bg-[#E5E5E5] rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-[#F97316] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step circles — plain circles with checkmarks/numbers */}
        <div className="flex items-center">
          {STEPS.map(({ label, hint }, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-150 ${
                  i < step  ? 'bg-[#F97316] border-[#F97316] text-white' :
                  i === step ? 'bg-[#FFF7ED] border-[#F97316] text-[#F97316]' :
                               'bg-white border-[#E5E5E5] text-[#9CA3AF]'
                }`}>
                  {i < step
                    ? <Check size={12} strokeWidth={3} />
                    : <span className="text-xs font-semibold">{i + 1}</span>
                  }
                </div>
                <div className="hidden sm:block">
                  <p className={`text-[11px] font-semibold leading-none ${i <= step ? 'text-[#F97316]' : 'text-[#9CA3AF]'}`}>{label}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">{hint}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 transition-colors duration-300 ${i < step ? 'bg-[#F97316]' : 'bg-[#E5E5E5]'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Form card — white, 1px #E5E5E5 border, 4px radius, 8px shadow ── */}
      <div className="bg-white border border-[#E5E5E5] rounded p-6 mb-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">

        {/* Step 0 — Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-base font-semibold text-[#1A1A1A]">Basic Information</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Your public identity on SolveNet</p>
            </div>
            <Field label="Business Name" icon={Building2}>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input className={`${inputCls} pl-9`} placeholder="e.g. GreenPack Co." value={form.name} onChange={e => update('name', e.target.value)} autoFocus />
              </div>
            </Field>
            <Field label="Owner Email" icon={Mail} hint="You'll use this to sign in">
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input className={`${inputCls} pl-9`} type="email" placeholder="you@company.com" value={form.owner_email} onChange={e => update('owner_email', e.target.value)} />
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Password" icon={Lock}>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    className={`${inputCls} pl-9 pr-9`}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#666666] transition-colors duration-150">
                    {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {form.password.length > 0 && form.password.length < 6 && (
                  <p className="text-[11px] text-red-500 mt-1.5">At least 6 characters</p>
                )}
              </Field>
              <Field label="Confirm Password" icon={Lock}>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    className={`${inputCls} pl-9 pr-9 ${
                      form.password_confirm && form.password !== form.password_confirm
                        ? 'border-red-400 focus:border-red-400'
                        : form.password_confirm && form.password === form.password_confirm
                        ? 'border-[#F97316]'
                        : ''
                    }`}
                    type={showPwC ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={form.password_confirm}
                    onChange={e => update('password_confirm', e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPwC(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#666666] transition-colors duration-150">
                    {showPwC ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {form.password_confirm && form.password !== form.password_confirm && (
                  <p className="text-[11px] text-red-500 mt-1.5">Passwords don't match</p>
                )}
                {form.password_confirm && form.password === form.password_confirm && form.password.length >= 6 && (
                  <p className="text-[11px] text-[#F97316] mt-1.5 flex items-center gap-1"><Check size={9} /> Passwords match</p>
                )}
              </Field>
            </div>
            <Field label="Business Address" icon={MapPin} hint="Used to prioritize nearby matches">
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input className={`${inputCls} pl-9`} placeholder="Mumbai, Maharashtra, India" value={form.address} onChange={e => update('address', e.target.value)} />
              </div>
            </Field>
          </div>
        )}

        {/* Step 1 — Services */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-base font-semibold text-[#1A1A1A]">Your Services</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">What does your business offer to others?</p>
            </div>
            <div className="px-4 py-3 bg-[#FFF4E6] rounded" style={{ borderLeft: '3px solid #F97316' }}>
              <p className="text-xs font-semibold text-[#F97316] mb-1">Tip for better matches</p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgb(249 115 22 / 0.75)' }}>Be specific. Instead of "packaging", write "eco-friendly kraft paper packaging for food products". The more detail, the better your AI matches.</p>
            </div>
            <Field label="Services Offered" icon={Wrench} hint="Press Enter or comma after each service to add it">
              <TagInput tags={form.services} onChange={v => update('services', v)} placeholder="e.g. eco packaging, bulk supply, logistics..." />
            </Field>
            {form.services.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-[#F97316]">
                <Check size={12} /> <span><strong>{form.services.length}</strong> service{form.services.length !== 1 ? 's' : ''} added</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Challenges */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-base font-semibold text-[#1A1A1A]">Your Challenges</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">What problems is your business facing?</p>
            </div>
            <div className="px-4 py-3 bg-[#FFF4E6] rounded" style={{ borderLeft: '3px solid #F97316' }}>
              <p className="text-xs font-semibold text-[#F97316] mb-1">Tip for better matches</p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgb(249 115 22 / 0.75)' }}>Describe the problem, not just the category. Instead of "supplier", write "need reliable raw cotton supplier for textile production at scale". This helps AI find the right solution providers.</p>
            </div>
            <Field label="Challenges / Problems" icon={AlertCircle} hint="Press Enter or comma after each challenge to add it">
              <TagInput tags={form.challenges} onChange={v => update('challenges', v)} placeholder="e.g. need raw material supplier, delivery delays..." />
            </Field>
            {form.challenges.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-[#F97316]">
                <Check size={12} /> <span><strong>{form.challenges.length}</strong> challenge{form.challenges.length !== 1 ? 's' : ''} added</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div>
            <div className="mb-5">
              <h2 className="text-base font-semibold text-[#1A1A1A]">Review &amp; Submit</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Everything look right? Hit submit to go live.</p>
            </div>

            {/* Business identity */}
            <div className="pb-5">
              <p className="text-[12px] uppercase font-semibold text-[#666666] tracking-[0.5px] mb-3">Business</p>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded bg-[#FFF7ED] text-[#F97316] font-bold text-lg flex items-center justify-center flex-shrink-0">
                  {form.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-medium text-[#1A1A1A]">{form.name}</p>
                  <p className="text-sm text-[#888888] flex items-center gap-1.5 mt-1"><Mail size={12} /> {form.owner_email}</p>
                  <p className="text-sm text-[#888888] flex items-center gap-1.5 mt-1"><MapPin size={12} /> {form.address}</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-[#E5E5E5]" />

            {/* Services */}
            <div className="py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] uppercase font-semibold text-[#666666] tracking-[0.5px]">Services</p>
                <button onClick={() => setStep(1)} className="text-xs font-medium text-[#F97316] hover:text-[#E87D0D] transition-colors duration-150">Edit</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.services.map(s => (
                  <span key={s} className="px-2 py-1 bg-[#F5F4F1] text-[#1A1A1A] border border-[#E5E5E5] rounded text-xs font-medium">{s}</span>
                ))}
              </div>
            </div>

            <div className="h-px bg-[#E5E5E5]" />

            {/* Challenges */}
            <div className="py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] uppercase font-semibold text-[#666666] tracking-[0.5px]">Challenges</p>
                <button onClick={() => setStep(2)} className="text-xs font-medium text-[#F97316] hover:text-[#E87D0D] transition-colors duration-150">Edit</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.challenges.map(c => (
                  <span key={c} className="px-2 py-1 bg-[#F5F4F1] text-[#1A1A1A] border border-[#E5E5E5] rounded text-xs font-medium">{c}</span>
                ))}
              </div>
            </div>

            <div className="h-px bg-[#E5E5E5]" />

            {/* AI notice */}
            <div className="pt-5">
              <div
                className="flex items-start gap-3 px-4 py-3 bg-[#FFF4E6] rounded"
                style={{ borderLeft: '3px solid #F97316' }}
              >
                <Zap size={16} className="text-[#F97316] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#F97316] leading-relaxed">
                  <strong>AI will immediately start</strong> tagging, categorizing, and finding matching businesses after you submit. Check your dashboard for results.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : navigate('/')}
          className="flex items-center gap-1.5 text-sm font-medium text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F5F4F1] px-5 py-2.5 rounded-[6px] transition-all duration-150 ease-out"
        >
          <ChevronLeft size={15} /> {step === 0 ? 'Cancel' : 'Back'}
        </button>

        <div className="flex items-center gap-3">
          {/* Dot indicators */}
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-[3px] rounded-full transition-all duration-150 ${i === step ? 'w-5 bg-[#F97316]' : 'w-1.5 bg-[#E5E5E5]'}`} />
            ))}
          </div>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 bg-[#F97316] hover:bg-[#E87D0D] text-white text-sm font-semibold px-6 py-2.5 rounded-[6px] transition-all duration-150 ease-out disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="flex items-center gap-2 bg-[#F97316] hover:bg-[#E87D0D] text-white text-base font-semibold px-8 py-3 rounded-[6px] transition-all duration-150 ease-out disabled:opacity-50"
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
