export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      countries: {
        Row: {
          id: string;
          name: string;
          code: string;
          currency_code: string;
          currency_symbol: string;
          timezone: string;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          currency_code: string;
          currency_symbol: string;
          timezone: string;
          locale: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          currency_code?: string;
          currency_symbol?: string;
          timezone?: string;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      universities: {
        Row: {
          id: string;
          name: string;
          slug: string;
          country_id: string;
          logo_url: string | null;
          website: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          country_id: string;
          logo_url?: string | null;
          website?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          country_id?: string;
          logo_url?: string | null;
          website?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "universities_country_id_fkey";
            columns: ["country_id"];
            isOneToOne: false;
            referencedRelation: "countries";
            referencedColumns: ["id"];
          },
        ];
      };
      campuses: {
        Row: {
          id: string;
          university_id: string;
          name: string;
          slug: string;
          city: string;
          state: string;
          latitude: number;
          longitude: number;
          address: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          university_id: string;
          name: string;
          slug: string;
          city: string;
          state: string;
          latitude: number;
          longitude: number;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          university_id?: string;
          name?: string;
          slug?: string;
          city?: string;
          state?: string;
          latitude?: number;
          longitude?: number;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "campuses_university_id_fkey";
            columns: ["university_id"];
            isOneToOne: false;
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
        ];
      };
      neighbourhoods: {
        Row: {
          id: string;
          campus_id: string;
          name: string;
          slug: string;
          description: string | null;
          latitude: number | null;
          longitude: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          campus_id: string;
          name: string;
          slug: string;
          description?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          campus_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "neighbourhoods_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
        ];
      };
      landlords: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          company_name: string | null;
          tax_id: string | null;
          bank_account: string | null;
          bank_name: string | null;
          is_verified: boolean;
          verification_state: "unverified" | "identity_verified" | "documents_verified" | "approved" | "suspended";
          identity_verified_at: string | null;
          documents_verified_at: string | null;
          approved_at: string | null;
          approved_by: string | null;
          suspended_at: string | null;
          suspension_reason: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          company_name?: string | null;
          tax_id?: string | null;
          bank_account?: string | null;
          bank_name?: string | null;
          is_verified?: boolean;
          verification_state?: "unverified" | "identity_verified" | "documents_verified" | "approved" | "suspended";
          identity_verified_at?: string | null;
          documents_verified_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          suspended_at?: string | null;
          suspension_reason?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          company_name?: string | null;
          tax_id?: string | null;
          bank_account?: string | null;
          bank_name?: string | null;
          is_verified?: boolean;
          verification_state?: "unverified" | "identity_verified" | "documents_verified" | "approved" | "suspended";
          identity_verified_at?: string | null;
          documents_verified_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          suspended_at?: string | null;
          suspension_reason?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          campus_id: string;
          neighbourhood_id: string;
          landlord_id: string | null;
          title: string;
          slug: string;
          description: string | null;
          address: string;
          latitude: number | null;
          longitude: number | null;
          property_type: "hostel" | "apartment" | "shared_house" | "single_room" | "self_contained" | "studio";
          status: "draft" | "published" | "unpublished" | "archived";
          total_rooms: number;
          available_rooms: number;
          min_price: number | null;
          max_price: number | null;
          letting_mode: "whole" | "rooms";
          currency: string;
          amenities: string[];
          rules: string[] | null;
          is_verified: boolean;
          verification_state: "draft" | "submitted" | "under_review" | "verified" | "suspended" | "archived";
          verification_notes: string | null;
          submitted_at: string | null;
          review_started_at: string | null;
          verified_at: string | null;
          verified_by: string | null;
          suspended_at: string | null;
          suspension_reason: string | null;
          commission_bps: number | null;
          featured_order: number | null;
          meta_title: string | null;
          meta_description: string | null;
          avg_rating: number | null;
          review_count: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          campus_id: string;
          neighbourhood_id: string;
          landlord_id?: string | null;
          title: string;
          slug: string;
          description?: string | null;
          address: string;
          latitude?: number | null;
          longitude?: number | null;
          property_type: "hostel" | "apartment" | "shared_house" | "single_room" | "self_contained" | "studio";
          status?: "draft" | "published" | "unpublished" | "archived";
          total_rooms?: number;
          available_rooms?: number;
          min_price?: number | null;
          max_price?: number | null;
          letting_mode?: "whole" | "rooms";
          currency?: string;
          amenities?: string[];
          rules?: string[] | null;
          is_verified?: boolean;
          verification_state?: "draft" | "submitted" | "under_review" | "verified" | "suspended" | "archived";
          verification_notes?: string | null;
          submitted_at?: string | null;
          review_started_at?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
          suspended_at?: string | null;
          suspension_reason?: string | null;
          commission_bps?: number | null;
          featured_order?: number | null;
          meta_title?: string | null;
          meta_description?: string | null;
          avg_rating?: number | null;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          campus_id?: string;
          neighbourhood_id?: string;
          landlord_id?: string | null;
          title?: string;
          slug?: string;
          description?: string | null;
          address?: string;
          latitude?: number | null;
          longitude?: number | null;
          property_type?: "hostel" | "apartment" | "shared_house" | "single_room" | "self_contained" | "studio";
          status?: "draft" | "published" | "unpublished" | "archived";
          total_rooms?: number;
          available_rooms?: number;
          min_price?: number | null;
          max_price?: number | null;
          letting_mode?: "whole" | "rooms";
          currency?: string;
          amenities?: string[];
          rules?: string[] | null;
          is_verified?: boolean;
          verification_state?: "draft" | "submitted" | "under_review" | "verified" | "suspended" | "archived";
          verification_notes?: string | null;
          submitted_at?: string | null;
          review_started_at?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
          suspended_at?: string | null;
          suspension_reason?: string | null;
          commission_bps?: number | null;
          featured_order?: number | null;
          meta_title?: string | null;
          meta_description?: string | null;
          avg_rating?: number | null;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "properties_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "properties_neighbourhood_id_fkey";
            columns: ["neighbourhood_id"];
            isOneToOne: false;
            referencedRelation: "neighbourhoods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "properties_landlord_id_fkey";
            columns: ["landlord_id"];
            isOneToOne: false;
            referencedRelation: "landlords";
            referencedColumns: ["id"];
          },
        ];
      };
      buildings: {
        Row: {
          id: string;
          property_id: string;
          name: string;
          description: string | null;
          floor_count: number | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          property_id: string;
          name: string;
          description?: string | null;
          floor_count?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          property_id?: string;
          name?: string;
          description?: string | null;
          floor_count?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "buildings_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          id: string;
          property_id: string;
          building_id: string | null;
          name: string;
          description: string | null;
          room_type: "single" | "double" | "triple" | "quad" | "suite" | "shared";
          floor: number | null;
          size_sqm: number | null;
          max_occupancy: number;
          annual_rent: number;
          agency_fee: number;
          caution_fee: number;
          currency: string;
          is_available: boolean;
          amenities: string[];
          status: "available" | "occupied" | "maintenance" | "reserved";
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          property_id: string;
          building_id?: string | null;
          name: string;
          description?: string | null;
          room_type: "single" | "double" | "triple" | "quad" | "suite" | "shared";
          floor?: number | null;
          size_sqm?: number | null;
          max_occupancy?: number;
          annual_rent: number;
          agency_fee?: number;
          caution_fee?: number;
          currency?: string;
          is_available?: boolean;
          amenities?: string[];
          status?: "available" | "occupied" | "maintenance" | "reserved";
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          property_id?: string;
          building_id?: string | null;
          name?: string;
          description?: string | null;
          room_type?: "single" | "double" | "triple" | "quad" | "suite" | "shared";
          floor?: number | null;
          size_sqm?: number | null;
          max_occupancy?: number;
          annual_rent?: number;
          agency_fee?: number;
          caution_fee?: number;
          currency?: string;
          is_available?: boolean;
          amenities?: string[];
          status?: "available" | "occupied" | "maintenance" | "reserved";
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rooms_building_id_fkey";
            columns: ["building_id"];
            isOneToOne: false;
            referencedRelation: "buildings";
            referencedColumns: ["id"];
          },
        ];
      };
      media: {
        Row: {
          id: string;
          entity_type: "property" | "room" | "university" | "campus" | "inspection";
          entity_id: string;
          url: string;
          storage_path: string;
          mime_type: string;
          file_size: number;
          width: number | null;
          height: number | null;
          alt_text: string | null;
          display_order: number;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          entity_type: "property" | "room" | "university" | "campus" | "inspection";
          entity_id: string;
          url: string;
          storage_path: string;
          mime_type: string;
          file_size: number;
          width?: number | null;
          height?: number | null;
          alt_text?: string | null;
          display_order?: number;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          entity_type?: "property" | "room" | "university" | "campus" | "inspection";
          entity_id?: string;
          url?: string;
          storage_path?: string;
          mime_type?: string;
          file_size?: number;
          width?: number | null;
          height?: number | null;
          alt_text?: string | null;
          display_order?: number;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role: "student" | "admin" | "super_admin";
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          email: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          role?: "student" | "admin" | "super_admin";
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          role?: "student" | "admin" | "super_admin";
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_campus_assignments: {
        Row: {
          id: string;
          admin_id: string;
          campus_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          campus_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          campus_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_campus_assignments_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_campus_assignments_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          student_id: string;
          room_id: string;
          property_id: string;
          status: "pending" | "confirmed" | "cancelled" | "completed" | "refunded";
          check_in_date: string;
          check_out_date: string;
          total_months: number;
          annual_rent: number;
          agency_fee: number;
          caution_fee: number;
          total_amount: number;
          currency: string;
          special_requests: string | null;
          admin_notes: string | null;
          /** When the reservation window closes. NULL once paid. */
          expires_at: string | null;
          expired_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          room_id: string;
          property_id: string;
          status?: "pending" | "confirmed" | "cancelled" | "completed" | "refunded";
          check_in_date: string;
          check_out_date: string;
          total_months: number;
          annual_rent: number;
          agency_fee: number;
          caution_fee: number;
          total_amount: number;
          currency?: string;
          special_requests?: string | null;
          admin_notes?: string | null;
          expires_at?: string | null;
          expired_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          room_id?: string;
          property_id?: string;
          status?: "pending" | "confirmed" | "cancelled" | "completed" | "refunded";
          check_in_date?: string;
          check_out_date?: string;
          total_months?: number;
          annual_rent?: number;
          agency_fee?: number;
          caution_fee?: number;
          total_amount?: number;
          currency?: string;
          special_requests?: string | null;
          admin_notes?: string | null;
          expires_at?: string | null;
          expired_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          intent_id: string | null;
          provider: string;
          amount: number;
          expected_amount: number | null;
          gateway_fee: number;
          refunded_amount: number;
          currency: string;
          payment_method: "bank_transfer" | "card" | "cash" | "mobile_money";
          status: "pending" | "success" | "overpaid" | "underpaid" | "failed" | "refunded" | "partially_refunded" | "duplicate";
          anomaly: "overpayment" | "underpayment" | "duplicate_payment" | "currency_mismatch" | "amount_unverifiable" | null;
          reconciliation_status: "not_required" | "pending_review" | "pending_refund" | "refund_issued" | "resolved" | "written_off";
          reconciliation_notes: string | null;
          reconciled_at: string | null;
          reconciled_by: string | null;
          /** Whether this payment is the one that paid for its booking. */
          settles_booking: boolean;
          transaction_reference: string | null;
          paid_at: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          intent_id?: string | null;
          provider?: string;
          amount: number;
          expected_amount?: number | null;
          gateway_fee?: number;
          refunded_amount?: number;
          currency: string;
          payment_method: "bank_transfer" | "card" | "cash" | "mobile_money";
          status?: "pending" | "success" | "overpaid" | "underpaid" | "failed" | "refunded" | "partially_refunded" | "duplicate";
          anomaly?: "overpayment" | "underpayment" | "duplicate_payment" | "currency_mismatch" | "amount_unverifiable" | null;
          reconciliation_status?: "not_required" | "pending_review" | "pending_refund" | "refund_issued" | "resolved" | "written_off";
          reconciliation_notes?: string | null;
          reconciled_at?: string | null;
          reconciled_by?: string | null;
          settles_booking?: boolean;
          transaction_reference?: string | null;
          paid_at?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          intent_id?: string | null;
          provider?: string;
          amount?: number;
          expected_amount?: number | null;
          gateway_fee?: number;
          refunded_amount?: number;
          currency?: string;
          payment_method?: "bank_transfer" | "card" | "cash" | "mobile_money";
          status?: "pending" | "success" | "overpaid" | "underpaid" | "failed" | "refunded" | "partially_refunded" | "duplicate";
          anomaly?: "overpayment" | "underpayment" | "duplicate_payment" | "currency_mismatch" | "amount_unverifiable" | null;
          reconciliation_status?: "not_required" | "pending_review" | "pending_refund" | "refund_issued" | "resolved" | "written_off";
          reconciliation_notes?: string | null;
          reconciled_at?: string | null;
          reconciled_by?: string | null;
          settles_booking?: boolean;
          transaction_reference?: string | null;
          paid_at?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          student_id: string;
          booking_id: string;
          property_id: string;
          overall_rating: number;
          cleanliness_rating: number;
          location_rating: number;
          value_rating: number;
          management_rating: number;
          comment: string | null;
          admin_reply: string | null;
          is_approved: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          booking_id: string;
          property_id: string;
          overall_rating: number;
          cleanliness_rating: number;
          location_rating: number;
          value_rating: number;
          management_rating: number;
          comment?: string | null;
          admin_reply?: string | null;
          is_approved?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          booking_id?: string;
          property_id?: string;
          overall_rating?: number;
          cleanliness_rating?: number;
          location_rating?: number;
          value_rating?: number;
          management_rating?: number;
          comment?: string | null;
          admin_reply?: string | null;
          is_approved?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          id: string;
          student_id: string;
          property_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          property_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          property_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      inspections: {
        Row: {
          id: string;
          property_id: string;
          inspector_id: string;
          scheduled_date: string;
          status: "scheduled" | "completed" | "cancelled" | "no_show";
          findings: string | null;
          rating: number | null;
          photos: string[];
          recommendations: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          property_id: string;
          inspector_id: string;
          scheduled_date: string;
          status?: "scheduled" | "completed" | "cancelled" | "no_show";
          findings?: string | null;
          rating?: number | null;
          photos?: string[];
          recommendations?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          property_id?: string;
          inspector_id?: string;
          scheduled_date?: string;
          status?: "scheduled" | "completed" | "cancelled" | "no_show";
          findings?: string | null;
          rating?: number | null;
          photos?: string[];
          recommendations?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inspections_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inspections_inspector_id_fkey";
            columns: ["inspector_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "booking" | "payment" | "inspection" | "review" | "system" | "promotion";
          title: string;
          body: string;
          data: Json | null;
          is_read: boolean;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "booking" | "payment" | "inspection" | "review" | "system" | "promotion";
          title: string;
          body: string;
          data?: Json | null;
          is_read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "booking" | "payment" | "inspection" | "review" | "system" | "promotion";
          title?: string;
          body?: string;
          data?: Json | null;
          is_read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          table_name: string;
          record_id: string;
          action: "INSERT" | "UPDATE" | "DELETE";
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          table_name: string;
          record_id: string;
          action: "INSERT" | "UPDATE" | "DELETE";
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          table_name?: string;
          record_id?: string;
          action?: "INSERT" | "UPDATE" | "DELETE";
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      platform_settings: {
        Row: {
          id: boolean;
          platform_commission_bps: number;
          booking_reservation_minutes: number;
          payment_window_hours: number;
          payment_intent_ttl_minutes: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: boolean;
          platform_commission_bps?: number;
          booking_reservation_minutes?: number;
          payment_window_hours?: number;
          payment_intent_ttl_minutes?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: boolean;
          platform_commission_bps?: number;
          booking_reservation_minutes?: number;
          payment_window_hours?: number;
          payment_intent_ttl_minutes?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      payment_intents: {
        Row: {
          id: string;
          booking_id: string;
          reference: string;
          provider: string;
          amount: number;
          currency: string;
          status: "active" | "consumed" | "expired" | "cancelled" | "superseded";
          authorization_url: string | null;
          attempt_count: number;
          expires_at: string;
          consumed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          reference: string;
          provider?: string;
          amount: number;
          currency?: string;
          status?: "active" | "consumed" | "expired" | "cancelled" | "superseded";
          authorization_url?: string | null;
          attempt_count?: number;
          expires_at: string;
          consumed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          reference?: string;
          provider?: string;
          amount?: number;
          currency?: string;
          status?: "active" | "consumed" | "expired" | "cancelled" | "superseded";
          authorization_url?: string | null;
          attempt_count?: number;
          expires_at?: string;
          consumed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_intents_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_exceptions: {
        Row: {
          id: string;
          provider: string;
          reference: string;
          amount: number;
          currency: string;
          booking_id: string | null;
          reason: "booking_not_found" | "booking_deleted" | "missing_metadata" | "invalid_amount";
          raw: Json | null;
          notes: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider?: string;
          reference: string;
          amount: number;
          currency?: string;
          booking_id?: string | null;
          reason: "booking_not_found" | "booking_deleted" | "missing_metadata" | "invalid_amount";
          raw?: Json | null;
          notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Relationships: [];
      };
      ledger_entries: {
        Row: {
          id: string;
          booking_id: string | null;
          payment_id: string | null;
          property_id: string | null;
          landlord_id: string | null;
          entry_type:
            | "gateway_charge"
            | "gateway_fee"
            | "platform_commission"
            | "landlord_payable"
            | "landlord_payout"
            | "refund_due"
            | "refund_paid"
            | "adjustment";
          direction: "credit" | "debit";
          amount: number;
          /** Generated: +amount for a credit, -amount for a debit. */
          signed_amount: number;
          currency: string;
          reference: string | null;
          notes: string | null;
          metadata: Json | null;
          occurred_at: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "ledger_entries_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ledger_entries_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_outbox: {
        Row: {
          id: string;
          topic: string;
          event: string;
          subject_type: string;
          subject_id: string;
          payload: Json;
          status: "pending" | "processing" | "sent" | "failed" | "dead";
          attempts: number;
          max_attempts: number;
          available_at: string;
          locked_at: string | null;
          locked_by: string | null;
          last_error: string | null;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      security_events: {
        Row: {
          id: string;
          occurred_at: string;
          actor_id: string | null;
          actor_role: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          result: "allowed" | "denied" | "error";
          ip_address: string | null;
          user_agent: string | null;
          request_id: string | null;
          detail: Json | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      property_listings: {
        Row: {
          id: string | null;
          campus_id: string | null;
          neighbourhood_id: string | null;
          neighbourhood_name: string | null;
          title: string | null;
          slug: string | null;
          description: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          property_type: Database["public"]["Tables"]["properties"]["Row"]["property_type"] | null;
          status: Database["public"]["Tables"]["properties"]["Row"]["status"] | null;
          total_rooms: number | null;
          available_rooms: number | null;
          min_price: number | null;
          max_price: number | null;
          currency: string | null;
          amenities: string[] | null;
          is_verified: boolean | null;
          featured_order: number | null;
          rules: string[] | null;
          media_url: string | null;
          media_count: number | null;
          avg_rating: number | null;
          review_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
      public_profiles: {
        Row: {
          id: string | null;
          full_name: string | null;
          avatar_url: string | null;
        };
        Relationships: [];
      };
      room_listings: {
        Row: {
          id: string | null;
          property_id: string | null;
          property_title: string | null;
          property_slug: string | null;
          campus_id: string | null;
          building_id: string | null;
          building_name: string | null;
          name: string | null;
          description: string | null;
          room_type: Database["public"]["Tables"]["rooms"]["Row"]["room_type"] | null;
          floor: number | null;
          size_sqm: number | null;
          max_occupancy: number | null;
          annual_rent: number | null;
          agency_fee: number | null;
          caution_fee: number | null;
          total_payable: number | null;
          letting_mode: "whole" | "rooms" | null;
          currency: string | null;
          is_available: boolean | null;
          amenities: string[] | null;
          status: Database["public"]["Tables"]["rooms"]["Row"]["status"] | null;
          media_url: string | null;
          media_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
      booking_financials: {
        Row: {
          booking_id: string | null;
          property_id: string | null;
          student_id: string | null;
          booking_status: string | null;
          booking_total: number | null;
          currency: string | null;
          gross_received: number | null;
          gateway_fees: number | null;
          platform_commission: number | null;
          landlord_outstanding: number | null;
          landlord_paid_out: number | null;
          refunds_outstanding: number | null;
          refunds_paid: number | null;
        };
        Relationships: [];
      };
      payment_reconciliation_queue: {
        Row: {
          payment_id: string | null;
          booking_id: string | null;
          transaction_reference: string | null;
          status: string | null;
          anomaly: string | null;
          reconciliation_status: string | null;
          reconciliation_notes: string | null;
          amount: number | null;
          expected_amount: number | null;
          variance: number | null;
          refunded_amount: number | null;
          currency: string | null;
          paid_at: string | null;
          created_at: string | null;
          student_id: string | null;
          property_id: string | null;
          refund_outstanding: number | null;
        };
        Relationships: [];
      };
      ledger_imbalances: {
        Row: {
          payment_id: string | null;
          imbalance: number | null;
          entries: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_booking: {
        Args: {
          p_room_id: string;
          p_property_id: string;
          p_check_in_date: string;
          p_special_requests?: string | null;
        };
        Returns: Database["public"]["Tables"]["bookings"]["Row"];
      };
      cancel_booking: {
        Args: {
          p_booking_id: string;
        };
        Returns: Database["public"]["Tables"]["bookings"]["Row"];
      };
      admin_update_booking_status: {
        Args: {
          p_booking_id: string;
          p_action: string;
        };
        Returns: Database["public"]["Tables"]["bookings"]["Row"];
      };
      record_gateway_charge: {
        Args: {
          p_provider: string;
          p_reference: string;
          p_booking_id: string | null;
          p_amount_minor: number;
          p_currency: string;
          p_channel: string;
          p_paid_at?: string;
          p_gateway_fee_minor?: number;
          p_metadata?: Json;
        };
        Returns: Json;
      };
      create_payment_intent: {
        Args: {
          p_booking_id: string;
          p_reference: string;
          p_provider?: string;
        };
        Returns: Database["public"]["Tables"]["payment_intents"]["Row"];
      };
      attach_intent_authorization: {
        Args: { p_intent_id: string; p_url: string };
        Returns: undefined;
      };
      record_refund: {
        Args: {
          p_payment_id: string;
          p_amount: number;
          p_reference?: string;
          p_notes?: string;
        };
        Returns: Json;
      };
      resolve_payment_reconciliation: {
        Args: { p_payment_id: string; p_status: string; p_notes?: string };
        Returns: Database["public"]["Tables"]["payments"]["Row"];
      };
      record_landlord_payout: {
        Args: {
          p_booking_id: string;
          p_amount: number;
          p_reference?: string;
          p_notes?: string;
        };
        Returns: Json;
      };
      expire_stale_bookings: {
        Args: { p_limit?: number };
        Returns: Json;
      };
      set_property_verification_state: {
        Args: { p_property_id: string; p_state: string; p_notes?: string };
        Returns: Database["public"]["Tables"]["properties"]["Row"];
      };
      set_landlord_verification_state: {
        Args: { p_landlord_id: string; p_state: string; p_notes?: string };
        Returns: Database["public"]["Tables"]["landlords"]["Row"];
      };
      set_featured_media: {
        Args: { p_media_id: string };
        Returns: Database["public"]["Tables"]["media"]["Row"];
      };
      claim_notifications: {
        Args: { p_limit?: number; p_worker?: string };
        Returns: Database["public"]["Tables"]["notification_outbox"]["Row"][];
      };
      complete_notification: {
        Args: { p_id: string; p_ok: boolean; p_error?: string | null };
        Returns: undefined;
      };
      enqueue_notification: {
        Args: {
          p_topic: string;
          p_event: string;
          p_subject_type: string;
          p_subject_id: string;
          p_payload?: Json;
        };
        Returns: string | null;
      };
      log_security_event: {
        Args: {
          p_action: string;
          p_result: string;
          p_resource_type?: string | null;
          p_resource_id?: string | null;
          p_actor_id?: string | null;
          p_actor_role?: string | null;
          p_ip?: string | null;
          p_user_agent?: string | null;
          p_request_id?: string | null;
          p_detail?: Json | null;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

export type Campus = Tables<"campuses">;
export type University = Tables<"universities">;
export type Neighbourhood = Tables<"neighbourhoods">;
export type Property = Tables<"properties">;
export type Building = Tables<"buildings">;
export type Room = Tables<"rooms">;
export type Media = Tables<"media">;
export type Profile = Tables<"profiles">;
export type Booking = Tables<"bookings">;
export type Payment = Tables<"payments">;
export type Review = Tables<"reviews">;
export type Favorite = Tables<"favorites">;
export type Inspection = Tables<"inspections">;
export type Notification = Tables<"notifications">;
export type AuditLog = Tables<"audit_logs">;
export type Landlord = Tables<"landlords">;
export type PropertyListing = Views<"property_listings">;
export type RoomListing = Views<"room_listings">;
export type PaymentIntent = Tables<"payment_intents">;
export type PaymentException = Tables<"payment_exceptions">;
export type LedgerEntry = Tables<"ledger_entries">;
export type PlatformSettings = Tables<"platform_settings">;
export type SecurityEvent = Tables<"security_events">;
export type OutboxRow = Tables<"notification_outbox">;
export type BookingFinancials = Views<"booking_financials">;
export type ReconciliationQueueRow = Views<"payment_reconciliation_queue">;

/** The payment statuses that mean the booking has been paid for. */
export const SETTLING_PAYMENT_STATUSES = [
  "success",
  "overpaid",
  "partially_refunded",
] as const;

/**
 * Whether a booking's payments include the one that paid for it.
 *
 * Screens used to ask `payments.some(p => p.status === "success")`, which
 * quietly stopped being the whole answer once 'overpaid' existed — an
 * overpaid booking IS paid. `settles_booking` is the column that means
 * exactly this, and a partial unique index guarantees at most one row per
 * booking carries it.
 */
export function isBookingPaid(
  payments: Array<{ settles_booking?: boolean | null; status?: string | null }> | null | undefined
): boolean {
  return (payments ?? []).some(
    (p) =>
      p.settles_booking === true ||
      // Rows read through a projection that did not select the column.
      (p.settles_booking === undefined &&
        (SETTLING_PAYMENT_STATUSES as readonly string[]).includes(p.status ?? ""))
  );
}

