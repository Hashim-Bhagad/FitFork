from app.models.schemas import (
    UserProfile, NutritionProfile, RecipeQuery, RecipeResult, 
    MealPlanRequest, CalendarResponse, UserCreate, Token, User
)
from app.services.nutrition import calculate_nutrition_profile
from app.services.meal_planner import meal_planner_service
from app.db.mongodb import mongodb_client
from app.db.chromadb import chromadb_client
from app.api.auth import get_password_hash, verify_password, create_access_token, get_current_user
from typing import List, Optional
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter()

@router.post("/auth/signup", response_model=User)
def signup(user: UserCreate):
    hashed_pwd = get_password_hash(user.password)
    new_user = mongodb_client.create_user({
        "email": user.email,
        "full_name": user.full_name,
        "hashed_password": hashed_pwd,
        "profile": None
    })
    if not new_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return new_user

@router.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = mongodb_client.get_user_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/user/nutrition", response_model=NutritionProfile)
def get_nutrition(profile: UserProfile, current_user: User = Depends(get_current_user)):
    """Calculate and save user profile to MongoDB."""
    nutrition = calculate_nutrition_profile(profile)
    mongodb_client.save_user_profile(current_user.id, profile)
    return nutrition

@router.get("/user/me", response_model=User)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's basic info."""
    return current_user

@router.get("/user/profile")
def get_user_profile(current_user: User = Depends(get_current_user)):
    """Return the user's saved profile and recalculated nutrition from MongoDB."""
    user = mongodb_client.get_user_by_email(current_user.email)
    if not user or not user.get("profile"):
        return {"profile": None, "nutrition": None}
    
    from app.models.schemas import UserProfile as UP
    profile = UP(**user["profile"])
    nutrition = calculate_nutrition_profile(profile)
    return {
        "profile": profile.model_dump(),
        "nutrition": nutrition.model_dump(),
    }

@router.post("/search", response_model=List[RecipeResult])
def search_recipes(req: RecipeQuery):
    """
    RAG-powered recipe search personalized to the user's profile.
    """
    try:
        results = chromadb_client.search(
            query=req.query,
            profile=req.user_profile,
            top_k=req.top_k,
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recipes/{recipe_id}", response_model=RecipeResult)
def get_recipe(recipe_id: str):
    """Fetch a single recipe by its ID."""
    recipe = chromadb_client.get_recipe_by_id(recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe

@router.post("/meal-plan", response_model=CalendarResponse)
def generate_meal_plan(req: MealPlanRequest, current_user: User = Depends(get_current_user)):
    """
    Generate an interactive, structured meal plan and save it to the DB.
    """
    try:
        query = f"I want a {req.days}-day meal plan with {req.meals_per_day} meals per day."
        plan = meal_planner_service.generate_interactive_meal_plan(
            query=query,
            profile=req.user_profile,
            days=req.days
        )
        # Store in MongoDB
        mongodb_client.save_meal_plan(current_user.id, plan.model_dump())
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/meal-plan/latest", response_model=Optional[CalendarResponse])
def get_latest_meal_plan(current_user: User = Depends(get_current_user)):
    """Fetch the user's latest generated meal plan."""
    plan_data = mongodb_client.get_latest_meal_plan(current_user.id)
    if not plan_data:
        return None
    return CalendarResponse(**plan_data)
