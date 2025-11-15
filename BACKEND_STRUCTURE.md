# Backend Structure Documentation

## Project Overview

The backend is a Node.js application built with Express and MongoDB, designed for audit management with metrics tracking. It handles three main types of audits: etiqueta (labeling), presenca (presence), and ruptura (out-of-stock).

## Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js 5.1.0
- **Database:** MongoDB with Mongoose ODM
- **File Upload:** Multer
- **Environment Variables:** dotenv
- **File Processing:** XLSX for Excel files
- **Frontend Integration:** Express static serving for frontend files

## Core Models

### 1. User Model (`models/User.js`)
- Stores user information and audit history
- Contains `auditorias` array with audit details
- Links to a specific `loja` (store) via ObjectId reference
- Includes counters and timestamps

### 2. Loja Model (`models/Loja.js`)
- Stores store information
- Contains code, name, address, and metadata
- Has an `ativa` field to determine if store is active
- Links to users via ObjectId reference

### 3. Auditoria Model (`models/Auditoria.js`)
- Core audit record model
- Supports three audit types: `etiqueta`, `presenca`, `ruptura`
- Contains audit data like product info, location, status, etc.
- Links to both user and store
- Has various type-specific fields

### 4. UserDailyMetrics Model (`models/UserDailyMetrics.js`)
- Stores daily metrics for each user
- Contains detailed metrics broken down by audit type (etiquetas, rupturas, presencas)
- Tracks various counters for classes and locations
- Contains consolidated totals and scoring system

### 5. LojaDailyMetrics Model (`models/LojaDailyMetrics.js`)
- Stores daily metrics for each store
- Similar structure to UserDailyMetrics but at store level
- Includes ranking systems and alert detection

### 6. Other Metric Models
- `MetricasUsuario.js`: User metrics by period
- `MetricasLoja.js`: Store metrics by period
- `MetricasAuditoria.js`: Audit type metrics by period
- `MetricasGlobais.js`: Global metrics across the entire system

## Data Flow & Storage

### Audit Data Processing
1. **Data Upload:** Excel files are uploaded via `/upload` endpoint
2. **Data Parsing:** Files are parsed and records are created in `Auditoria` collection
3. **Real-time Updates:** When audits are performed (status updated), changes are reflected in `UserDailyMetrics`
4. **Periodic Calculations:** Metrics are recalculated periodically for different time periods (daily, weekly, monthly)

### Metrics Calculation
- **Real-time:** UserDailyMetrics are updated in real-time as users perform audits
- **Periodic:** Historical metrics (daily, weekly, monthly) are calculated by the `metricsCalculationService`
- **Global:** Overall system metrics are calculated and stored in `MetricasGlobais`

### Calculation Service (`services/metricsCalculationService.js`)
- Main service for calculating all metrics
- Handles four levels of metrics:
  1. User-level metrics (`UserDailyMetrics` and `MetricasUsuario`)
  2. Store-level metrics (`LojaDailyMetrics` and `MetricasLoja`)
  3. Audit-type metrics (`MetricasAuditoria`)
  4. Global metrics (`MetricasGlobais`)

## Key Features

### 1. Audit Type Support
- **Etiqueta (Labeling):** Product labeling verification
- **Presença (Presence):** Product presence verification
- **Ruptura (Out-of-Stock):** Out-of-stock tracking with cost calculations

### 2. Store Management
- Uses `x-loja` header to identify the active store
- Middleware validates store codes against a predefined list
- Store codes are: 056, 084, 105, 111, 140, 214, 176, 194, 310, 320

### 3. Metrics & Analytics
- Real-time metrics updates
- Historical tracking by period (daily, weekly, monthly)
- User and store rankings
- Performance scoring and trend analysis
- Cost tracking for out-of-stock situations

### 4. Data Management
- Excel file uploads for audit data
- Bulk data processing
- Duplicate prevention mechanisms
- Data validation and consistency checks

## API Endpoints Structure

### Routes
- `/` (root): Loja, upload, setores, estatisticas, ranking
- `/relatorios`: Reporting endpoints
- `/api/avancado`: Advanced reporting
- `/api/metricas`: Metrics endpoints (users, loja, auditorias, dashboard)
- `/api/debug`: Debugging endpoints
- `/api/endpoints`: Endpoint listing
- Other specific feature routes (sugestoes, avisos, votacoes, articles)

### Key Metrics Endpoints
- `GET /api/metricas/usuarios/:usuarioId` - User metrics
- `GET /api/metricas/usuarios/ranking` - User ranking
- `GET /api/metricas/loja` - Store metrics
- `GET /api/metricas/lojas/ranking` - Store ranking
- `GET /api/metricas/dashboard` - Executive dashboard
- `POST /api/metricas/recalcular` - Manual metric recalculation

## Database Schema Relationships

```
Loja (1) ←→ (Many) User
User (1) ←→ (Many) Auditoria
Loja (1) ←→ (Many) Auditoria
User (1) ←→ (Many) UserDailyMetrics
Loja (1) ←→ (Many) LojaDailyMetrics
Auditoria → MetricasUsuario, MetricasLoja, MetricasAuditoria, MetricasGlobais
```

## Middleware

### Store Verification (`middleware/loja.js`)
- All routes that require store context use store verification
- Validates `x-loja` header against predefined store list
- Attaches store information to request object
- Two modes: required (all metric-related endpoints) and optional

## Special Considerations

1. **Unique Constraints:**
   - `UserDailyMetrics` has a unique index on `{ loja: 1, usuarioId: 1 }`
   - `LojaDailyMetrics` has a unique index on `{ loja: 1 }`
   - This ensures only one metrics record per user/store combination

2. **Data Consistency:**
   - Real-time updates to daily metrics
   - Periodic recalculation for historical periods
   - Prevention of duplicate metric calculations

3. **Performance Optimization:**
   - Heavy use of MongoDB indexes
   - Aggregation pipelines for complex queries
   - Efficient data retrieval patterns

4. **Scoring System:**
   - Different weights for different audit types
   - Bonus points for consistency across audit types
   - Ranking systems at both user and store levels