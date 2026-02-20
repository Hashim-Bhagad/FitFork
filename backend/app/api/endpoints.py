from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from app.models.schemas import (
    UserProfile, NutritionProfile, RecipeQuery, RecipeResult, 
    MealPlanRequest, CalendarResponse, UserCreate, Token, User,
    ChatRequest, ChatResponse
)
from app.services.nutrition import calculate_nutrition_profile
from app.services.meal_planner import meal_planner_service
from app.services.chat_service import chat_service
from app.db.mongodb import mongodb_client
from app.api.auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter()

@router.post("/chat/send", response_model=ChatResponse)
def send_chat_message(req: ChatRequest, current_user: User = Depends(get_current_user)):
    """Send a message to the Discovery Agent."""
    try:
        return chat_service.get_chef_response(
            user_id=current_user.id,
            message=req.message,
            profile=req.profile
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/history", response_model=List[dict])
def get_chat_history(current_user: User = Depends(get_current_user)):
    """Fetch recent chat history for the user."""
    return mongodb_client.get_chat_history(current_user.id)

@router.delete("/chat/clear")
def clear_chat(current_user: User = Depends(get_current_user)):
    """Reset the chat session."""
    mongodb_client.clear_chat_history(current_user.id)
    return {"status": "cleared"}
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
    Personalized recipe search using MongoDB text search + filtering.
    """
    try:
        # We handle mapping from MongoDB docs to RecipeResult
        recipes = mongodb_client.find_recipes(
            query=req.query,
            profile=req.user_profile,
            limit=req.top_k
        )
        return [RecipeResult(**r) for r in recipes]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recipes/{recipe_id}", response_model=RecipeResult)
def get_recipe(recipe_id: str):
    """Fetch a single recipe by its ID from MongoDB."""
    from bson import ObjectId
    try:
        recipe = mongodb_client.recipes_collection.find_one({"_id": ObjectId(recipe_id)})
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        recipe["id"] = str(recipe.pop("_id"))
        return RecipeResult(**recipe)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid recipe ID")

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
            days=req.days,
            user_id=current_user.id
        )
        # Store in MongoDB
        mongodb_client.save_meal_plan(current_user.id, plan.model_dump())
        return plan
    except Exception as e:
        import traceback
        print(f"Error in generate_meal_plan: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/meal-plan/latest", response_model=Optional[CalendarResponse])
def get_latest_meal_plan(current_user: User = Depends(get_current_user)):
    """Fetch the user's latest generated meal plan."""
    plan_data = mongodb_client.get_latest_meal_plan(current_user.id)
    if not plan_data:
        return None
    return CalendarResponse(**plan_data)
