import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, X, Check, Loader2, Eye, EyeOff } from 'lucide-react'
import { authApi } from '../api/businessApi'
import { useToast } from '../components/Toast'
import { useBusiness } from '../context/BusinessContext'

const STEPS = ['Basic Info', 'Services', 'Challenges', 'Review']

function TagInput({ tags, onChange, placeholder, variant = 'default' }) {
  const [input, setInput] = useState('')

  function addTag(val) {
    const trimmed = val.trim()
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed])
    setInput('')
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  const pillStyle = variant === 'problem'
    ? 'bg-red-50 text-red-700 border border-red-100'
    : variant === 'solution'
    ? 'bg-green-50 text-green-700 border border-green-100'
    : 'bg-bg text-text-primary border border-border'

  return (
    <div className="min-h-[80px] bg-bg border border-border rounded-xl p-3 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all cursor-text">
      {tags.map(tag => (
        <span key={tag} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium ${pillStyle}`}>
          {tag}
          <button onClick={() => onChange(tags.filter(t => t !== tag))} className="opacity-50 hover:opacity-100">
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[140px] bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
        placeholder={placeholder}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => input.trim() && addTag(input)}
      />
    </div>
  )
}

export default function RegisterBusiness() {
  const navigate = useNavigate()
  const toast = useToast()
  const { signIn } = useBusiness()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)
  const [showPw, setShowPw] = useState(false)
  const [showPwConfirm, setShowPwConfirm] = useState(false)

  const [form, setForm] = useState({
    name: '', owner_email: '', password: '', password_confirm: '', address: '',
    services: [], challenges: []
  })

  function update(field, val) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  function canNext() {
    if (step === 0) return (
      form.name && form.owner_email && form.address &&
      form.password.length >= 6 &&
      form.password === form.password_confirm
    )
    if (step === 1) return form.services.length > 0
    if (step === 2) return form.challenges.length > 0
    return true
  }

  async function submit() {
    setSubmitting(true)
    try {
      const { name, owner_email, password, address, services, challenges } = form
      const res = await authApi.register({ name, owner_email, password, address, services, challenges })
      const newBiz = res.data.business
      setDone(newBiz)
      signIn(res.data.token, newBiz)
      toast('Business registered! You are now signed in.', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Registration failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
          <Check size={28} />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Business Registered!</h2>
        <p className="text-text-secondary text-sm mb-6">
          AI is analyzing <strong>{done.name}</strong> and finding matches in the background.
          Check your dashboard for results.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/my-dashboard')} className="btn-primary">
            Go to My Dashboard
          </button>
          <button
            onClick={() => navigate(`/businesses/${done._id}`)}
            className="btn-ghost border border-border"
          >
            View Profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Post Your Business</h1>
        <p className="text-sm text-text-muted mt-1">Let AI find businesses that solve your challenges</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center gap-2 ${i <= step ? 'text-accent' : 'text-text-muted'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                i < step ? 'bg-accent border-accent text-white' :
                i === step ? 'border-accent text-accent bg-accent-light' :
                'border-border text-text-muted bg-surface'
              }`}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 transition-colors ${i < step ? 'bg-accent' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Form card */}
      <div className="card p-6 mb-4">
        {/* Step 0 */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-text-primary mb-4">Basic Information</h2>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Business Name *</label>
              <input className="input" placeholder="e.g. GreenPack Co." value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Owner Email *</label>
              <input className="input" type="email" placeholder="you@company.com" value={form.owner_email} onChange={e => update('owner_email', e.target.value)} />
              <p className="text-xs text-text-muted mt-1">You'll use this email to sign in</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    className="input pr-9"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                    {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <input
                    className={`input pr-9 ${form.password_confirm && form.password !== form.password_confirm ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                    type={showPwConfirm ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={form.password_confirm}
                    onChange={e => update('password_confirm', e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPwConfirm(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                    {showPwConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {form.password_confirm && form.password !== form.password_confirm && (
                  <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Business Address *</label>
              <input className="input" placeholder="Mumbai, Maharashtra, India" value={form.address} onChange={e => update('address', e.target.value)} />
              <p className="text-xs text-text-muted mt-1">Used to prioritize nearby matches</p>
            </div>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <h2 className="text-base font-semibold text-text-primary mb-1">Your Services</h2>
            <p className="text-xs text-text-muted mb-4">What does your business offer? (press Enter or comma to add)</p>
            <TagInput
              tags={form.services}
              onChange={v => update('services', v)}
              placeholder="eco packaging, bulk supply..."
              variant="solution"
            />
            <p className="text-xs text-text-muted mt-2">{form.services.length} service{form.services.length !== 1 ? 's' : ''} added</p>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <h2 className="text-base font-semibold text-text-primary mb-1">Your Challenges</h2>
            <p className="text-xs text-text-muted mb-4">What problems are you facing? (press Enter or comma to add)</p>
            <TagInput
              tags={form.challenges}
              onChange={v => update('challenges', v)}
              placeholder="need raw material supplier..."
              variant="problem"
            />
            <p className="text-xs text-text-muted mt-2">{form.challenges.length} challenge{form.challenges.length !== 1 ? 's' : ''} added</p>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div>
            <h2 className="text-base font-semibold text-text-primary mb-4">Review Your Business</h2>
            <div className="space-y-4">
              <div className="p-4 bg-bg rounded-xl border border-border">
                <p className="text-xs text-text-muted uppercase font-semibold tracking-wider mb-2">Business</p>
                <p className="font-semibold text-text-primary">{form.name}</p>
                <p className="text-sm text-text-secondary">{form.owner_email}</p>
                <p className="text-sm text-text-secondary">{form.address}</p>
                <p className="text-xs text-text-muted mt-1">Password: {'•'.repeat(form.password.length)}</p>
              </div>
              <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
                <p className="text-xs text-green-700 uppercase font-semibold tracking-wider mb-2">Services (what you offer)</p>
                <div className="flex flex-wrap gap-1.5">
                  {form.services.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-lg bg-green-100 text-green-700 text-xs font-medium">{s}</span>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                <p className="text-xs text-red-700 uppercase font-semibold tracking-wider mb-2">Challenges (what you need)</p>
                <div className="flex flex-wrap gap-1.5">
                  {form.challenges.map(c => (
                    <span key={c} className="px-2 py-0.5 rounded-lg bg-red-100 text-red-700 text-xs font-medium">{c}</span>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-accent-light rounded-xl border border-accent/20">
                <p className="text-xs text-accent font-medium">
                  🤖 AI will tag, categorize, and find matches automatically after submission.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : navigate('/dashboard')}
          className="btn-ghost flex items-center gap-1.5"
        >
          <ChevronLeft size={14} /> {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="btn-primary flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue <ChevronRight size={14} />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={submitting}
            className="btn-primary flex items-center gap-2"
          >
            {submitting ? (
              <><Loader2 size={14} className="animate-spin" /> Finding Matches...</>
            ) : (
              <><Check size={14} /> Submit & Find Matches</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
