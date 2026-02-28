# FitFork: AI-Powered Metabolic Culinary Intelligence 🥗

[![Project Status: Production](https://img.shields.io/badge/Status-Production-success.svg?style=flat-square)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Built with FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Built with React](https://img.shields.io/badge/Frontend-React-61DAFB.svg?style=flat-square&logo=react)](https://react.dev/)
[![AI Engine: Gemini 2.5](https://img.shields.io/badge/AI-Gemini_2.5_Flash-blue.svg?style=flat-square&logo=google-gemini)](https://aistudio.google.com/)

**FitFork** is a next-generation, RAG-powered culinary assistant designed to bridge the gap between metabolic requirements and professional recipe execution. It transforms complex user metrics into actionable, dietary-compliant meal plans using state-of-the-art vector retrieval and large language models.

---

## 📚 Documentation

For a deep dive into how FitFork works and how to set it up, please refer to our detailed guides:

- [🏗️ **Architecture & RAG Pipeline**](docs/architecture.md)
- [🚀 **Detailed API Reference**](docs/api.md)
- [⚙️ **Setup & Installation**](docs/setup.md)

---

---

## � The Vision: Metabolic Intelligence

Traditional meal planners rely on rigid templates. **FitFork** treats nutrition as a dynamic data problem. By analyzing height, weight, activity levels, and fitness goals (Mifflin-St Jeor accuracy), the system generates a unique caloric and macronutrient fingerprint for every user.

---

## 🎨 UI & Aesthetics: Deep Olive & Cream

FitFork features a **premium dark botanical aesthetic**. Designed for the modern kitchen, the high-contrast "Deep Olive & Cream" palette ensures readability in low-light environments while maintaining a grounded, sophisticated feel.

<p align="center">
  <img src="snapshots/snapshot_dashboard.png" width="45%" alt="Dashboard" />
  <img src="snapshots/snapshot_recipe.png" width="45%" alt="Recipe View" />
</p>
<p align="center">
  <img src="snapshots/snapshot_profile.png" width="45%" alt="Metabolic Profile" />
  <img src="snapshots/snapshot_planning.png" width="45%" alt="Meal Planning" />
</p>

---

---

## 🏗️ System Architecture

Our solution is built on a high-concurrency, biometric-aware architecture that unifies nutrition science with modern retrieval-augmented generation in a high-contrast **Nano Banana** aesthetic.

```mermaid
graph TD
    %% User Interaction
    U[User] -->|Biometrics / Preferences| F[React Frontend]
    F -->|Secure JWT Auth| B[FastAPI Backend]

    %% Metabolic Engine
    subgraph "Metabolic Engine (Nano Banana Core)"
        B -->|Mifflin-St Jeor| M[BMR/TDEE Processor]
        M -->|Caloric Envelope| P[Prompt Orchestrator]
    end

    %% Unified RAG Pipeline
    subgraph "Unified RAG Store"
        P -->|Semantic Query| DB[(MongoDB Vector Store)]
        DB -->|Biometric-Filtered Recipes| P
    end

    %% Intelligence Layer
    P -->|Seeded Context| AI[Gemini 2.0 Flash]
    AI -->|JSON Meal Plan| B

    %% Calendar Sync
    B -->|OAuth 2.0| GCal[Google Calendar API]
    GCal -->|Sync Events| U

    %% Styling (Nano Banana High-Contrast)
    style U fill:#f9f9f9,stroke:#FFD700,stroke-width:3px
    style F fill:#333,stroke:#FFD700,stroke-width:2px,color:#fff
    style B fill:#333,stroke:#FFD700,stroke-width:2px,color:#fff
    style DB fill:#333,stroke:#FFD700,stroke-width:2px,color:#fff
    style AI fill:#333,stroke:#FFD700,stroke-width:2px,color:#fff
    style GCal fill:#333,stroke:#FFD700,stroke-width:2px,color:#fff

    style M fill:#FFD700,stroke:#333,color:#333
    style P fill:#FFD700,stroke:#333,color:#333
```

---

### **Backend (Metabolic Engine)**

- **FastAPI**: Asynchronous, high-performance API layer.
- **MongoDB**: Unified store for recipes, user profiles, authentication, and chat history.
- **Google GenAI SDK**: Native interface for Gemini 2.5 models.
- **Pydantic**: Strict data validation for complex nutritional schemas.

### **Frontend (Culinary Experience)**

- **Vite + React**: Modern, lightning-fast rendering engine.
- **Shadcn UI**: For premium, accessible component architecture.
- **Framer Motion**: Subtle micro-animations for an alive, interactive interface.
- **Tailwind CSS**: Custom botanical tokens for a unified design system.

---

## ⚙️ Development Guide

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB instance (Local or Atlas)
- API Keys: OpenRouter, Scaledown (Optional)

### Backend Initialization

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Configure your environment variables
uvicorn app.main:app --reload
```

### Frontend Initialization

```bash
cd frontend
npm install
npm run dev
```

---

## � API Overview (Summary)

| Endpoint          | Method | Purpose                                        |
| :---------------- | :----- | :--------------------------------------------- |
| `/auth/signup`    | POST   | Resident registration with hashed credentials. |
| `/user/nutrition` | POST   | Calculate BMR/TDEE and persist profile.        |
| `/search`         | POST   | Personalized RAG recipe retrieval.             |
| `/meal-plan`      | POST   | Generate full interactive calendar plan.       |
| `/health`         | GET    | System integrity check.                        |

---

## 🗺️ Roadmap

- [ ] **Phase 4**: In-app Grocery List generator based on weekly recipes.
- [ ] **Phase 5**: Real-time pantry tracking via image recognition.
- [ ] **Phase 6**: Integration with wearable health data (Apple Health/Google Fit).

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**FitFork** is built to empower individuals to take control of their nutrition without sacrificing the joy of professional-grade cooking. 🌿🍔
