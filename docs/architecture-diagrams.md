# PHPro CRM — Architecture Diagrams

## 1. System Architecture

```mermaid
graph TB
    subgraph Client["Browser"]
        NextApp["Next.js App<br/>(React 19)"]
        RT["Realtime<br/>WebSocket"]
    end

    subgraph NextServer["Next.js Server"]
        SSR["Server Components<br/>(React.cache queries)"]
        SA["Server Actions<br/>(Zod + ActionResult)"]
        MW["Middleware<br/>(Auth + ACL)"]
    end

    subgraph Supabase["Supabase Stack (Docker)"]
        Kong["Kong API Gateway<br/>:8000"]
        Auth["GoTrue Auth<br/>JWT + Cookies"]
        PostgREST["PostgREST<br/>REST API"]
        Realtime["Realtime Server<br/>WebSocket"]
        Storage["Storage API<br/>+ imgproxy"]
        PG["PostgreSQL 15<br/>RLS Enabled"]
    end

    NextApp -->|HTTP| NextServer
    NextApp -->|WebSocket| Kong
    SSR -->|Supabase SSR client| Kong
    SA -->|Supabase SSR client| Kong
    MW -->|Session check| Kong
    RT -.->|Subscribe| Kong

    Kong --> Auth
    Kong --> PostgREST
    Kong --> Realtime
    Kong --> Storage
    PostgREST --> PG
    Realtime --> PG
    Auth --> PG
    Storage --> PG
```

## 2. Entity Relationship Diagram

### 2a. Core CRM

```mermaid
erDiagram
    user_profiles {
        uuid id PK
        text full_name
        text role "admin/editor/viewer"
    }

    accounts {
        uuid id PK
        text name
        text type "Klant/Prospect/Partner"
        text status "Actief/Inactief"
        text industry
        text domain
        uuid owner_id FK
        int health "0-100"
    }

    contacts {
        uuid id PK
        uuid account_id FK
        text first_name
        text last_name
        text email
        text role "Decision Maker/Influencer/..."
        bool is_steerco
    }

    contact_personal_info {
        uuid id PK
        uuid contact_id FK "UNIQUE"
        text hobbies
        text marital_status
        bool has_children
        date birthday
    }

    activities {
        uuid id PK
        text type "Meeting/Demo/Call/Email/Lunch"
        text subject
        date date
        uuid account_id FK
        uuid deal_id FK
        uuid owner_id FK
        bool is_done
    }

    tasks {
        uuid id PK
        text title
        date due_date
        text priority "High/Medium/Low"
        text status "Open/In Progress/Done"
        uuid account_id FK
        uuid deal_id FK
        uuid assigned_to FK
    }

    communications {
        uuid id PK
        text type "email/note/meeting/call"
        text subject
        uuid account_id FK
        uuid contact_id FK
        uuid deal_id FK
    }

    user_profiles ||--o{ accounts : "owns"
    accounts ||--o{ contacts : "has"
    contacts ||--o| contact_personal_info : "has"
    accounts ||--o{ activities : "logged on"
    accounts ||--o{ tasks : "assigned to"
    accounts ||--o{ communications : "sent to"
    contacts ||--o{ communications : "involves"
    user_profiles ||--o{ tasks : "assigned to"
    user_profiles ||--o{ activities : "owns"
```

### 2b. Sales Pipeline & Deals

```mermaid
erDiagram
    pipelines {
        uuid id PK
        text name
        text type "projecten/rfp/consultancy"
        int sort_order
    }

    pipeline_stages {
        uuid id PK
        uuid pipeline_id FK
        text name
        int probability "0-100"
        text color
        bool is_closed
        bool is_won
    }

    deals {
        uuid id PK
        text title
        uuid account_id FK
        uuid pipeline_id FK
        uuid stage_id FK
        numeric amount
        date close_date
        int probability
        uuid owner_id FK
        uuid contact_id FK
        text forecast_category
        text closed_type "won/lost/longterm"
    }

    accounts ||--o{ deals : "has"
    pipelines ||--o{ pipeline_stages : "contains"
    pipeline_stages ||--o{ deals : "current stage"
    pipelines ||--o{ deals : "belongs to"
    contacts ||--o{ deals : "primary contact"
    user_profiles ||--o{ deals : "owns"
```

