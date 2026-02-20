# API Documentation 🚀

The FitFork backend provides a RESTful API built with FastAPI. All endpoints return JSON and require `Content-Type: application/json` unless otherwise specified.

## Authentication

FitFork uses Bearer Token authentication.

- **Endpoint**: `/auth/login` (POST)
- **Content-Type**: `application/x-www-form-urlencoded`
- **Fields**: `username` (email), `password`

## Endpoints

### User Profile & Nutrition

| Endpoint          | Method | Description                                    |
| :---------------- | :----- | :--------------------------------------------- |
| `/auth/signup`    | POST   | Register a new user.                           |
| `/user/me`        | GET    | Get current authenticated user details.        |
| `/user/profile`   | GET    | Get current user's bio-metric profile.         |
| `/user/nutrition` | POST   | Calculate/Update metabolic profile (BMR/TDEE). |

### Recipe & Meal Planning (The RAG Core)

- **POST `/search`**
  - **Purpose**: Semantic search for recipes based on a query and user profile restrictions.
  - **Body**: `{ "query": string, "user_profile": UserProfile, "top_k": int }`

- **POST `/meal-plan`**
  - **Purpose**: Generates a full interactive meal plan for a specified duration using the RAG pipeline.
  - **Body**: `{ "user_profile": UserProfile, "days": int, "meals_per_day": int }`

- **GET `/meal-plan/latest`**
  - **Purpose**: Retrieves the most recently generated meal plan for the user.

- **GET `/recipes/{id}`**
  - **Purpose**: Get full details for a specific recipe.

### System

- **GET `/health`**
  - **Purpose**: Basic health check.

## Data Schemas (Simplified)

### UserProfile

```json
{
  "age": 30,
  "gender": "male",
  "weight_kg": 80,
  "height_cm": 180,
  "activity_level": "moderate",
  "goal": "lose_weight",
  "dietary_restrictions": ["vegan", "gluten_free"]
}
```

### CalendarResponse

The `/meal-plan` endpoint returns a structured JSON containing a list of days, each with a list of meals, fulfilling the metabolic targets calculated by the system.
