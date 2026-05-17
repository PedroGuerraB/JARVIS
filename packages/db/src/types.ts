// Generated types will be placed here after running:
// mcp__supabase__generate_typescript_types
// For now, using a placeholder that will be replaced.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string;
          name: string;
          status: string;
          capabilities: Json;
          config: Json;
          last_heartbeat: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['agents']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['agents']['Insert']>;
      };
      agent_tasks: {
        Row: {
          id: string;
          agent_id: string | null;
          type: string;
          payload: Json;
          status: string;
          priority: number;
          created_at: string;
          completed_at: string | null;
          error: string | null;
        };
        Insert: Omit<Database['public']['Tables']['agent_tasks']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['agent_tasks']['Insert']>;
      };
      agent_events: {
        Row: {
          id: string;
          source_agent: string;
          event_type: string;
          payload: Json;
          processed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['agent_events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['agent_events']['Insert']>;
      };
      agent_logs: {
        Row: {
          id: string;
          agent_id: string | null;
          task_id: string | null;
          tokens_input: number;
          tokens_output: number;
          duration_ms: number;
          model: string;
          success: boolean;
          error: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['agent_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['agent_logs']['Insert']>;
      };
      shared_memory: {
        Row: {
          id: string;
          key: string;
          value: Json;
          scope: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shared_memory']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['shared_memory']['Insert']>;
      };
      recommendations: {
        Row: {
          id: string;
          agent_id: string | null;
          type: string;
          content: string;
          priority: number;
          impact_estimate: string | null;
          acted_on: boolean;
          acted_on_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['recommendations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['recommendations']['Insert']>;
      };
      ad_library: {
        Row: {
          id: string;
          platform: string;
          url: string | null;
          copy: string | null;
          visual_description: string | null;
          hook: string | null;
          score: number | null;
          viral_metrics: Json;
          mined_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ad_library']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ad_library']['Insert']>;
      };
      hooks_library: {
        Row: {
          id: string;
          text: string;
          category: string | null;
          score: number;
          usage_count: number;
          conversion_rate: number | null;
          tier: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['hooks_library']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['hooks_library']['Insert']>;
      };
      leads: {
        Row: {
          id: string;
          name: string | null;
          phone: string | null;
          source: string | null;
          stage: string;
          score: number;
          whatsapp_opt_in: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['leads']['Insert']>;
      };
      creatives: {
        Row: {
          id: string;
          type: string;
          copy: string | null;
          headline: string | null;
          hook_id: string | null;
          score: number | null;
          status: string;
          ab_group: string | null;
          performance: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['creatives']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['creatives']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
