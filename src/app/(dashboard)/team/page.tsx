"use client"

import { useState } from "react"
import {
  useCompany,
  useCompanyMembers,
  useCompanyInvitations,
  useInviteMember,
  useDeleteInvitation,
  useUpdateMemberRole,
  useRegenerateInviteCode,
} from "@/hooks/use-company"
import { Modal } from "@/components/ui/modal"
import {
  Users,
  Mail,
  Copy,
  Check,
  Trash2,
  Loader2,
  UserPlus,
  Clock,
  RefreshCw,
} from "lucide-react"
import { UserRole } from "@/types/database"

export default function TeamPage() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const { data: company, isLoading: companyLoading } = useCompany()
  const { data: members, isLoading: membersLoading } = useCompanyMembers()
  const { data: invitations } = useCompanyInvitations()
  const regenerateCode = useRegenerateInviteCode()

  const copyInviteCode = () => {
    if (company?.invite_code) {
      navigator.clipboard.writeText(company.invite_code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleRegenerateCode = async () => {
    if (!company?.id) return
    if (confirm("Are you sure? This will invalidate the current invite code.")) {
      await regenerateCode.mutateAsync(company.id)
    }
  }

  if (companyLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and invitations
          </p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Company Info Card */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{company?.name}</h2>
            <p className="text-sm text-muted-foreground">
              {members?.length || 0} team member{members?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Invite Code</p>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-3 py-1.5 rounded text-sm font-mono">
                  {company?.invite_code}
                </code>
                <button
                  onClick={copyInviteCode}
                  className="p-2 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-700"
                  title="Copy invite code"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleRegenerateCode}
                  disabled={regenerateCode.isPending}
                  className="p-2 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  title="Generate new invite code"
                >
                  <RefreshCw className={`w-4 h-4 ${regenerateCode.isPending ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h3 className="font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team Members
          </h3>
        </div>
        <div className="divide-y">
          {members?.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <div className="bg-white border rounded-lg">
          <div className="p-4 border-b">
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Invitations
            </h3>
          </div>
          <div className="divide-y">
            {invitations.map((invitation) => (
              <InvitationRow key={invitation.id} invitation={invitation} />
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  )
}

interface MemberRowProps {
  member: {
    id: string
    full_name: string | null
    email: string
    role: UserRole
  }
}

function MemberRow({ member }: MemberRowProps) {
  const updateRole = useUpdateMemberRole()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleRoleChange = async (newRole: UserRole) => {
    setIsUpdating(true)
    try {
      await updateRole.mutateAsync({ userId: member.id, role: newRole })
    } finally {
      setIsUpdating(false)
    }
  }

  const roleColors: Record<UserRole, string> = {
    admin: "bg-purple-100 text-purple-700",
    partner: "bg-blue-100 text-blue-700",
    associate: "bg-gray-100 text-gray-700",
  }

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
          {member.full_name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
        </div>
        <div>
          <p className="font-medium">{member.full_name || "Unnamed User"}</p>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={member.role}
          onChange={(e) => handleRoleChange(e.target.value as UserRole)}
          disabled={isUpdating}
          className={`text-xs px-2 py-1 rounded border-0 cursor-pointer ${roleColors[member.role]} disabled:opacity-50`}
        >
          <option value="admin">Admin</option>
          <option value="partner">Partner</option>
          <option value="associate">Associate</option>
        </select>
        {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
      </div>
    </div>
  )
}

interface InvitationRowProps {
  invitation: {
    id: string
    email: string
    role: UserRole
    created_at: string
  }
}

function InvitationRow({ invitation }: InvitationRowProps) {
  const deleteInvitation = useDeleteInvitation()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteInvitation.mutateAsync(invitation.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const roleColors: Record<UserRole, string> = {
    admin: "bg-purple-100 text-purple-700",
    partner: "bg-blue-100 text-blue-700",
    associate: "bg-gray-100 text-gray-700",
  }

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium">{invitation.email}</p>
          <p className="text-sm text-muted-foreground">
            Invited {new Date(invitation.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs px-2 py-1 rounded ${roleColors[invitation.role]}`}>
          {invitation.role}
        </span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-600 disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
}

function InviteMemberModal({ isOpen, onClose }: InviteMemberModalProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("associate")
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const inviteMember = useInviteMember()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError("Email is required")
      return
    }

    try {
      const result = await inviteMember.mutateAsync({ email: email.trim(), role })
      setInviteLink(result.inviteLink)
    } catch (err: any) {
      setError(err.message || "Failed to send invitation")
    }
  }

  const handleClose = () => {
    onClose()
    setEmail("")
    setRole("associate")
    setInviteLink(null)
    setCopied(false)
  }

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Team Member">
      {inviteLink ? (
        <div className="space-y-4">
          <div className="bg-green-50 text-green-700 p-4 rounded-md flex items-center gap-2">
            <Check className="w-5 h-5" />
            <div>
              <p className="font-medium">Invitation created!</p>
              <p className="text-sm opacity-90">An email has been sent to {email}.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Share this link</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono break-all border">
                {inviteLink}
              </code>
              <button
                onClick={copyLink}
                className="p-2 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-700 border"
                title="Copy link"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Send this link to <strong>{email}</strong> manually if they don't receive an email.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="colleague@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="associate">Associate</option>
              <option value="partner">Partner</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Admins can manage team and settings. Partners can manage deals. Associates can view and log time.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteMember.isPending}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {inviteMember.isPending ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
