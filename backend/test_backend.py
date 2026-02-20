import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.abspath("."))

from app.db.mongodb import mongodb_client
from app.services.meal_planner import meal_planner_service
from app.models.schemas import UserProfile

load_dotenv()

print(f"DEBUG: OPEN_ROUTER_API_KEY starts with: {os.getenv('OPEN_ROUTER_API_KEY')[:4] if os.getenv('OPEN_ROUTER_API_KEY') else 'None'}")

def test_mongodb_persistence():
    print("\n--- Testing MongoDB Persistence ---")
    user_id = "507f1f77bcf86cd799439011"  # Valid ObjectId string
    profile = UserProfile(
        height_cm=180,
        weight_kg=75,
        age=30,
        gender="male",
        activity_level="moderately_active",
        goal="weight_loss",
        cuisine_preferences=["Italian", "Indian"]
    )
    
    print(f"Saving profile for {user_id}...")
    mongodb_client.save_user_profile(user_id, profile)
    
    print("Retrieving profile...")
    saved_profile = mongodb_client.get_user_profile(user_id)
    
    if saved_profile and saved_profile.goal == "weight_loss":
        print("[SUCCESS] MongoDB Persistence Success!")
    else:
        print("[FAILURE] MongoDB Persistence Failed!")

def test_rag_loop():
    print("\n--- Testing RAG Generation Loop (Scaledown + OpenRouter) ---")
    profile = UserProfile(
        height_cm=180,
        weight_kg=75,
        age=30,
        gender="male",
        activity_level="moderately_active",
        goal="bulking",
        dietary_restrictions=["vegetarian"]
    )
    
    query = "Give me a high protein vegetarian meal plan for 1 day."
    print(f"Generating plan for query: '{query}'...")
    
    try:
        plan = meal_planner_service.generate_interactive_meal_plan(query, profile, days=1)
        print("\nGenerated Plan Preview (Interactive JSON):")
        print("-" * 30)
        print(plan.model_dump_json(indent=2)[:500] + "...")
        print("-" * 30)
        print("[SUCCESS] RAG Loop Success!")
    except Exception as e:
        print(f"[FAILURE] RAG Loop Failed: {e}")
        # Debugging: List available models if possible
        if meal_planner_service.client:
            try:
                print("Testing connection to OpenRouter...")
                # We can't easily list models from OpenRouter via openai lib without extra calls
                # but we can try a dummy request or just print client status
                print(f"OpenRouter Client initialized with base_url: {meal_planner_service.client.base_url}")
            except Exception as le:
                print(f"Connection test failed: {le}")

if __name__ == "__main__":
    test_mongodb_persistence()
    test_rag_loop()
