# PHPro CRM — Executive Architecture

## 1. System Context (C4 Level 1)

```mermaid
graph TB
    subgraph Users["Users"]
        Admin["Admin<br/>Full platform access"]
        Sales["Sales Manager<br/>Accounts, Deals, Pipeline"]
        SalesRep["Sales Rep<br/>Own accounts and deals"]
        CS["Customer Success<br/>Activities and follow-up"]
        MKT["Marketing<br/>Dashboard and reports"]
    end

    CRM["PHPro CRM<br/>──────────────────<br/>Custom CRM Platform<br/>22 modules · 5 roles · real-time<br/>Dual-brand theming"]

    subgraph External["External Services"]
        Email["Email Service<br/>Notifications and alerts"]
        FileStore["Document Storage<br/>CVs, contracts, PDFs"]
        LiveUpdates["Live Updates<br/>Real-time data sync"]
    end

    Admin --> CRM
    Sales --> CRM
    SalesRep --> CRM
    CS --> CRM
    MKT --> CRM

    CRM --> Email
    CRM --> FileStore
    CRM --> LiveUpdates

    style CRM fill:#bdd431,stroke:#333,stroke-width:3px,color:#000
    style Users fill:#f9f9f9,stroke:#999
    style External fill:#f0f4ff,stroke:#99b
```

## 2. Platform Architecture (AKF 4-Layer)

```mermaid
block-beta
    columns 1

    block:layer1["USERS"]
        columns 5
        A["Admins"] B["Sales Managers"] C["Sales Reps"] D["Customer Success"] E["Marketing"]
    end

    space

    block:layer2["WEB APPLICATION"]
        columns 3
        F["Browser App<br/>Responsive · Fast · Branded"]
        G["Server Rendering<br/>Instant page loads"]
        H["Role-Based Access<br/>5 permission levels"]
    end

    space

    block:layer3["BUSINESS MODULES"]
        columns 4
        I["Account Management<br/>Clients · Prospects · Partners"]
        J["Sales Pipeline<br/>Deals · Forecasting · Revenue"]
        K["Consultancy<br/>Bench · Placements · Contracts"]
        L["HR and People<br/>Employees · Equipment · Leave"]
    end

    space

    block:layer4["DATA AND INFRASTRUCTURE"]
        columns 4
        M["Customer Database<br/>Secured per role"]
        N["Login and Access Control<br/>Session management"]
        O["File and Document Storage<br/>CVs · Contracts · PDFs"]
        P["Live Notifications<br/>Real-time updates"]
    end

    layer1 --> layer2
    layer2 --> layer3
    layer3 --> layer4

    style layer1 fill:#e8f5e9,stroke:#4caf50
    style layer2 fill:#e3f2fd,stroke:#2196f3
    style layer3 fill:#fff3e0,stroke:#ff9800
    style layer4 fill:#fce4ec,stroke:#e91e64
```

## 3. Feature Scope Overview

```mermaid
mindmap
    root((PHPro CRM))
        CRM
            Account Management
                Clients · Prospects · Partners
                Health scoring
                Hosting and tech stack tracking
            Contact Management
                Personal profiles
                Role tagging
                Event and gift preferences
            Communications
                Email · Call · Meeting · Notes
                Activity logging
        Sales
            Deal Pipeline
                3 pipeline types
                Stage management
                Win/loss tracking
            Forecasting
                Revenue projections
                Pipeline analysis
            Indexation
                Rate adjustments
                Draft and approval workflow
        Consultancy
            Bench Management
                Available consultants
                Skills and languages
                Rate ranges
            Active Placements
                Client assignments
                Rate history
                Contract extensions
            Contracts
                Framework agreements
                SLA and hourly rates
        HR
            Employee Records
                Personal details
                Salary history
                Evaluations
            Equipment Tracking
                Asset assignment
                Serial numbers
            Leave Management
                Annual balances
                Allowance tracking
        Platform
            5 User Roles
                Admin · Sales Manager
                Sales Rep · Customer Success
                Marketing
            Dual Brand Theming
                PHPro green
                25Carat gold
            Real-time Updates
                Live data sync
                Instant notifications
            Document Storage
                CV uploads
                Contract PDFs
            Audit Trail
                Full change history
                User activity logs
```

## 4. Value Proposition (Technical Differentiators in Business Language)

```mermaid
graph LR
    subgraph Speed["Fast to Ship"]
        S1["Modular architecture<br/>22 independent feature modules"]
        S2["Code generation<br/>AI-assisted development"]
        S3["Pre-built components<br/>Tables · Forms · Modals · Filters"]
    end

    subgraph Quality["Enterprise Quality"]
        Q1["Server-first rendering<br/>Instant page loads"]
        Q2["Role-based security<br/>Data protected per user"]
        Q3["Database-level policies<br/>Security at every layer"]
    end

    subgraph Flexible["Fully Customizable"]
        F1["Multi-brand theming<br/>Your colors · Your identity"]
        F2["Self-hosted option<br/>Your servers · Your data"]
        F3["Open standards<br/>No vendor lock-in"]
    end

    style Speed fill:#e8f5e9,stroke:#4caf50
    style Quality fill:#e3f2fd,stroke:#2196f3
    style Flexible fill:#fff3e0,stroke:#ff9800
```
