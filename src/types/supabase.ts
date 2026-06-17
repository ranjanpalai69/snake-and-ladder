export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_id: string;
          bio: string | null;
          rank_tier: string;
          rank_stars: number;
          rank_points: number;
          level: number;
          xp: number;
          total_matches: number;
          wins: number;
          losses: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_id?: string;
          bio?: string | null;
          rank_tier?: string;
          rank_stars?: number;
          rank_points?: number;
          level?: number;
          xp?: number;
          total_matches?: number;
          wins?: number;
          losses?: number;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      matches: {
        Row: {
          id: string;
          room_id: string;
          winner_id: string | null;
          status: string;
          started_at: string | null;
          finished_at: string | null;
          created_at: string;
          game_data: Json;
        };
        Insert: {
          id?: string;
          room_id: string;
          winner_id?: string | null;
          status?: string;
          started_at?: string | null;
          finished_at?: string | null;
          game_data?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>;
      };
      match_players: {
        Row: {
          id: string;
          match_id: string;
          user_id: string;
          color: string;
          avatar_id: string;
          final_position: number;
          rank_change: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          user_id: string;
          color: string;
          avatar_id: string;
          final_position?: number;
          rank_change?: number;
        };
        Update: Partial<Database["public"]["Tables"]["match_players"]["Insert"]>;
      };
    };
    Views: {
      match_history_view: {
        Row: {
          match_id: string;
          user_id: string;
          opponent_usernames: string[];
          winner_id: string | null;
          rank_change: number;
          finished_at: string | null;
          created_at: string;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