### 2c. Consultants & Bench

```mermaid
erDiagram
    bench_consultants {
        uuid id PK
        text first_name
        text last_name
        text city
        text priority "High/Medium/Low"
        date available_date
        numeric min_hourly_rate
        numeric max_hourly_rate
        text roles "array"
        text technologies "array"
        bool is_archived
    }

    bench_consultant_languages {
        uuid id PK
        uuid bench_consultant_id FK
        text language
        text level "Basis/Gevorderd/Vloeiend/Moedertaal"
    }

    active_consultants {
        uuid id PK
        uuid account_id FK
        text first_name
        text last_name
        text role
        date start_date
        date end_date
        numeric hourly_rate
        bool is_stopped
    }

    consultant_rate_history {
        uuid id PK
        uuid active_consultant_id FK
        date date
        numeric rate
        text reason
    }

    consultant_extensions {
        uuid id PK
        uuid active_consultant_id FK
        date new_end_date
    }

    consultant_contract_attributions {
        uuid id PK
        uuid active_consultant_id FK "UNIQUE"
        text type "rechtstreeks/cronos"
    }

    bench_consultants ||--o{ bench_consultant_languages : "speaks"
    bench_consultants ||--o{ deals : "linked to"
    accounts ||--o{ active_consultants : "placed at"
    active_consultants ||--o{ consultant_rate_history : "rate changes"
    active_consultants ||--o{ consultant_extensions : "extended"
    active_consultants ||--o| consultant_contract_attributions : "attribution"
```

### 2d. Contracts & Finance

```mermaid
erDiagram
    contracts {
        uuid id PK
        uuid account_id FK "UNIQUE"
        bool has_framework_contract
        date framework_start
        date framework_end
        bool has_service_contract
        date service_start
        date service_end
    }

    hourly_rates {
        uuid id PK
        uuid account_id FK
        int year
        text role
        numeric rate
    }

    sla_rates {
        uuid id PK
        uuid account_id FK
        int year
        numeric fixed_monthly_rate
        numeric support_hourly_rate
    }

    sla_tools {
        uuid id PK
        uuid sla_rate_id FK
        text tool_name
        numeric monthly_price
    }

    revenue_clients {
        uuid id PK
        text name
        uuid account_id FK
    }

    revenue_entries {
        uuid id PK
        uuid revenue_client_id FK
        uuid division_id FK
        int year
        int month
        numeric amount
    }

    divisions {
        uuid id PK
        text name
        text color
    }

    division_services {
        uuid id PK
        uuid division_id FK
        text service_name
    }

    accounts ||--o| contracts : "has"
    accounts ||--o{ hourly_rates : "negotiated"
    accounts ||--o{ sla_rates : "SLA"
    sla_rates ||--o{ sla_tools : "includes"
    accounts ||--o{ revenue_clients : "linked"
    revenue_clients ||--o{ revenue_entries : "monthly"
    divisions ||--o{ division_services : "offers"
    divisions ||--o{ revenue_entries : "tracked by"
```

### 2e. HR & Employees

```mermaid
erDiagram
    employees {
        uuid id PK
        text first_name
        text last_name
        date hire_date
        text job_title
        text department
        text status "actief/inactief"
        numeric gross_salary
    }

    employee_children {
        uuid id PK
        uuid employee_id FK
        text name
        int birth_year
    }

    salary_history {
        uuid id PK
        uuid employee_id FK
        date date
        numeric gross_salary
        text reason
    }

    equipment {
        uuid id PK
        uuid employee_id FK
        text type
        text name
        text serial_number
        date date_issued
    }

    evaluations {
        uuid id PK
        uuid employee_id FK
        date date
        text type
        int score
    }

    leave_balances {
        uuid id PK
        uuid employee_id FK
        int year
        int allowance
        int taken
    }

    hr_documents {
        uuid id PK
        uuid employee_id FK
        text type
        text name
        text url
    }

    employees ||--o{ employee_children : "has"
    employees ||--o{ salary_history : "raises"
    employees ||--o{ equipment : "assigned"
    employees ||--o{ evaluations : "reviewed"
    employees ||--o{ leave_balances : "yearly"
    employees ||--o{ hr_documents : "files"
```

