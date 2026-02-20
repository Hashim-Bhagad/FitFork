# FitFork: Personalized AI Culinary Assistant 🥗

FitFork is a high-performance, RAG-powered meal planning application that delivers personalized nutrition and culinary inspiration. By combining advanced vector search with state-of-the-art LLMs, FitFork transforms basic user metrics into highly specific, dietary-compliant meal plans.

![FitFork Hero](https://lh3.googleusercontent.com/aida/AOfcidUYJPapx9xQKmv-gOdlRvgTQ_EDJ_Ca_7--ur9X549tQGzhoJ8kqzfFsMWjVd4mTHoagfqs1Z4DgQdiGDfGm1jbfdM27VeHxcdsOThJ5CP9CF_b8BJD7HMfIbL3olDcYB-7OdyL-md_uFuqzFsEt_7NWkuar-62Tpc1OMW2l1sGXiO68wHFUJkfsZ76v93feCd4iSWR9BhcWubS21uwMZVGPA_brQns36uwUe5RXjiJyA0dBv5_sloxkDox)

## 🚀 Key Features

- **Personalized RAG Engine**: Custom Retrieval-Augmented Generation pipeline using **ChromaDB** and **OpenRouter (Gemini 2.0 Flash)**.
- **Dynamic Nutrition Logic**: Automated BMR and TDEE calculations based on Mifflin-St Jeor equation to tailor caloric and macro targets.
- **Hard Dietary Filtering**: Multi-layer metadata filtering ensures strict adherence to dietary restrictions (Vegetarian, Keto, Paleo, etc.) and allergen avoidance.
- **Cuisine Reranking**: Intelligently boosts recipes matching your regional and culinary preferences.
- **Prompt Compression**: Integrated **Scaledown** technology to optimize context window usage and reduce latency.
- **Premium Interface**: A "Deep Olive & Cream" dark botanical aesthetic built for readability and a premium user experience.

---

## 🛠️ Tech Stack

### Backend

- **Framework**: FastAPI (Python 3.10+)
- **Vector Database**: ChromaDB (Semantic Search)
- **Primary Database**: MongoDB (User Data & Plan History)
- **AI Integration**: OpenRouter (LLM Gateway), Scaledown (Context Compression)

### Frontend

- **Framework**: Vite + React
- **Styling**: Tailwind CSS (Custom Dark Botanical Palette)
- **UI Components**: Shadcn UI, Lucide Icons, Framer Motion

---

## 🏗️ Architecture Overview

FitFork's RAG pipeline follows a modern "Filter -> Retrieve -> Rerank -> Generate" flow:

1.  **Augmentation**: User search queries are augmented with real-time nutrition targets and profile metadata.
2.  **Metadata Filtering**: Hard exclusion of allergens and inclusion of dietary tags via ChromaDB metadata.
3.  **Vector Search**: Semantic retrieval from a database of 1,000+ enriched recipes.
4.  **Cuisine Reranking**: Results are reranked based on user-defined cuisine preferences.
5.  **LLM Generation**: OpenRouter serves the final context-aware meal plan in structured JSON format.

---

## 🎨 UI Showcase

```carousel
![Landing Page](https://lh3.googleusercontent.com/aida/AOfcidUYJPapx9xQKmv-gOdlRvgTQ_EDJ_Ca_7--ur9X549tQGzhoJ8kqzfFsMWjVd4mTHoagfqs1Z4DgQdiGDfGm1jbfdM27VeHxcdsOThJ5CP9CF_b8BJD7HMfIbL3olDcYB-7OdyL-md_uFuqzFsEt_7NWkuar-62Tpc1OMW2l1sGXiO68wHFUJkfsZ76v93feCd4iSWR9BhcWubS21uwMZVGPA_brQns36uwUe5RXjiJyA0dBv5_sloxkDox)
<!-- slide -->
![Personalized Experience](https://lh3.googleusercontent.com/aida/AOfcidW9oWrPk46cqJkdEK5K6k00wEpZH-UvDsnWLRxg3031tiMzn9DZ0eZdml9uSnrbtqihn3YQevFjtNXjO9Kvpagfh9MUsDOORPbqvBTmF5gpmq6vR5w6LzOuQaOZf-faENL-T9o9fqyGPhIPQGV0NLjPh7WgGGgpbz--kyHLqilBsd_of7SEW5zlFZ4y-Jl090BPqF6HacuFmZrzlYWONFyDtTyq3UuRSQuPkZo6M49k_CpRv1JaL_BT2aO4)
```

---

## ⚙️ Installation & Setup

### Prerequisites

- Python 3.10+
- Node.js & npm
- MongoDB Atlas account (or local instance)

### Backend Setup

1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate` # On Windows: `.\venv\Scripts\activate`
4. `pip install -r requirements.txt`
5. Create a `.env` file based on `.env.example`.
6. `uvicorn app.main:app --reload`

### Frontend Setup

1. `cd frontend`
2. `npm install`
3. `npm run dev`

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ for culinary enthusiasts and health-conscious eaters.**
