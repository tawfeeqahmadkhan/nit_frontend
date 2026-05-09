import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { authApi } from '../api/businessApi'
import { useBusiness } from '../context/BusinessContext'
import { useToast } from '../components/Toast'
import logoFull from '../assets/logo.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useBusiness()
  const toast = useToast()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  function update(field, val) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) return
    setLoading(true)
    try {
      const res = await authApi.login({ email: form.email, password: form.password })
      signIn(res.data.token, res.data.business)
      toast(`Welcome back, ${res.data.business.name}!`, 'success')
      navigate('/my-dashboard')
    } catch (err) {
      toast(err.response?.data?.error || 'Login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-surface border-b border-border">
        <img
          src={logoFull} alt="SolveNet"
          className="h-9 w-auto object-contain cursor-pointer"
          onClick={() => navigate('/')}
        />
        <button onClick={() => navigate('/')} className="btn-ghost text-sm">← Back to Home</button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-accent-light flex items-center justify-center mx-auto mb-4">
              <Lock size={22} className="text-accent" />
            </div>
            <h1 className="text-2xl font-extrabold text-text-primary mb-1">Sign in to your business</h1>
            <p className="text-sm text-text-secondary">Use the email and password you registered with</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="card p-8 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Business Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  className="input pl-9"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  className="input pl-9 pr-10"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !form.email || !form.password}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-accent/20"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                : <>Sign In <ArrowRight size={15} /></>
              }
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent/40 hover:bg-accent-light/30 text-sm font-semibold text-text-primary transition-all"
            >
              Register a New Business
            </button>
          </form>

          <p className="text-center text-xs text-text-muted mt-4">
            Only the registered owner can sign in to a business.
          </p>
        </div>
      </div>
    </div>
  )
}
