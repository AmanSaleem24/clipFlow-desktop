import { Button } from "@/components/ui/button"
import { SignedOut, useSignIn } from "@clerk/clerk-react"
import { ShieldCheck, Sparkles } from "lucide-react"
import { useState } from "react"

const AuthButton = () => {
  const { isLoaded, signIn } = useSignIn()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn || isAuthenticating) return

    try {
      setIsAuthenticating(true)
      const popup = window.open("about:blank", "clerk-google-sign-in", "width=520,height=680")
      if (!popup) {
        throw new Error("Unable to open Google sign-in popup. Please allow popups for this app.")
      }

      const redirectUrl = window.location.href
      await signIn.authenticateWithPopup({
        strategy: "oauth_google",
        popup,
        redirectUrl: redirectUrl,
        redirectUrlComplete: redirectUrl,
        continueSignUp: true,
      })
    } catch (error) {
      console.error("Google sign-in failed", error)
    } finally {
      setIsAuthenticating(false)
    }
  }

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
            <Button
              variant="default"
              className="w-full py-2 text-sm"
              disabled={!isLoaded || isAuthenticating}
              onClick={handleGoogleSignIn}
            >
              {isAuthenticating ? "Connecting..." : "Continue with Google"}
            </Button>
          </div>
        </div>
      </div>
    </SignedOut>
  )
}

export default AuthButton
