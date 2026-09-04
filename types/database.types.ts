export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      templates: {
        Row: {
          id: string
          title: string
          category: string
          description: string | null
          tips: Json | null
          image_url: string
          creator_id: string | null
          difficulty: string | null
          time: string | null
          time_setup: string | null
          ratio: string | null
          used_count: number | null
          saved_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          category: string
          description?: string | null
          tips?: Json | null
          image_url: string
          creator_id?: string | null
          difficulty?: string | null
          time?: string | null
          time_setup?: string | null
          ratio?: string | null
          used_count?: number | null
          saved_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          category?: string
          description?: string | null
          tips?: Json | null
          image_url?: string
          creator_id?: string | null
          difficulty?: string | null
          time?: string | null
          time_setup?: string | null
          ratio?: string | null
          used_count?: number | null
          saved_count?: number | null
          created_at?: string
        }
        Relationships: []
      }
      saved_templates: {
        Row: {
          id: string
          user_id: string
          template_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_template_usage: {
        Args: {
          target_template_id: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

