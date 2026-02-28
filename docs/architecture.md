# Architecture Overview: FitFork 🥗

FitFork is built with a modern, decoupled architecture focusing on metabolic precision and high-performance recipe retrieval.

## System Components

### 1. Frontend (The Culinary Interface)

- **Framework**: React 18 with Vite.
- **Styling**: Tailwind CSS with a custom "Deep Olive & Cream" botanical design system.
- **UI Components**: Shadcn UI for accessible, premium components.
- **State Management**: React Context (AuthContext) for user sessions.
- **Animations**: Framer Motion for smooth transitions and interactive micro-animations.

### 2. Backend (The Metabolic Engine)

- **Framework**: FastAPI (Asynchronous Python).
- **Authentication**: JWT-based OAuth2 with password hashing (bcrypt).
- **Nutritional Logic**: Implements the Mifflin-St Jeor equation to calculate BMR and TDEE based on user profile metrics (height, weight, age, activity).

### 3. Data Layer

- **NoSQL Database**: MongoDB for user profiles, meal plan persistence, and session data.
- **Vector Database**: ChromaDB for semantic search of the recipe corpus.

### 4. Integration & Security

#### Google Calendar Sync (OAuth 2.0)

The calendar integration uses a robust OAuth 2.0 flow. Due to the stateless nature of the FastAPI backend, we implemented a custom URL generation strategy that avoids the "Missing code verifier" (PKCE) mismatch typically found in server-side flows that lose state between redirects. Tokens are persisted in MongoDB and automatically refreshed.

#### Session Management

FitFork uses JWTs for session persistence. We implemented a **global Axios interceptor** in the frontend that detects `401 Unauthorized` responses. Upon expiration:

1. Local storage is cleared (tokens, profile, user data).
2. The user is redirected to the `/login` page with a state-aware alert.

## AI Implementation: RAG Pipeline

The core of FitFork is its **Retrieval-Augmented Generation (RAG)** pipeline, which ensures meal plans are grounded in actual high-quality recipes.

```mermaid
sequenceDiagram
    participant User
    participant API as FastAPI Backend
    participant DB as MongoDB (Users/Recipes)
    participant LLM as Google AI Studio (Gemini 2.5)

    User->>API: Generate Meal Plan Request
    API->>DB: Fetch User Profile & Chat History
    API->>API: Calculate Metabolic Requirements
    API->>API: Augment Query (Text Search)
    API->>DB: Text Search (Recipes)
    DB-->>API: Return Candidate Recipes
    API->>LLM: Structured JSON Generation (Gemini 2.5)
    LLM-->>API: JSON Meal Plan
    API->>User: Interactive Meal Plan UI
```

### LLM Gateway (Google AI Studio)

We utilize the **`google-genai`** SDK to interface directly with **`gemini-2.5-flash`**. This ensures the highest performance, lowest latency, and access to the latest frontier features while maintaining a robust Free Tier for development.
