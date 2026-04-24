import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  Github, 
  Chrome, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AtSign,
  ShieldCheck,
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

export function SignupPage() {
  const navigate = useNavigate()
  const { signUp, signInWithOAuth, isAuthenticated } = useAuth()

  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [signupComplete, setSignupComplete] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(true)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName || !username || !email || !password) {
      toast.error("All data fields are required for registration")
      return
    }

    if (password.length < 8) {
      toast.error("Security Constraint Violation", { description: "Password must be at least 8 characters." })
      return
    }

    if (!agreeTerms) {
      toast.error("Authorization Required", { description: "You must agree to the protocols." })
      return
    }

    setLoading(true)

    try {
      const { user, error } = await signUp(email, password, {
        full_name: fullName,
        username: username,
      })

      if (error) {
        toast.error(error.message)
      } else if (user) {
        if (user.identities?.length === 0) {
          toast.error("Identity Exists", { description: "This identifier is already tied to a system profile." })
        } else {
          setSignupComplete(true)
          toast.success("Identity Provisioned", { description: "Welcome to the network." })
        }
      }
    } catch (error) {
      toast.error("Identity Provisioning Failed")
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
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Right Section - Hero (Desktop Only, Flipped from Login) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 border-l border-white/5 bg-gradient-to-bl from-white/[0.02] to-transparent order-last text-right items-end">
        <Link to="/" className="flex items-center gap-3 relative z-10 group">
          <span className="text-2xl font-black tracking-tighter text-white italic">TASKFLOW</span>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
        </Link>

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Quantum Encryption Active</span>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
            <h1 className="text-6xl font-black tracking-tight text-white leading-[0.9] italic">
              UNIFY YOUR <br />
              <span className="text-primary tracking-[-0.05em] not-italic">WORKFLOW</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-md font-medium leading-relaxed ml-auto">
              Join the ecosystem where design meets performance. Provision your system identity and start orchestrating.
            </p>
          </motion.div>
        </div>

        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 relative z-10 flex items-center gap-4">
          <span>GDPR COMPLIANT</span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span>SOC 2 TYPE II</span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span>ENCRYPTED AT REST</span>
        </div>
      </div>

      {/* Left Section - Signup Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg space-y-8"
        >
          {/* Logo Mobile Only */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 animate-float">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!signupComplete ? (
              <motion.div
                key="signup-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-card/50 backdrop-blur-2xl border border-white/5 p-10 rounded-[32px] shadow-2xl space-y-8 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-indigo-600 to-primary opacity-50" />
                
                <div className="space-y-2 text-center">
                  <h2 className="text-3xl font-black tracking-tight text-white italic uppercase">Provision Profile</h2>
                  <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em]">Create your system credentials</p>
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
                    <span className="bg-[#121214] px-4 text-muted-foreground/60 leading-none">Manual Registry</span>
                  </div>
                </div>

                <form onSubmit={handleSignup} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Display Name</Label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="h-12 pl-12 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">System Alias</Label>
                      <div className="relative group">
                        <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="username"
                          type="text"
                          placeholder="john_doe"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="h-12 pl-12 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Identity Identifier (Email)</Label>
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
                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Access Key</Label>
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
                        minLength={8}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="px-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">Constraint: Tier 1 Security (8+ chars)</p>
                  </div>

                  <div className="flex items-start gap-3 px-1 pt-2">
                    <Checkbox 
                      id="terms" 
                      checked={agreeTerms} 
                      onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                      className="mt-1 rounded-md border-white/10 bg-white/5 data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                    />
                    <label htmlFor="terms" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80 leading-relaxed cursor-pointer select-none">
                      I acknowledge the system protocols, <a href="#" className="text-primary hover:underline">security directives</a>, and <a href="#" className="text-primary hover:underline">privacy encryption policy</a>.
                    </label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>INITIALIZE REGISTRY <ArrowRight className="h-4 w-4 ml-2" /></>}
                  </Button>
                </form>

                <div className="pt-2 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    Already an Operator?{" "}
                    <Link to="/login" className="text-primary hover:text-primary/70 font-black italic">
                      Authorize Credentials
                    </Link>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="signup-complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card/50 backdrop-blur-2xl border border-white/5 p-12 rounded-[32px] shadow-2xl text-center space-y-8"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <ShieldCheck className="h-10 w-10 text-emerald-500" />
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-3xl font-black tracking-tight text-white italic uppercase">Verify Neural Link</h2>
                  <p className="text-[11px] text-muted-foreground font-medium max-w-[320px] mx-auto leading-relaxed uppercase tracking-widest">
                    Manual verification required. We've dispatched an activation link to: <br />
                    <span className="text-white font-black lowercase tracking-normal bg-white/5 px-2 py-1 rounded-lg mt-2 inline-block italic underline">{email}</span>
                  </p>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-start gap-4 text-left">
                  <Sparkles className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-[9px] font-black uppercase tracking-tight text-primary/80 leading-relaxed italic">
                    Identity provisioning successful. Once the link is activated, your profile will be synchronized with the system registry.
                  </p>
                </div>

                <Link to="/login">
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-2xl border-white/5 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest"
                  >
                    Return to Access Point
                  </Button>
                </Link>
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
