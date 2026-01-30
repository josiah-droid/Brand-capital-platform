import Link from "next/link"
import { ArrowRight, BarChart3, Clock, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">BC</span>
            </div>
            <span className="font-semibold text-lg">Brandcapital</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-6">
            Project Management
            <br />
            <span className="text-primary">Built for Brand Capital</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track projects from inquiry to completion. Manage your team&apos;s time.
            Make data-driven decisions with our internal platform designed for
            brand positioning professionals.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <div className="p-6 rounded-xl border bg-card">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Project Pipeline</h3>
            <p className="text-muted-foreground text-sm">
              Visualize your entire project flow with customizable stages.
              Track project value, win likelihood, and expected timelines.
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Task Management</h3>
            <p className="text-muted-foreground text-sm">
              Assign tasks to team members, set priorities, and track completion.
              Keep projects on track with project-linked tasks.
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Time Tracking</h3>
            <p className="text-muted-foreground text-sm">
              Log hours against projects or general tasks. Track billable time
              and understand resource allocation across all clients.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