### 2f. Indexation (Rate Adjustment)

```mermaid
erDiagram
    indexation_indices {
        uuid id PK
        text name "UNIQUE"
        numeric value
    }

    indexation_config {
        uuid id PK
        uuid account_id FK "UNIQUE"
        text indexation_type
        int start_month
        int start_year
    }

    indexation_drafts {
        uuid id PK
        uuid account_id FK
        int target_year
        numeric percentage
        text status "draft/approved/rejected"
    }

    indexation_draft_rates {
        uuid id PK
        uuid draft_id FK
        text role
        numeric current_rate
        numeric proposed_rate
    }

    indexation_history {
        uuid id PK
        uuid account_id FK
        int target_year
        numeric percentage
    }

    accounts ||--o| indexation_config : "configured"
    accounts ||--o{ indexation_drafts : "proposed"
    indexation_drafts ||--o{ indexation_draft_rates : "line items"
    accounts ||--o{ indexation_history : "applied"
```

## 3. Deployment Architecture

```mermaid
graph TB
    subgraph Dev["Development"]
        DevMachine["Developer Machine"]
        Turbopack["Next.js Dev Server<br/>Turbopack :3000"]
        DockerLocal["Docker Compose"]
    end

    subgraph DockerStack["Supabase Docker Stack"]
        direction TB
        KongGW["Kong Gateway :8000"]
        PGDb["PostgreSQL 15 :5432"]
        GoTrue["GoTrue Auth :9999"]
        PGRST["PostgREST :3000"]
        RTServ["Realtime :4000"]
        StorageAPI["Storage API :5000"]
        ImgProxy["imgproxy :8080"]
        Studio["Supabase Studio :3001"]
        PGMeta["Postgres Meta :8080"]
    end

    subgraph Production["Production"]
        NextProd["Next.js Standalone<br/>(Docker)"]
        SupaProd["Supabase<br/>(Self-hosted Docker<br/>or Supabase Cloud)"]
    end

    DevMachine --> Turbopack
    DevMachine --> DockerLocal
    DockerLocal --> DockerStack
    Turbopack -->|API calls| KongGW

    KongGW --> GoTrue
    KongGW --> PGRST
    KongGW --> RTServ
    KongGW --> StorageAPI
    GoTrue --> PGDb
    PGRST --> PGDb
    RTServ --> PGDb
    StorageAPI --> PGDb
    StorageAPI --> ImgProxy
    Studio --> PGMeta
    PGMeta --> PGDb

    NextProd -->|HTTPS| SupaProd
```

## 4. Feature Module Map

```mermaid
graph TB
    subgraph CRM["CRM"]
        Accounts["Accounts<br/>Klant/Prospect/Partner"]
        Contacts["Contacts<br/>+ Personal Info"]
        Deals["Deals<br/>Pipeline Management"]
        Activities["Activities<br/>Meetings/Calls/Demos"]
        Tasks["Tasks<br/>Assignments"]
        Comms["Communications<br/>Emails/Notes"]
    end

    subgraph Consultancy["Consultancy"]
        Bench["Bench<br/>Available Consultants"]
        Active["Active Consultants<br/>Placements"]
        Contracts["Contracts<br/>Framework + SLA"]
    end

    subgraph Finance["Finance & Analysis"]
        Revenue["Revenue<br/>Monthly Tracking"]
        Pipeline["Pipeline<br/>Deal Forecasting"]
        Prognose["Prognose<br/>Projections"]
        Indexation["Indexation<br/>Rate Adjustments"]
    end

    subgraph HR["HR / People"]
        Employees["Employees<br/>Staff Records"]
        Equipment["Equipment<br/>Assets"]
    end

    subgraph System["System"]
        Auth["Auth<br/>Login/Register/Roles"]
        Users["Users<br/>Team Management"]
        Audit["Audit Logs<br/>Change Tracking"]
        Notifications["Notifications<br/>Alerts"]
        Files["Files<br/>Document Storage"]
        RefData["Reference Data<br/>15 Lookup Tables"]
        Dashboard["Dashboard<br/>Analytics"]
    end

    Accounts --- Contacts
    Accounts --- Deals
    Accounts --- Activities
    Accounts --- Tasks
    Accounts --- Active
    Accounts --- Contracts
    Accounts --- Revenue
    Deals --- Pipeline
    Deals --- Bench
    Contacts --- Comms
    Accounts --- Indexation
    Employees --- Equipment
```

