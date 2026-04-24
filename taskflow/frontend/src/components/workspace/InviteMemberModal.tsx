import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Mail,
  UserPlus,
  Loader2,
  Shield,
  ShieldCheck,
  User,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useInviteMember } from "@/hooks/useWorkspace"
import { WorkspaceRole } from "@/types"
import { cn } from "@/lib/utils"

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "member", "guest"] as const),
})

type InviteFormValues = z.infer<typeof inviteSchema>

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
}

export function InviteMemberModal({
  isOpen,
  onClose,
  workspaceId,
}: InviteMemberModalProps) {
  const inviteMember = useInviteMember()
  const [loading, setLoading] = useState(false)

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  })

  const onSubmit = async (values: InviteFormValues) => {
    setLoading(true)
    try {
      await inviteMember.mutateAsync({
        workspace_id: workspaceId,
        email: values.email.trim().toLowerCase(),
        role: values.role,
      })
      toast.success(`Invitation sent to ${values.email}`)
      form.reset()
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation")
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    {
      id: "admin",
      label: "Admin",
      description: "Full access to workspace settings and member management",
      icon: <ShieldCheck className="h-4 w-4" />,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "member",
      label: "Member",
      description: "Can create projects, tasks, and manage their own work",
      icon: <Shield className="h-4 w-4" />,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      id: "guest",
      label: "Guest",
      description: "Limited access to specific projects assigned to them",
      icon: <User className="h-4 w-4" />,
      color: "text-slate-500",
      bgColor: "bg-slate-500/10",
    },
  ] as const

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-muted/30 px-8 py-6 border-b">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black tracking-tight uppercase">Invite Member</DialogTitle>
              <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                Extend Access to your Workspace
              </DialogDescription>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                    Network Identifier (Email)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="collaborator@example.com"
                        className="pl-10 h-11 bg-muted/50 border-muted-foreground/10 focus:border-primary transition-all font-medium"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                    Authorization Tier (Role)
                  </FormLabel>
                  <div className="grid gap-3">
                    {roleOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => field.onChange(option.id)}
                        className={cn(
                          "flex items-center gap-4 p-3 rounded-xl border text-left transition-all group",
                          field.value === option.id
                            ? "bg-primary/5 border-primary shadow-sm"
                            : "bg-card border-border hover:border-primary/50"
                        )}
                      >
                        <div
                          className={cn(
                            "p-2.5 rounded-lg transition-colors",
                            field.value === option.id
                              ? "bg-primary text-white"
                              : cn("bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary")
                          )}
                        >
                          {option.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs font-black uppercase tracking-widest",
                            field.value === option.id ? "text-primary" : "text-card-foreground"
                          )}>
                            {option.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-bold mt-0.5 leading-tight truncate">
                            {option.description}
                          </p>
                        </div>
                        {field.value === option.id && (
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                  <FormMessage className="text-[10px] font-bold" />
                </FormItem>
              )}
            />

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[9px] font-black uppercase tracking-wide leading-relaxed text-amber-700/80">
                Invitation lifecycle: System will generate a secure authorization token valid for 7 days. Privilege inheritance will finalize upon acceptance.
              </p>
            </div>

            <DialogFooter className="pt-2 gap-3 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="flex-1 text-[10px] font-black uppercase tracking-widest h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-[2] h-11 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Dispatch Invite
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
