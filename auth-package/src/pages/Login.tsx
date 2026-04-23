import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertCircle, ArrowRight, Lock, Mail, ShieldCheck, Activity, Database, Briefcase } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Auto-append domain if needed, or just use trim
    const loginEmail = email.trim();
    
    const { error } = await signIn(loginEmail, password)
    if (error) {
      setError('System verification failed. Invalid credentials detected.')
      setLoading(false)
    } else {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-16 relative overflow-hidden bg-[#131313]">
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        {/* Ambient background blur */}
        <div className="absolute -bottom-24 -right-24 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          <div className="w-16 h-16 bg-[#1d1d1f] border border-white/10 rounded-2xl flex items-center justify-center mb-10 shadow-2xl">
            <span className="font-bold text-xs text-white uppercase tracking-tighter">PROJECT-V1</span>
          </div>
          
          <div className="space-y-4">
             <div className="text-[10px] text-blue-500 tracking-[0.3em] font-black uppercase">Precision Logic</div>
             <h1 className="font-bold text-5xl text-white leading-[1.1] tracking-tight">
               Enterprise<br />
               <span className="text-white/60">Registry</span>
             </h1>
          </div>

          <p className="mt-8 text-white/40 font-medium text-lg leading-relaxed max-w-sm">
            Professional-grade authentication and session management.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-1 gap-4 mb-2">
          {[
            { label: 'Asset Management', value: 'Global Registry', icon: Database },
            { label: 'Access Control', value: 'Live Hierarchy', icon: Briefcase },
            { label: 'Security', value: 'Verified Entry', icon: ShieldCheck },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="p-2 bg-white/5 rounded-lg text-white/40">
                <stat.icon size={18} />
              </div>
              <div>
                <div className="text-white font-bold text-base leading-none mb-1">{stat.value}</div>
                <div className="text-[8px] text-white/30 uppercase tracking-widest">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-[420px]">
          <div className="mb-10">
             <h2 className="font-bold text-3xl text-gray-900 tracking-tight leading-none mb-3">System Access</h2>
             <p className="text-sm font-bold text-gray-400">Initialize your secure administrative session</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 p-4 rounded-2xl mb-6">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <p className="text-xs font-bold text-red-600 uppercase tracking-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">Network Identity</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                   type="email"
                   required
                   className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                   placeholder="email@example.com"
                   value={email}
                   onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">Security Credential</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0071e3] text-white font-bold py-4 rounded-full flex justify-center items-center gap-2 hover:bg-[#0077ed] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Activity size={18} className="animate-spin" /> Verifying...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  ESTABLISH CONNECTION <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>

          <div className="mt-12 text-center p-6 bg-gray-50 rounded-3xl">
             <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">
               Access restricted to authorized personnel.
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
