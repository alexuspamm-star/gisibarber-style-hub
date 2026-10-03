export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocked_slots: {
        Row: {
          created_at: string
          day: string
          id: string
          slot: string
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          slot: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          slot?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          created_at: string
          customer_name: string
          description: string | null
          id: string
          image_url: string | null
          phone: string
          product_name: string | null
          status: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          created_at?: string
          customer_name: string
          description?: string | null
          id?: string
          image_url?: string | null
          phone: string
          product_name?: string | null
          status?: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          created_at?: string
          customer_name?: string
          description?: string | null
          id?: string
          image_url?: string | null
          phone?: string
          product_name?: string | null
          status?: string
        }
        Relationships: []
      }
      closed_days: {
        Row: {
          day: string
          reason: string | null
        }
        Insert: {
          day: string
          reason?: string | null
        }
        Update: {
          day?: string
          reason?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          available: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number | null
          sort_order: number
        }
        Insert: {
          available?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: number | null
          sort_order?: number
        }
        Update: {
          available?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number | null
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author: string
          body: string
          created_at: string
          id: string
          rating: number
        }
        Insert: {
          author: string
          body: string
          created_at?: string
          id?: string
          rating?: number
        }
        Update: {
          author?: string
          body?: string
          created_at?: string
          id?: string
          rating?: number
        }
        Relationships: []
      }
      site_images: {
        Row: {
          created_at: string
          id: string
          media_type: string
          section: string
          sort_order: number
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type?: string
          section: string
          sort_order?: number
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          section?: string
          sort_order?: number
          title?: string | null
          url?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address: string
          created_at: string
          hero_image_url: string
          hero_tagline: string
          id: string
          instagram_handle: string
          instagram_url: string
          map_url: string
          phone: string
          primary_color: string
          services: string
          singleton: boolean
          updated_at: string
        }
        Insert: {
          address?: string
          created_at?: string
          hero_image_url?: string
          hero_tagline?: string
          id?: string
          instagram_handle?: string
          instagram_url?: string
          map_url?: string
          phone?: string
          primary_color?: string
          services?: string
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          hero_image_url?: string
          hero_tagline?: string
          id?: string
          instagram_handle?: string
          instagram_url?: string
          map_url?: string
          phone?: string
          primary_color?: string
          services?: string
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      work_hours: {
        Row: {
          close_time: string
          is_open: boolean
          open_time: string
          slot_minutes: number
          weekday: number
        }
        Insert: {
          close_time?: string
          is_open?: boolean
          open_time?: string
          slot_minutes?: number
          weekday: number
        }
        Update: {
          close_time?: string
          is_open?: boolean
          open_time?: string
          slot_minutes?: number
          weekday?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      taken_slots: { Args: { d: string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
