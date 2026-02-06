export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'partner' | 'associate'
export type DealStatus = 'active' | 'closed_won' | 'closed_lost' | 'on_hold'
export type EngagementType = 'project' | 'retainer' | 'pitch'
export type ClientSize = 'startup' | 'small' | 'medium' | 'enterprise'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed'
export type TaskPhase = 'Strategy' | 'Creative' | 'Production' | 'Revisions' | 'Admin' | 'General'
export type TimeLogType = 'billable' | 'non_billable' | 'internal'
export type InvitationStatus = 'pending' | 'accepted' | 'expired'

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          default_hourly_rate: number | null
          invite_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          default_hourly_rate?: number | null
          invite_code?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          default_hourly_rate?: number | null
          invite_code?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: UserRole
          hourly_rate: number | null
          is_active: boolean
          company_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          role?: UserRole
          hourly_rate?: number | null
          is_active?: boolean
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          role?: UserRole
          hourly_rate?: number | null
          is_active?: boolean
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      company_invitations: {
        Row: {
          id: string
          company_id: string
          email: string
          role: UserRole
          invited_by_id: string | null
          status: InvitationStatus
          token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          email: string
          role?: UserRole
          invited_by_id?: string | null
          status?: InvitationStatus
          token?: string
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          email?: string
          role?: UserRole
          invited_by_id?: string | null
          status?: InvitationStatus
          token?: string
          expires_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invitations_invited_by_id_fkey"
            columns: ["invited_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      stages: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          position: number
          is_terminal: boolean
          company_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          position: number
          is_terminal?: boolean
          company_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          position?: number
          is_terminal?: boolean
          company_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      deals: {
        Row: {
          id: string
          name: string
          company_name: string // Client company name
          description: string | null
          stage_id: string
          status: DealStatus
          // Brand positioning fields
          engagement_type: EngagementType
          project_value: number | null
          budget: number | null
          hours_budgeted: number | null
          start_date: string | null
          end_date: string | null
          client_industry: string | null
          client_size: ClientSize | null
          deliverables: string | null
          win_likelihood: number
          // Legacy fields (kept for compatibility)
          valuation: number | null
          investment_amount: number | null
          equity_percentage: number | null
          probability_to_close: number
          expected_close_date: string | null
          actual_close_date: string | null
          lead_partner_id: string | null // Account Lead
          created_by_id: string
          industry: string | null
          deal_source: string | null
          company_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          company_name: string
          description?: string | null
          stage_id: string
          status?: DealStatus
          engagement_type?: EngagementType
          project_value?: number | null
          budget?: number | null
          hours_budgeted?: number | null
          start_date?: string | null
          end_date?: string | null
          client_industry?: string | null
          client_size?: ClientSize | null
          deliverables?: string | null
          win_likelihood?: number
          valuation?: number | null
          investment_amount?: number | null
          equity_percentage?: number | null
          probability_to_close?: number
          expected_close_date?: string | null
          actual_close_date?: string | null
          lead_partner_id?: string | null
          created_by_id: string
          industry?: string | null
          deal_source?: string | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          company_name?: string
          description?: string | null
          stage_id?: string
          status?: DealStatus
          engagement_type?: EngagementType
          project_value?: number | null
          budget?: number | null
          hours_budgeted?: number | null
          start_date?: string | null
          end_date?: string | null
          client_industry?: string | null
          client_size?: ClientSize | null
          deliverables?: string | null
          win_likelihood?: number
          valuation?: number | null
          investment_amount?: number | null
          equity_percentage?: number | null
          probability_to_close?: number
          expected_close_date?: string | null
          actual_close_date?: string | null
          lead_partner_id?: string | null
          created_by_id?: string
          industry?: string | null
          deal_source?: string | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_partner_id_fkey"
            columns: ["lead_partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          }
        ]
      }
      deal_members: {
        Row: {
          id: string
          deal_id: string
          user_id: string
          role: string
          added_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          user_id: string
          role?: string
          added_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          user_id?: string
          role?: string
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_members_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          deal_id: string | null
          assignee_id: string | null
          created_by_id: string
          status: TaskStatus
          priority: TaskPriority
          due_date: string | null
          completed_at: string | null
          estimated_hours: number | null
          phase: string | null
          company_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          deal_id?: string | null
          assignee_id?: string | null
          created_by_id: string
          status?: TaskStatus
          priority?: TaskPriority
          due_date?: string | null
          completed_at?: string | null
          estimated_hours?: number | null
          phase?: string | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          deal_id?: string | null
          assignee_id?: string | null
          created_by_id?: string
          status?: TaskStatus
          priority?: TaskPriority
          due_date?: string | null
          completed_at?: string | null
          estimated_hours?: number | null
          phase?: string | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          }
        ]
      }
      time_logs: {
        Row: {
          id: string
          user_id: string
          deal_id: string | null
          task_id: string | null
          date: string
          hours: number
          log_type: TimeLogType
          description: string
          hourly_rate_at_time: number | null
          company_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          deal_id?: string | null
          task_id?: string | null
          date: string
          hours: number
          log_type?: TimeLogType
          description: string
          hourly_rate_at_time?: number | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          deal_id?: string | null
          task_id?: string | null
          date?: string
          hours?: number
          log_type?: TimeLogType
          description?: string
          hourly_rate_at_time?: number | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      deal_activities: {
        Row: {
          id: string
          deal_id: string
          user_id: string | null
          action: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          user_id?: string | null
          action: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          user_id?: string | null
          action?: string
          details?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      deal_notes: {
        Row: {
          id: string
          deal_id: string
          user_id: string
          content: string
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          user_id: string
          content: string
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          user_id?: string
          content?: string
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      pipeline_summary: {
        Row: {
          stage_id: string
          stage_name: string
          color: string
          position: number
          company_id: string | null
          deal_count: number
          total_investment: number
          avg_probability: number
        }
      }
      user_time_summary: {
        Row: {
          user_id: string
          full_name: string
          week_start: string
          total_hours: number
          billable_hours: number
          total_value: number
        }
      }
      deal_time_summary: {
        Row: {
          deal_id: string
          deal_name: string
          company_name: string
          company_id: string | null
          total_hours: number
          billable_hours: number
          team_members_logged: number
          total_cost: number
        }
      }
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: UserRole
      }
      is_deal_member: {
        Args: { deal_uuid: string; user_uuid: string }
        Returns: boolean
      }
      get_user_company: {
        Args: { user_id: string }
        Returns: string | null
      }
      user_in_company: {
        Args: { user_uuid: string; company_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      deal_status: DealStatus
      task_priority: TaskPriority
      task_status: TaskStatus
      time_log_type: TimeLogType
      invitation_status: InvitationStatus
    }
  }
}

// Convenience types for working with the database
export type Company = Database['public']['Tables']['companies']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Stage = Database['public']['Tables']['stages']['Row']
export type Deal = Database['public']['Tables']['deals']['Row']
export type DealMember = Database['public']['Tables']['deal_members']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TimeLog = Database['public']['Tables']['time_logs']['Row']
export type DealActivity = Database['public']['Tables']['deal_activities']['Row']
export type DealNote = Database['public']['Tables']['deal_notes']['Row']
export type CompanyInvitation = Database['public']['Tables']['company_invitations']['Row']

// Insert types
export type InsertCompany = Database['public']['Tables']['companies']['Insert']
export type InsertProfile = Database['public']['Tables']['profiles']['Insert']
export type InsertDeal = Database['public']['Tables']['deals']['Insert']
export type InsertTask = Database['public']['Tables']['tasks']['Insert']
export type InsertTimeLog = Database['public']['Tables']['time_logs']['Insert']
export type InsertInvitation = Database['public']['Tables']['company_invitations']['Insert']

// Extended types with relations
export type ProfileWithCompany = Profile & {
  company: Company | null
}

export type DealWithRelations = Deal & {
  stage: Stage
  lead_partner: Profile | null
  created_by: Profile
  members: (DealMember & { user: Profile })[]
  tasks: Task[]
  time_logs: TimeLog[]
}

export type TaskWithRelations = Task & {
  deal: Deal | null
  assignee: Profile | null
  created_by: Profile
}

export type TimeLogWithRelations = TimeLog & {
  user: Profile
  deal: Deal | null
  task: Task | null
}

export type InvitationWithRelations = CompanyInvitation & {
  company: Company
  invited_by: Profile | null
}
