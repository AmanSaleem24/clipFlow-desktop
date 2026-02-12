import { Button } from "@/components/ui/button"
import { SignedOut, SignInButton, SignUpButton } from "@clerk/clerk-react"
import { ShieldCheck, Sparkles } from "lucide-react"

const AuthButton = () => {
  return (
    <SignedOut>
      <div className="px-4 pb-3">
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-white/10 rounded-xl p-3 shadow-md text-white space-y-2 max-w-sm mx-auto">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wide text-white/70 bg-white/10 px-2 py-1 rounded-full">
            <Sparkles size={14} />
            <span>ClipFlow Studio</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-semibold leading-tight">Sign in to start capturing</h2>
            <p className="text-xs text-white/70">
              Securely manage your studio, sources, and presets in one place.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-white/70">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Clerk handles auth, your credentials never touch the app.</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <SignInButton>
              <Button variant="default" className="w-full py-2 text-sm">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button variant="secondary" className="w-full text-white border border-white/20 bg-white/10 hover:bg-white/20 py-2 text-sm">
                Create Account
              </Button>
            </SignUpButton>
          </div>
        </div>
      </div>
    </SignedOut>
  )
}

export default AuthButton
