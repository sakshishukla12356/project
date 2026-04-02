# Multi-Cloud Dashboard — Backend API

A production-ready FastAPI backend for tracking cost, resource usage, and **carbon emissions** across AWS, Azure, and GCP.

---

## Architecture

```
multi-cloud-dashboard/
├── main.py                        # FastAPI app entry point
├── config/
│   └── settings.py                # Pydantic-settings (env vars)
├── database/
│   └── base.py                    # Async SQLAlchemy engine + session
├── models/
│   ├── user.py                    # User table
│   ├── cloud_account.py           # Cloud account metadata
│   └── usage_history.py           # Time-series usage snapshots
├── services/                      # Pure business logic (no FastAPI deps)
│   ├── aws_service.py             # boto3: EC2 + S3 + Cost Explorer
│   ├── azure_service.py           # Azure SDK: VMs + Storage + Cost Mgmt
│   ├── gcp_service.py             # GCP SDK: Compute + GCS + Billing
│   ├── carbon_service.py          # Carbon formula engine (CORE FEATURE)
│   └── auth_service.py            # JWT helpers
├── controllers/                   # Orchestration layer
│   ├── auth_controller.py
│   ├── aws_controller.py
│   ├── azure_controller.py
│   ├── gcp_controller.py
│   ├── carbon_controller.py
│   └── dashboard_controller.py
├── routers/                       # FastAPI route definitions
│   ├── auth.py
│   ├── aws.py
│   ├── azure.py
│   ├── gcp.py
│   ├── carbon.py
│   └── dashboard.py
└── middleware/
    └── auth.py                    # JWT dependency injection
```

---

## Carbon Emission System

### Formula
```
Carbon (kgCO₂) = Energy (kWh) × Region Emission Factor (kgCO₂/kWh)
```

### Energy Estimation

| Resource type | Method |
|---|---|
| EC2 / Azure VM / GCE | Per-instance-type kWh/hour lookup table (100+ entries), with tiered fallback by size |
| S3 / Azure Blob / GCS | `0.00000024 kWh × GB × hours` (industry avg for cloud object storage) |

### Region Emission Factors
- **AWS**: 30 regions — from `0.008` (Stockholm) to `0.928` (Cape Town)
- **Azure**: 35 regions
- **GCP**: 35+ regions
- All sourced from official 2024 cloud sustainability documentation

### Carbon Saved Logic
```
GET /carbon/saved
```
- Compares **previous 24-hour window** vs **current 24-hour window** from DB snapshots
- **Stopped service**: previous carbon = 100% saved
- **Reduced usage**: delta (previous_carbon − current_carbon) = saved
- **No reduction**: 0 saved

---

## Quick Start

### 1. Install dependencies
```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your cloud credentials
```

### 3. Run
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. API Docs
- Swagger UI: http://localhost:8000/docs
- ReDoc:       http://localhost:8000/redoc

---

## API Endpoints

### Authentication
| Method | Path | Description |
|---|---|---|
| POST | `/auth/signup` | Register new user, returns JWT |
| POST | `/auth/login` | Login (OAuth2 form), returns JWT |

All routes below require `Authorization: Bearer <token>`.

### Cloud Providers
| Method | Path | Description |
|---|---|---|
| GET | `/aws/costs` | Cost Explorer breakdown (last 30 days) |
| GET | `/aws/resources` | EC2 instances + S3 buckets with carbon |
| GET | `/azure/costs` | Azure Cost Management breakdown |
| GET | `/azure/resources` | VMs + Storage Accounts with carbon |
| GET | `/gcp/costs` | GCP billing data |
| GET | `/gcp/resources` | Compute instances + GCS buckets with carbon |

### Carbon
| Method | Path | Description |
|---|---|---|
| GET | `/carbon` | Total carbon across all providers |
| GET | `/carbon/saved` | Carbon saved vs. previous window |
| GET | `/carbon/emission-factors` | Region → kgCO₂/kWh lookup tables |

### Dashboard
| Method | Path | Description |
|---|---|---|
| GET | `/dashboard` | All providers combined — the main payload |

---

## Dashboard Response Shape

```json
{
  "fetched_at": "2024-01-15T10:30:00Z",
  "total_cost": 1284.50,
  "total_carbon": 47.83,
  "total_energy_kwh": 187.4,
  "carbon_saved": 3.21,
  "providers": {
    "aws":   { "total_cost_usd": 900.00, "total_carbon_kg": 32.1, ... },
    "azure": { "total_cost_usd": 250.00, "total_carbon_kg": 10.5, ... },
    "gcp":   { "total_cost_usd": 134.50, "total_carbon_kg": 5.23, ... }
  },
  "carbon_by_provider": { "aws": 32.1, "azure": 10.5, "gcp": 5.23 },
  "carbon_by_region": { "us-east-1": 18.4, "eu-west-1": 6.2, ... },
  "carbon_saved_details": [
    {
      "resource_id": "i-0abc123",
      "provider": "aws",
      "saved_kg": 1.84,
      "reason": "service_stopped"
    }
  ],
  "services": [
    {
      "provider": "aws",
      "service_type": "compute",
      "resource_id": "i-0abc123",
      "resource_name": "web-server-prod",
      "region": "us-east-1",
      "status": "running",
      "usage_hours": 720.0,
      "energy_kwh": 201.6,
      "carbon_kg": 77.8,
      "emission_factor": 0.386,
      "cost_usd": 0.0
    }
  ]
}
```

---

## Cloud Credential Setup

### AWS
```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1
```
Required IAM permissions: `ce:GetCostAndUsage`, `ec2:DescribeInstances`, `s3:ListAllMyBuckets`, `cloudwatch:GetMetricStatistics`

### Azure
```bash
AZURE_TENANT_ID=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
AZURE_SUBSCRIPTION_ID=...
```
Required role: `Cost Management Reader` + `Reader` on the subscription.

### GCP
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCP_PROJECT_ID=my-project
GCP_BILLING_ACCOUNT_ID=XXXXXX-XXXXXX-XXXXXX   # optional for billing
```
Required roles: `compute.viewer`, `storage.objectViewer`, `billing.viewer`

---

## Database

SQLite (default, zero-config) or any SQLAlchemy-compatible async DB.

To use PostgreSQL:
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/multicloud
pip install asyncpg
```

Tables created automatically on startup:
- `users` — registered users
- `cloud_accounts` — linked cloud account metadata
- `usage_history` — time-series snapshots for carbon comparison

---

## Production Checklist

- [ ] Set `SECRET_KEY` to a long random string
- [ ] Set `APP_ENV=production`
- [ ] Use PostgreSQL instead of SQLite
- [ ] Store cloud credentials in a secrets manager (AWS Secrets Manager / Azure Key Vault / GCP Secret Manager)
- [ ] Add rate limiting (e.g. `slowapi`)
- [ ] Enable HTTPS / TLS termination
- [ ] Set CORS `allow_origins` to your frontend domain
- [ ] Add a scheduler (APScheduler / Celery) to run snapshots every hour
