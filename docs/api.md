# API Documentation: FitFork Metabolic API 🚀

The FitFork API is a high-performance, asynchronous REST interface designed for metabolic data processing and culinary orchestration.

## 🔐 Authentication

FitFork implements **OAuth 2.0 with JWT (JSON Web Tokens)**.

### Global Security Behavior

- **Stateless Verification**: Every request is verified against a public secret.
- **Auto-Revocation**: The system implements a frontend interceptor that automatically purges local state upon receiving a `401 Unauthorized` response, ensuring no "zombie sessions" exist after token expiration.

## 🥗 Core Endpoints

### 1. Metabolic Profiling

`POST /user/nutrition`
Input a full biometric profile to calculate and persist metabolic targets.

- **Request Body**:
  ```json
  {
    "weight_kg": 85.5,
    "height_cm": 182,
    "age": 28,
    "gender": "male",
    "activity_level": "moderate",
    "goal": "lose_weight"
  }
  ```
- **Response**: Returns calculated BMR, TDEE, and suggested macronutrient splits.

### 2. RAG Recipe Search

`POST /search`
Semantic retrieval across the recipe corpus, conditioned by biometric state.

- **Filtering**: Automatically excludes recipes exceeding per-meal caloric envelopes derived from the user's TDEE.

### 3. Google Calendar Orchestration

FitFork provides an automated sync layer for meal plans.

- **OAuth Flow**: `GET /auth/google` returns a sanitized authorization URL.
- **Sync Logic**: `POST /calendar/sync` pushes structured events to `primary` calendar with metadata including caloric density and macronutrient breakdown.

## 🧪 System Health

`GET /health`
Returns system status including MongoDB connection health and LLM provider latency.
