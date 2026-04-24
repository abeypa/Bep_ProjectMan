import { useParams, useNavigate } from "react-router-dom"
import { 
  Users, 
  MapPin, 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Loader2,
  Calendar
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/components"
import { 
  useInvitationDetails, 
  useAcceptInvitation 
} from "@/hooks/useWorkspace"

export function InvitationPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  
  const { data: invitation, isLoading, error } = useInvitationDetails(token)
  const acceptInvitation = useAcceptInvitation()

  const handleAccept = async () => {
    if (!token) return
    try {
      await acceptInvitation.mutateAsync(token)
      toast.success(`Welcome to ${invitation?.workspace_name || "the workspace"}!`)
      navigate(`/w/${invitation?.workspace_slug}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invitation")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10 p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
            Validating Authorization Token...
          </p>
        </div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10 p-6">
        <Card className="w-full max-w-md border-red-500/20 bg-white/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black uppercase tracking-tight text-red-900 italic">Invalid Invitation</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest text-red-700/60 leading-relaxed px-4">
                This token appears to be corrupted, expired, or decommissioned.
              </CardDescription>
            </div>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full h-12 uppercase tracking-widest font-black">
              Return to Control Center
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (invitation.status !== "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10 p-6">
        <Card className="w-full max-w-md border-amber-500/20 bg-white/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Shield className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black uppercase tracking-tight text-amber-900 italic">Invitation Resolved</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest text-amber-700/60 leading-relaxed px-4">
                This invitation has already been {invitation.status}. 
              </CardDescription>
            </div>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/")} className="w-full h-12 bg-navy-900 uppercase tracking-widest font-black">
              Access Workspace
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/10 p-6 animate-in fade-in duration-700">
      <Card className="w-full max-w-[480px] border-none shadow-2xl shadow-primary/10 overflow-hidden bg-white/80 backdrop-blur-2xl">
        <div className="h-2 bg-gradient-to-r from-primary via-indigo-600 to-primary animate-gradient-x" />
        
        <CardHeader className="p-8 text-center space-y-6">
          <div className="flex justify-center -space-x-3">
             <div className="w-14 h-14 rounded-2xl bg-muted border-4 border-white flex items-center justify-center shadow-lg relative z-10">
                <Users className="h-6 w-6 text-muted-foreground" />
             </div>
             <div className="w-14 h-14 rounded-2xl bg-primary border-4 border-white flex items-center justify-center shadow-lg shadow-primary/20 relative z-20">
                <CheckCircle2 className="h-6 w-6 text-white" />
             </div>
          </div>

          <div className="space-y-1.5 px-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Workspace Protocol</h2>
            <CardTitle className="text-3xl font-black uppercase tracking-tight text-navy-900 italic leading-none">
              Admission Offered
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-10 pt-0 space-y-8">
          <div className="bg-muted/30 border rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-5">
               <div className="w-12 h-12 bg-card border rounded-xl flex items-center justify-center text-primary shadow-sm font-black italic text-xl">
                 {invitation.workspace_name.slice(0, 2).toUpperCase()}
               </div>
               <div className="min-w-0">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Target Destination</p>
                  <p className="text-lg font-black text-navy-900 truncate tracking-tight">{invitation.workspace_name}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-primary" /> Authorization
                  </p>
                  <p className="text-xs font-black text-navy-900 uppercase tracking-tight">{invitation.role}</p>
               </div>
               <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-primary" /> Validity
                  </p>
                  <p className="text-xs font-black text-navy-900 uppercase tracking-tight">Active</p>
               </div>
            </div>

            {invitation.email && (
              <div className="px-1">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Authorized Identity</p>
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-navy-50 rounded-lg">
                      <Mail className="h-3.5 w-3.5 text-navy-400" />
                   </div>
                   <span className="text-sm font-bold text-navy-900 font-mono tracking-tight">{invitation.email}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex items-center gap-3">
            <div className="p-1.5 bg-emerald-500 rounded-lg">
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            </div>
            <p className="text-[9px] font-black uppercase text-emerald-800 leading-relaxed tracking-tight">
              Instant Sync: Acceptance will finalize your system access tier and grant immediate entry to the project registry.
            </p>
          </div>
        </CardContent>

        <CardFooter className="p-8 bg-muted/10 border-t flex flex-col gap-4">
          <Button 
            onClick={handleAccept} 
            disabled={acceptInvitation.isPending}
            className="w-full h-14 bg-navy-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-[0.25em] shadow-xl shadow-navy-900/20 transition-all active:scale-95"
          >
            {acceptInvitation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>INITIALIZE SYSTEM ENTRY <ArrowRight className="h-4 w-4 ml-3" /></>
            )}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="text-[10px] font-black text-muted-foreground uppercase tracking-widest"
          >
            Decline Authorization
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
