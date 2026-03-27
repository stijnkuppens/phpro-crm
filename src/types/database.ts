export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      account_cc_services: {
        Row: {
          account_competence_center_id: string
          created_at: string
          id: string
          service_id: string
        }
        Insert: {
          account_competence_center_id: string
          created_at?: string
          id?: string
          service_id: string
        }
        Update: {
          account_competence_center_id?: string
          created_at?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_cc_services_account_competence_center_id_fkey"
            columns: ["account_competence_center_id"]
            isOneToOne: false
            referencedRelation: "account_competence_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_cc_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ref_cc_services"
            referencedColumns: ["id"]
          },
        ]
      }
      account_competence_centers: {
        Row: {
          account_id: string
          competence_center_id: string
          contact_person: string | null
          created_at: string
          distribution: string | null
          email: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          competence_center_id: string
          contact_person?: string | null
          created_at?: string
          distribution?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          competence_center_id?: string
          contact_person?: string | null
          created_at?: string
          distribution?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_competence_centers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_competence_centers_competence_center_id_fkey"
            columns: ["competence_center_id"]
            isOneToOne: false
            referencedRelation: "ref_competence_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      account_hosting: {
        Row: {
          account_id: string
          created_at: string
          environment_id: string | null
          id: string
          notes: string | null
          provider_id: string
          updated_at: string
          url: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          environment_id?: string | null
          id?: string
          notes?: string | null
          provider_id: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          environment_id?: string | null
          id?: string
          notes?: string | null
          provider_id?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_hosting_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_hosting_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "ref_hosting_environments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_hosting_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ref_hosting_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      account_manual_services: {
        Row: {
          account_id: string
          created_at: string
          id: string
          service_name: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          service_name: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          service_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_manual_services_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      account_samenwerkingsvormen: {
        Row: {
          account_id: string
          collaboration_type_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          collaboration_type_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          collaboration_type_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_samenwerkingsvormen_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_samenwerkingsvormen_collaboration_type_id_fkey"
            columns: ["collaboration_type_id"]
            isOneToOne: false
            referencedRelation: "ref_collaboration_types"
            referencedColumns: ["id"]
          },
        ]
      }
      account_services: {
        Row: {
          account_id: string
          created_at: string
          id: string
          service_id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          service_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_services_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ref_cc_services"
            referencedColumns: ["id"]
          },
        ]
      }
      account_tech_stacks: {
        Row: {
          account_id: string
          created_at: string
          id: string
          technology_id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          technology_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          technology_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_tech_stacks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_tech_stacks_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "ref_technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          about: string | null
          account_director: string | null
          address: string | null
          country: string | null
          created_at: string
          domain: string | null
          health: number | null
          id: string
          industry: string | null
          logo_url: string | null
          managing_partner: string | null
          name: string
          owner_id: string | null
          phone: string | null
          phpro_contract: string | null
          project_manager_id: string | null
          revenue: number | null
          size: string | null
          status: string
          team: string | null
          type: string
          updated_at: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          about?: string | null
          account_director?: string | null
          address?: string | null
          country?: string | null
          created_at?: string
          domain?: string | null
          health?: number | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          managing_partner?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          phpro_contract?: string | null
          project_manager_id?: string | null
          revenue?: number | null
          size?: string | null
          status?: string
          team?: string | null
          type?: string
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          about?: string | null
          account_director?: string | null
          address?: string | null
          country?: string | null
          created_at?: string
          domain?: string | null
          health?: number | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          managing_partner?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          phpro_contract?: string | null
          project_manager_id?: string | null
          revenue?: number | null
          size?: string | null
          status?: string
          team?: string | null
          type?: string
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          account_id: string
          created_at: string
          date: string
          deal_id: string | null
          duration_minutes: number | null
          id: string
          is_done: boolean
          notes: Json | null
          owner_id: string | null
          subject: string
          type: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          date: string
          deal_id?: string | null
          duration_minutes?: number | null
          id?: string
          is_done?: boolean
          notes?: Json | null
          owner_id?: string | null
          subject: string
          type: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          date?: string
          deal_id?: string | null
          duration_minutes?: number | null
          id?: string
          is_done?: boolean
          notes?: Json | null
          owner_id?: string | null
          subject?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      communications: {
        Row: {
          account_id: string
          contact_id: string | null
          content: Json | null
          created_at: string
          date: string
          deal_id: string | null
          duration_minutes: number | null
          id: string
          is_done: boolean
          owner_id: string | null
          subject: string
          to: string | null
          type: string
          updated_at: string
        }
        Insert: {
          account_id: string
          contact_id?: string | null
          content?: Json | null
          created_at?: string
          date?: string
          deal_id?: string | null
          duration_minutes?: number | null
          id?: string
          is_done?: boolean
          owner_id?: string | null
          subject: string
          to?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          contact_id?: string | null
          content?: Json | null
          created_at?: string
          date?: string
          deal_id?: string | null
          duration_minutes?: number | null
          id?: string
          is_done?: boolean
          owner_id?: string | null
          subject?: string
          to?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_contract_attributions: {
        Row: {
          cc_contact_person: string | null
          cc_distribution: string | null
          cc_email: string | null
          cc_name: string | null
          cc_phone: string | null
          consultant_id: string
          contact_id: string | null
          created_at: string
          id: string
          type: string
          updated_at: string
        }
        Insert: {
          cc_contact_person?: string | null
          cc_distribution?: string | null
          cc_email?: string | null
          cc_name?: string | null
          cc_phone?: string | null
          consultant_id: string
          contact_id?: string | null
          created_at?: string
          id?: string
          type: string
          updated_at?: string
        }
        Update: {
          cc_contact_person?: string | null
          cc_distribution?: string | null
          cc_email?: string | null
          cc_name?: string | null
          cc_phone?: string | null
          consultant_id?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultant_contract_attributions_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_contract_attributions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_extensions: {
        Row: {
          consultant_id: string
          created_at: string
          id: string
          new_end_date: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          consultant_id: string
          created_at?: string
          id?: string
          new_end_date: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          consultant_id?: string
          created_at?: string
          id?: string
          new_end_date?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultant_extensions_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_languages: {
        Row: {
          consultant_id: string
          created_at: string
          id: string
          language: string
          level: string
          updated_at: string
        }
        Insert: {
          consultant_id: string
          created_at?: string
          id?: string
          language: string
          level: string
          updated_at?: string
        }
        Update: {
          consultant_id?: string
          created_at?: string
          id?: string
          language?: string
          level?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultant_languages_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_rate_history: {
        Row: {
          consultant_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          rate: number
          reason: string | null
          updated_at: string
        }
        Insert: {
          consultant_id: string
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          rate: number
          reason?: string | null
          updated_at?: string
        }
        Update: {
          consultant_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          rate?: number
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultant_rate_history_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
        ]
      }
      consultants: {
        Row: {
          account_id: string | null
          available_date: string | null
          avatar_path: string | null
          city: string | null
          client_city: string | null
          client_name: string | null
          created_at: string
          cv_pdf_url: string | null
          description: string | null
          end_date: string | null
          first_name: string
          hourly_rate: number | null
          id: string
          is_archived: boolean
          is_indefinite: boolean
          last_name: string
          max_hourly_rate: number | null
          min_hourly_rate: number | null
          notes: string | null
          notice_period_days: number | null
          priority: string | null
          role: string | null
          roles: string[] | null
          sow_url: string | null
          start_date: string | null
          status: string
          stop_date: string | null
          stop_reason: string | null
          technologies: string[] | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          available_date?: string | null
          avatar_path?: string | null
          city?: string | null
          client_city?: string | null
          client_name?: string | null
          created_at?: string
          cv_pdf_url?: string | null
          description?: string | null
          end_date?: string | null
          first_name: string
          hourly_rate?: number | null
          id?: string
          is_archived?: boolean
          is_indefinite?: boolean
          last_name: string
          max_hourly_rate?: number | null
          min_hourly_rate?: number | null
          notes?: string | null
          notice_period_days?: number | null
          priority?: string | null
          role?: string | null
          roles?: string[] | null
          sow_url?: string | null
          start_date?: string | null
          status?: string
          stop_date?: string | null
          stop_reason?: string | null
          technologies?: string[] | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          available_date?: string | null
          avatar_path?: string | null
          city?: string | null
          client_city?: string | null
          client_name?: string | null
          created_at?: string
          cv_pdf_url?: string | null
          description?: string | null
          end_date?: string | null
          first_name?: string
          hourly_rate?: number | null
          id?: string
          is_archived?: boolean
          is_indefinite?: boolean
          last_name?: string
          max_hourly_rate?: number | null
          min_hourly_rate?: number | null
          notes?: string | null
          notice_period_days?: number | null
          priority?: string | null
          role?: string | null
          roles?: string[] | null
          sow_url?: string | null
          start_date?: string | null
          status?: string
          stop_date?: string | null
          stop_reason?: string | null
          technologies?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultants_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_personal_info: {
        Row: {
          birthday: string | null
          children_count: number | null
          children_names: string | null
          contact_id: string
          created_at: string
          has_children: boolean | null
          hobbies: string[] | null
          id: string
          invite_dinner: boolean | null
          invite_event: boolean | null
          invite_gift: boolean | null
          marital_status: string | null
          notes: string | null
          partner_name: string | null
          partner_profession: string | null
          updated_at: string
        }
        Insert: {
          birthday?: string | null
          children_count?: number | null
          children_names?: string | null
          contact_id: string
          created_at?: string
          has_children?: boolean | null
          hobbies?: string[] | null
          id?: string
          invite_dinner?: boolean | null
          invite_event?: boolean | null
          invite_gift?: boolean | null
          marital_status?: string | null
          notes?: string | null
          partner_name?: string | null
          partner_profession?: string | null
          updated_at?: string
        }
        Update: {
          birthday?: string | null
          children_count?: number | null
          children_names?: string | null
          contact_id?: string
          created_at?: string
          has_children?: boolean | null
          hobbies?: string[] | null
          id?: string
          invite_dinner?: boolean | null
          invite_event?: boolean | null
          invite_gift?: boolean | null
          marital_status?: string | null
          notes?: string | null
          partner_name?: string | null
          partner_profession?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_personal_info_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          account_id: string
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_pinned: boolean
          is_steerco: boolean
          last_name: string
          phone: string | null
          role: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          is_pinned?: boolean
          is_steerco?: boolean
          last_name: string
          phone?: string | null
          role?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_pinned?: boolean
          is_steerco?: boolean
          last_name?: string
          phone?: string | null
          role?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          account_id: string
          created_at: string
          framework_doc_path: string | null
          framework_end: string | null
          framework_indefinite: boolean
          framework_pdf_url: string | null
          framework_start: string | null
          has_framework_contract: boolean
          has_service_contract: boolean
          id: string
          purchase_orders_doc_path: string | null
          purchase_orders_url: string | null
          service_doc_path: string | null
          service_end: string | null
          service_indefinite: boolean
          service_pdf_url: string | null
          service_start: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          framework_doc_path?: string | null
          framework_end?: string | null
          framework_indefinite?: boolean
          framework_pdf_url?: string | null
          framework_start?: string | null
          has_framework_contract?: boolean
          has_service_contract?: boolean
          id?: string
          purchase_orders_doc_path?: string | null
          purchase_orders_url?: string | null
          service_doc_path?: string | null
          service_end?: string | null
          service_indefinite?: boolean
          service_pdf_url?: string | null
          service_start?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          framework_doc_path?: string | null
          framework_end?: string | null
          framework_indefinite?: boolean
          framework_pdf_url?: string | null
          framework_start?: string | null
          has_framework_contract?: boolean
          has_service_contract?: boolean
          id?: string
          purchase_orders_doc_path?: string | null
          purchase_orders_url?: string | null
          service_doc_path?: string | null
          service_end?: string | null
          service_indefinite?: boolean
          service_pdf_url?: string | null
          service_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          account_id: string
          amount: number | null
          close_date: string | null
          closed_at: string | null
          closed_notes: string | null
          closed_reason: string | null
          closed_type: string | null
          consultant_id: string | null
          consultant_role: string | null
          contact_id: string | null
          created_at: string
          cronos_cc: string | null
          cronos_contact: string | null
          cronos_email: string | null
          description: string | null
          forecast_category: string | null
          id: string
          lead_source: string | null
          longterm_date: string | null
          origin: string | null
          owner_id: string | null
          pipeline_id: string
          probability: number | null
          stage_id: string
          title: string
          updated_at: string
        }
        Insert: {
          account_id: string
          amount?: number | null
          close_date?: string | null
          closed_at?: string | null
          closed_notes?: string | null
          closed_reason?: string | null
          closed_type?: string | null
          consultant_id?: string | null
          consultant_role?: string | null
          contact_id?: string | null
          created_at?: string
          cronos_cc?: string | null
          cronos_contact?: string | null
          cronos_email?: string | null
          description?: string | null
          forecast_category?: string | null
          id?: string
          lead_source?: string | null
          longterm_date?: string | null
          origin?: string | null
          owner_id?: string | null
          pipeline_id: string
          probability?: number | null
          stage_id: string
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number | null
          close_date?: string | null
          closed_at?: string | null
          closed_notes?: string | null
          closed_reason?: string | null
          closed_type?: string | null
          consultant_id?: string | null
          consultant_role?: string | null
          contact_id?: string | null
          created_at?: string
          cronos_cc?: string | null
          cronos_contact?: string | null
          cronos_email?: string | null
          description?: string | null
          forecast_category?: string | null
          id?: string
          lead_source?: string | null
          longterm_date?: string | null
          origin?: string | null
          owner_id?: string | null
          pipeline_id?: string
          probability?: number | null
          stage_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      hourly_rates: {
        Row: {
          account_id: string
          created_at: string
          id: string
          rate: number
          role: string
          updated_at: string
          year: number
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          rate: number
          role: string
          updated_at?: string
          year: number
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          rate?: number
          role?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "hourly_rates_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      indexation_config: {
        Row: {
          account_id: string
          created_at: string
          id: string
          indexation_type: string | null
          start_month: number | null
          start_year: number | null
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          indexation_type?: string | null
          start_month?: number | null
          start_year?: number | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          indexation_type?: string | null
          start_month?: number | null
          start_year?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indexation_config_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      indexation_draft_rates: {
        Row: {
          created_at: string
          current_rate: number
          draft_id: string
          id: string
          proposed_rate: number
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_rate: number
          draft_id: string
          id?: string
          proposed_rate: number
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_rate?: number
          draft_id?: string
          id?: string
          proposed_rate?: number
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indexation_draft_rates_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "indexation_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      indexation_draft_sla: {
        Row: {
          created_at: string
          draft_id: string
          fixed_monthly_rate: number
          id: string
          support_hourly_rate: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          draft_id: string
          fixed_monthly_rate?: number
          id?: string
          support_hourly_rate?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          draft_id?: string
          fixed_monthly_rate?: number
          id?: string
          support_hourly_rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indexation_draft_sla_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: true
            referencedRelation: "indexation_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      indexation_draft_sla_tools: {
        Row: {
          created_at: string
          draft_id: string
          id: string
          proposed_price: number
          tool_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          draft_id: string
          id?: string
          proposed_price?: number
          tool_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          draft_id?: string
          id?: string
          proposed_price?: number
          tool_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indexation_draft_sla_tools_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "indexation_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      indexation_drafts: {
        Row: {
          account_id: string
          adjustment_pct_hourly: number | null
          adjustment_pct_sla: number | null
          approved_by: string | null
          base_year: number
          created_at: string
          created_by: string | null
          id: string
          info: string | null
          percentage: number
          status: string
          target_year: number
          updated_at: string
        }
        Insert: {
          account_id: string
          adjustment_pct_hourly?: number | null
          adjustment_pct_sla?: number | null
          approved_by?: string | null
          base_year: number
          created_at?: string
          created_by?: string | null
          id?: string
          info?: string | null
          percentage: number
          status?: string
          target_year: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          adjustment_pct_hourly?: number | null
          adjustment_pct_sla?: number | null
          approved_by?: string | null
          base_year?: number
          created_at?: string
          created_by?: string | null
          id?: string
          info?: string | null
          percentage?: number
          status?: string
          target_year?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indexation_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indexation_drafts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indexation_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      indexation_history: {
        Row: {
          account_id: string
          adjustment_pct_hourly: number | null
          adjustment_pct_sla: number | null
          created_at: string
          date: string
          id: string
          info: string | null
          percentage: number
          scenario: string | null
          target_year: number
          updated_at: string
        }
        Insert: {
          account_id: string
          adjustment_pct_hourly?: number | null
          adjustment_pct_sla?: number | null
          created_at?: string
          date?: string
          id?: string
          info?: string | null
          percentage: number
          scenario?: string | null
          target_year: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          adjustment_pct_hourly?: number | null
          adjustment_pct_sla?: number | null
          created_at?: string
          date?: string
          id?: string
          info?: string | null
          percentage?: number
          scenario?: string | null
          target_year?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indexation_history_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      indexation_history_rates: {
        Row: {
          created_at: string
          history_id: string
          id: string
          rate: number
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          history_id: string
          id?: string
          rate: number
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          history_id?: string
          id?: string
          rate?: number
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indexation_history_rates_history_id_fkey"
            columns: ["history_id"]
            isOneToOne: false
            referencedRelation: "indexation_history"
            referencedColumns: ["id"]
          },
        ]
      }
      indexation_history_sla: {
        Row: {
          created_at: string
          fixed_monthly_rate: number
          history_id: string
          id: string
          support_hourly_rate: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          fixed_monthly_rate?: number
          history_id: string
          id?: string
          support_hourly_rate?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          fixed_monthly_rate?: number
          history_id?: string
          id?: string
          support_hourly_rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indexation_history_sla_history_id_fkey"
            columns: ["history_id"]
            isOneToOne: true
            referencedRelation: "indexation_history"
            referencedColumns: ["id"]
          },
        ]
      }
      indexation_history_sla_tools: {
        Row: {
          created_at: string
          history_id: string
          id: string
          price: number
          tool_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          history_id: string
          id?: string
          price?: number
          tool_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          history_id?: string
          id?: string
          price?: number
          tool_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indexation_history_sla_tools_history_id_fkey"
            columns: ["history_id"]
            isOneToOne: false
            referencedRelation: "indexation_history"
            referencedColumns: ["id"]
          },
        ]
      }
      indexation_indices: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          read: boolean
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          is_closed: boolean
          is_longterm: boolean
          is_won: boolean
          name: string
          pipeline_id: string
          probability: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_closed?: boolean
          is_longterm?: boolean
          is_won?: boolean
          name: string
          pipeline_id: string
          probability?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_closed?: boolean
          is_longterm?: boolean
          is_won?: boolean
          name?: string
          pipeline_id?: string
          probability?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      ref_cc_services: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ref_collaboration_types: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ref_competence_centers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ref_consultant_roles: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ref_contact_roles: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ref_distribution_types: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ref_hobbies: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ref_hosting_environments: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ref_hosting_providers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ref_internal_people: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ref_language_levels: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ref_languages: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ref_lead_sources: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ref_sla_tools: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ref_stop_reasons: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ref_teams: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ref_technologies: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      sla_rates: {
        Row: {
          account_id: string
          created_at: string
          fixed_monthly_rate: number
          id: string
          support_hourly_rate: number
          updated_at: string
          year: number
        }
        Insert: {
          account_id: string
          created_at?: string
          fixed_monthly_rate?: number
          id?: string
          support_hourly_rate?: number
          updated_at?: string
          year: number
        }
        Update: {
          account_id?: string
          created_at?: string
          fixed_monthly_rate?: number
          id?: string
          support_hourly_rate?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "sla_rates_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_tools: {
        Row: {
          created_at: string
          id: string
          monthly_price: number
          sla_rate_id: string
          tool_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_price?: number
          sla_rate_id: string
          tool_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_price?: number
          sla_rate_id?: string
          tool_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sla_tools_sla_rate_id_fkey"
            columns: ["sla_rate_id"]
            isOneToOne: false
            referencedRelation: "sla_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          account_id: string | null
          assigned_to: string | null
          created_at: string
          deal_id: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          assigned_to?: string | null
          created_at?: string
          deal_id?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          assigned_to?: string | null
          created_at?: string
          deal_id?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string
          created_at: string
          full_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string
          created_at?: string
          full_name?: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_indexation: {
        Args: { p_approved_by: string; p_draft_id: string }
        Returns: undefined
      }
      get_account_banner_stats: {
        Args: { p_account_id: string }
        Returns: {
          activity_count: number
          consultant_count: number
          contact_count: number
          deal_count: number
          monthly_revenue: number
          pipeline_value: number
        }[]
      }
      get_consultant_stats: {
        Args: never
        Returns: {
          active_count: number
          bench_count: number
          max_revenue: number
          stopped_count: number
        }[]
      }
      get_distinct_account_countries: {
        Args: never
        Returns: {
          country: string
        }[]
      }
      get_open_deal_value: { Args: never; Returns: number }
      get_user_role: { Args: never; Returns: string }
      link_consultant_to_account: {
        Args: {
          p_account_id: string
          p_consultant_id: string
          p_end_date?: string
          p_hourly_rate?: number
          p_is_indefinite?: boolean
          p_notes?: string
          p_notice_period_days?: number
          p_role?: string
          p_sow_url?: string
          p_start_date?: string
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sync_account_fk_relation: {
        Args: { p_account_id: string; p_rows: Json; p_table: string }
        Returns: undefined
      }
      upsert_hourly_rates: {
        Args: { p_account_id: string; p_rates: Json; p_year: number }
        Returns: undefined
      }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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

