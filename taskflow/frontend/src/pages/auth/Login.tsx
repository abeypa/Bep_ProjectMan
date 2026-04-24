import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Github, 
  Chrome, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/components"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signInWithMagicLink, signInWithOAuth, isAuthenticated } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const from = (location.state as { from?: string })?.from || "/"

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const { error } = await signIn(email, password)
      if (error) {
        toast.error(error.message, {
          icon: <AlertCircle className="h-4 w-4 text-destructive" />
        })
      } else {
        toast.success("Identity Verified", {
          description: "System access granted. Welcome back.",
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        })
        navigate(from, { replace: true })
      }
    } catch (error) {
      toast.error("Security Authentication Failed")
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      toast.error("Input Required", { description: "Please enter your email to receive a magic link." })
      return
    }

    setLoading(true)
    try {
      const { error } = await signInWithMagicLink(email)
      if (error) {
        toast.error(error.message)
      } else {
        setMagicLinkSent(true)
        toast.success("Magic Link Dispatched", { description: "Check your neural uplink (email inbox)." })
      }
    } catch (error) {
      toast.error("Transmission Error")
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: "google" | "github") => {
    const { error } = await signInWithOAuth(provider)
    if (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-[#0a0a0b] selection:bg-primary/30">
      {/* Visual Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Left Section - Hero (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 border-r border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
        <Link to="/" className="flex items-center gap-3 relative z-10 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white italic">TASKFLOW</span>
        </Link>

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">v2.0 Neural Engine</span>
            </div>
            <h1 className="text-6xl font-black tracking-tight text-white leading-[0.9] italic">
              COLLECTIVE <br />
              <span className="text-primary tracking-[-0.05em] not-italic">INTELLIGENCE</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-md font-medium leading-relaxed">
              Experience the next generation of project orchestration. Fast, fluid, and designed for high-performance teams.
            </p>
          </motion.div>

          <div className="mt-12 flex items-center gap-8 border-t border-white/5 pt-8">
            <div className="space-y-1">
              <p className="text-white font-black text-2xl tracking-tighter italic">20ms</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">LATENCY</p>
            </div>
            <div className="space-y-1">
              <p className="text-white font-black text-2xl tracking-tighter italic">99.9%</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">UPTIME</p>
            </div>
            <div className="space-y-1">
              <p className="text-white font-black text-2xl tracking-tighter italic">∞ </p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">THROUGHPUT</p>
            </div>
          </div>
        </div>

        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 relative z-10 flex items-center gap-4">
          <span>SECURE END-TO-END</span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span>ISO 27001</span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span>GDPR COMPLIANT</span>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Logo Moble Only */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 animate-float">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!magicLinkSent ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-card/50 backdrop-blur-2xl border border-white/5 p-10 rounded-[32px] shadow-2xl space-y-8 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-indigo-600 to-primary opacity-50" />
                
                <div className="space-y-2 text-center">
                  <h2 className="text-3xl font-black tracking-tight text-white italic uppercase">Access Point</h2>
                  <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em]">Enter authorization credentials</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-12 rounded-2xl border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 font-bold uppercase tracking-widest text-[9px] gap-2 lg:flex"
                    onClick={() => handleOAuthLogin("google")}
                  >
                    <Chrome className="h-4 w-4" />
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 rounded-2xl border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 font-bold uppercase tracking-widest text-[9px] gap-2"
                    onClick={() => handleOAuthLogin("github")}
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-white/5" />
                  </div>
                  <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em]">
                    <span className="bg-[#121214] px-4 text-muted-foreground/60 leading-none">Standard Uplink</span>
                  </div>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Identity Identifier</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="user@taskflow.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 pl-12 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access Key</Label>
                        <Link
                          to="/reset-password"
                          className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
                        >
                          Recover
                        </Link>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 pl-12 pr-12 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                          required
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="remember" 
                        checked={rememberMe} 
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        className="rounded-md border-white/10 bg-white/5 data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                      />
                      <label htmlFor="remember" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer select-none">Maintain Session</label>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>INITIALIZE CONNECTION <ArrowRight className="h-4 w-4 ml-2" /></>}
                  </Button>
                </form>

                <div className="pt-4 flex flex-col gap-4 text-center">
                  <button
                    type="button"
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                    onClick={handleMagicLink}
                    disabled={loading}
                  >
                    Request Magic Link Path
                  </button>
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    New Operator?{" "}
                    <Link to="/signup" className="text-primary hover:text-primary/70 font-black italic">
                      Register System Identity
                    </Link>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="magic-link-sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card/50 backdrop-blur-2xl border border-white/5 p-12 rounded-[32px] shadow-2xl text-center space-y-8"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto shadow-inner group overflow-hidden">
                  <motion.div
                    animate={{ 
                      y: [0, -4, 0],
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2,
                      ease: "easeInOut"
                    }}
                  >
                    <Mail className="h-10 w-10 text-primary" />
                  </motion.div>
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-3xl font-black tracking-tight text-white italic uppercase">Link Sent</h2>
                  <p className="text-[11px] text-muted-foreground font-medium max-w-[280px] mx-auto leading-relaxed uppercase tracking-widest">
                    Neural authentication link dispatched to: <br />
                    <span className="text-white font-black lowercase tracking-normal bg-white/5 px-2 py-1 rounded-lg mt-2 inline-block">{email}</span>
                  </p>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-4 text-left">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <p className="text-[9px] font-black uppercase tracking-tight text-emerald-800/80 leading-relaxed italic">
                    Connection sequence initiated. Please verify your identity via the secure link sent to your terminal.
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setMagicLinkSent(false)}
                  className="w-full h-12 rounded-2xl border-white/5 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest"
                >
                  Switch Identity Identifier
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer info */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 opacity-30">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] whitespace-nowrap">TaskFlow Network Protocol © 2026</p>
        </div>
      </div>
    </div>
  )
}
