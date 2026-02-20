from pydantic import BaseModel
from typing import Optional, List


class UserProfile(BaseModel):
    height_cm: float
    weight_kg: float
    age: int
    gender: str  # male / female / other
    activity_level: str  # sedentary, lightly_active, moderately_active, very_active, extremely_active
    goal: str  # weight_loss, bulking, cutting, maintenance, athletic_performance
    dietary_restrictions: List[str] = []
    allergens_to_avoid: List[str] = []
    cuisine_preferences: List[str] = []
    region: Optional[str] = "global"


class NutritionProfile(BaseModel):
    bmr: float
    tdee: float
    target_calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class RecipeQuery(BaseModel):
    query: str
    user_profile: UserProfile
    top_k: int = 5


class MealPlanRequest(BaseModel):
    user_profile: UserProfile
    days: int = 7
    meals_per_day: int = 3


class RecipeResult(BaseModel):
    id: str
    title: str
    description: Optional[str] = ""
    cuisine: Optional[str] = ""
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    ingredients: List[str] = []
    instructions: List[str] = []
    time_minutes: Optional[int] = None
    meal_types: List[str] = []
    dietary_tags: List[str] = []
    allergens: List[str] = []
    score: Optional[float] = None


class MealDetail(BaseModel):
    meal_type: str  # Breakfast, Lunch, Dinner
    recipe_id: str
    recipe_title: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class DayPlan(BaseModel):
    day_number: int
    meals: List[MealDetail]
    total_calories: float


class CalendarResponse(BaseModel):
    overview: str
    days: List[DayPlan]
    nutrition_targets: Optional[NutritionProfile] = None


class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: str
    profile: Optional[UserProfile] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    user_id: str
    profile: Optional[UserProfile] = None


class ChatResponse(BaseModel):
    reply: str
    is_complete: bool = False  # True if the Chef is ready to generate the plan
    suggested_actions: List[str] = []
