# Architecture Overview: FitFork 🥗

FitFork is an AI-driven culinary ecosystem designed for high-precision metabolic management. The system architecture is optimized for low-latency Retrieval-Augmented Generation (RAG) and biometric-aware user experiences.

## 🧠 Core Pillar: Metabolic Intelligence

At the heart of FitFork is a sophisticated biometric engine that transforms raw physical data into actionable nutritional targets.

### 1. Thermodynamic Baseline (Mifflin-St Jeor)

We implement the **Mifflin-St Jeor Equation**, widely regarded as the most accurate standard for predicting Resting Metabolic Rate (RMR).

- **Male**: `10 * weight (kg) + 6.25 * height (cm) - 5 * age (y) + 5`
- **Female**: `10 * weight (kg) + 6.25 * height (cm) - 5 * age (y) - 161`

### 2. Dynamic TDEE Calculation

The system calculates Total Daily Energy Expenditure (TDEE) by applying an Activity Multiplier to the BMR, ranging from `1.2` (Sedentary) to `1.9` (Extra Active). These metrics are not static; they are re-calculated and persisted in MongoDB whenever user metrics change, ensuring the RAG engine always has the "current state" of the user's metabolism.

## 🏗️ Technical Architecture: Unified RAG

FitFork utilizes a structured **Retrieval-Augmented Generation (RAG)** pipeline. We evolved our architecture from a dual-store setup (ChromaDB + MongoDB) to a **Unified MongoDB Architecture**.

### The Hybrid Search Strategy

By leveraging MongoDB's `$search` stage with custom analyzers, we achieve sub-50ms retrieval across 226,000+ recipes without the overhead of external vector synchronization.

1. **Filtering Layer**: First-pass reduction based on hard biometric constraints (e.g., "Must be < 600 calories" or "Vegan").
2. **Semantic Weighting**: Score boosting based on user goals (e.g., boosting high-protein recipes for "Build Muscle").
3. **Retrieval**: Top-K candidates are fetched and formatted as structured context.

## 🎨 Design System: Botanical High-Contrast

The UI/UX is built on a custom "Deep Olive & Cream" palette, specifically chosen for kitchen environments.

### Design Tokens

- **Background**: `hsl(120, 15%, 5%)` (Deep Obsidian)
- **Primary**: `hsl(142, 60%, 45%)` (Botanical Green)
- **Secondary**: `hsl(38, 92%, 50%)` (Amber Glow)
- **Acrylic Effects**: 15% blur with glassmorphism to reduce cognitive load while maintaining spatial hierarchy.

## 🔐 Security & Persistence

- **State Sync**: Uses JWTs with a custom **Global Axios Interceptor** that handles real-time session expiration (401) with clean logout redirection.
- **Data Integrity**: All culinary plans are versioned. If a user optimizes a plan, the previous version is archived in MongoDB, allowing for future "Culinary History" features.

## 🚀 AI Gateway: Frontiers of Generation

We utilize the **`google-genai`** SDK to interface with **Gemini 2.0 Flash**.

- **Temperature Tuning**: Set to `0.3` for meal planning to ensure nutritional accuracy, and `0.7` for the "Chef Chat" to allow for creative culinary advice.
- **Failover Logic**: Implemented retry mechanisms and quota management to handle high-concurrency culinary requests.