## 5. Data Flow Diagram

```mermaid
sequenceDiagram
    participant Browser
    participant NextServer as Next.js Server
    participant Middleware as Middleware (ACL)
    participant ServerComp as Server Component
    participant Cache as React.cache()
    participant Supabase as Supabase (PostgREST)
    participant PG as PostgreSQL + RLS

    Browser->>NextServer: GET /admin/accounts
    NextServer->>Middleware: Check auth + role
    Middleware->>Supabase: Verify session cookie
    Supabase-->>Middleware: Valid session + JWT
    Middleware->>ServerComp: Authorized ✓

    Note over ServerComp: Server-side rendering
    ServerComp->>Cache: getAccounts()
    Cache->>Supabase: SELECT with filters
    Supabase->>PG: Query + RLS policies
    PG-->>Supabase: Filtered rows
    Supabase-->>Cache: { data, count }
    Cache-->>ServerComp: Cached result

    ServerComp-->>Browser: HTML with initialData props

    Note over Browser: Client interaction (page change)
    Browser->>Supabase: fetchList({ page: 2, eqFilters })
    Supabase->>PG: Query + RLS
    PG-->>Supabase: Page 2 rows
    Supabase-->>Browser: JSON response

    Note over Browser: Mutation (create/update)
    Browser->>NextServer: Server Action: createAccount()
    NextServer->>NextServer: Zod validation
    NextServer->>Supabase: INSERT + select
    Supabase->>PG: INSERT + RLS check
    PG-->>Supabase: Created row
    Supabase-->>NextServer: { data }
    NextServer->>NextServer: revalidatePath()
    NextServer-->>Browser: ActionResult ok({ id })
```

## 6. Security & Auth Flow

```mermaid
graph TB
    subgraph AuthFlow["Authentication"]
        Login["Login Page"]
        GoTrue["GoTrue (Supabase Auth)"]
        JWT["JWT Token<br/>in HTTP-only Cookie"]
        Session["Session Management<br/>@supabase/ssr"]
    end

    subgraph ACL["Authorization (ACL)"]
        MW["Middleware<br/>(proxy.ts)"]
        Roles["5 Roles"]
        Perms["Permission Matrix"]
    end

    subgraph RolesDef["Role Definitions"]
        Admin["admin<br/>All permissions"]
        SalesMgr["sales_manager<br/>CRM write, finance write"]
        SalesRep["sales_rep<br/>CRM read/write (own)"]
        CustSuccess["customer_success<br/>Accounts read, activities write"]
        Marketing["marketing<br/>Dashboard + read only"]
    end

    subgraph DataSec["Data Security"]
        RLS["Row Level Security<br/>(every table)"]
        Grants["Table GRANT statements<br/>(authenticated role)"]
        AdminClient["Admin Client<br/>(bypasses RLS for audit)"]
        ServerClient["Server Client<br/>(respects RLS)"]
        BrowserClient["Browser Client<br/>(respects RLS)"]
    end

    Login -->|Email + Password| GoTrue
    GoTrue -->|Set cookie| JWT
    JWT -->|Every request| Session
    Session -->|Verify| MW

    MW -->|Check role| Roles
    Roles --> Perms
    Perms -->|Allow/Deny| RolesDef

    ServerClient -->|JWT in cookie| RLS
    BrowserClient -->|JWT in cookie| RLS
    AdminClient -->|Service role key| Grants
    RLS --> Grants
```
