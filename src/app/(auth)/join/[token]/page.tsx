"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAcceptInvitation } from "@/hooks/use-company"
import { createClient } from "@/lib/supabase/client"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

export default function JoinPage({ params }: { params: { token: string } }) {
    const router = useRouter()
    const acceptInvitation = useAcceptInvitation()
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
    const [errorDetails, setErrorDetails] = useState<string>("")
    const [companyName, setCompanyName] = useState<string>("")

    useEffect(() => {
        const verifyAndJoin = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                // Redirect to login but preserve the destination
                // We use encodeURIComponent to ensure the full path is preserved
                const nextUrl = encodeURIComponent(`/join/${params.token}`)
                router.push(`/login?next=${nextUrl}`)
                return
            }

            try {
                const company = await acceptInvitation.mutateAsync(params.token)
                setCompanyName(company?.name || "the company")
                setStatus("success")

                // Short delay to show success state before redirecting
                setTimeout(() => {
                    router.push("/dashboard")
                }, 2000)
            } catch (err: any) {
                setStatus("error")
                setErrorDetails(err.message || "Failed to join company")
            }
        }

        verifyAndJoin()
    }, [params.token, router, acceptInvitation])

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-lg border shadow-sm text-center">
                {status === "verifying" && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <h2 className="text-xl font-semibold">Verifying Invitation...</h2>
                        <p className="text-muted-foreground">Please wait while we check your invite.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center gap-4">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                        <h2 className="text-xl font-semibold">Welcome to {companyName}!</h2>
                        <p className="text-muted-foreground">You have successfully joined the workspace.</p>
                        <p className="text-sm text-muted-foreground mt-2">Redirecting to dashboard...</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-4">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                        <h2 className="text-xl font-semibold">Invitation Failed</h2>
                        <p className="text-red-600 bg-red-50 px-4 py-2 rounded-md">{errorDetails}</p>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
