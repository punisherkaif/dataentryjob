export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'ADMIN' | 'USER'
export type UserStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED'
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'PASSED' | 'FAILED'
export type SubmissionStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'PASSED' | 'FAILED'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          username: string
          role: UserRole
          status: UserStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          phone: string
          username: string
          role?: UserRole
          status?: UserStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          username?: string
          role?: UserRole
          status?: UserStatus
          created_at?: string
          updated_at?: string
        }
      }
      registrations: {
        Row: {
          id: string
          user_id: string
          transaction_id: string
          payment_amount: number
          payment_screenshot_url: string | null
          status: RegistrationStatus
          admin_note: string | null
          created_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          transaction_id: string
          payment_amount?: number
          payment_screenshot_url?: string | null
          status?: RegistrationStatus
          admin_note?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          transaction_id?: string
          payment_amount?: number
          payment_screenshot_url?: string | null
          status?: RegistrationStatus
          admin_note?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          instructions: string | null
          assigned_to: string | null
          deadline: string | null
          status: TaskStatus
          zip_file_url: string | null
          zip_file_name: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          instructions?: string | null
          assigned_to?: string | null
          deadline?: string | null
          status?: TaskStatus
          zip_file_url?: string | null
          zip_file_name?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          instructions?: string | null
          assigned_to?: string | null
          deadline?: string | null
          status?: TaskStatus
          zip_file_url?: string | null
          zip_file_name?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      task_images: {
        Row: {
          id: string
          task_id: string
          image_url: string
          image_order: number
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          image_url: string
          image_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          image_url?: string
          image_order?: number
          created_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          task_id: string
          user_id: string
          google_drive_url: string
          status: SubmissionStatus
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          failure_reason: string | null
          allow_resubmission: boolean
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          google_drive_url: string
          status?: SubmissionStatus
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          failure_reason?: string | null
          allow_resubmission?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          google_drive_url?: string
          status?: SubmissionStatus
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          failure_reason?: string | null
          allow_resubmission?: boolean
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          description?: string | null
          created_at?: string
        }
      }
    }
  }
}
