from app.db.chromadb import chromadb_client
from app.core.prompts import build_augmented_query
from app.models.schemas import UserProfile
from app.services.nutrition import calculate_nutrition_profile

def test_retrieval(query: str, profile: UserProfile):
    print(f"\nTesting Query: '{query}'")
    print(f"Profile: {profile.goal}, Restrictions: {profile.dietary_restrictions}, Cuisines: {profile.cuisine_preferences}")
    
    nutrition = calculate_nutrition_profile(profile)
    aug_query = build_augmented_query(query, profile, nutrition)
    print(f"Augmented Query: '{aug_query}'")
    
    results = chromadb_client.search(aug_query, profile, top_k=5)
    
    print("\nResults:")
    for i, r in enumerate(results):
        print(f"{i+1}. {r.title} (Score: {r.score})")
        print(f"   Cuisine: {r.cuisine}, Cal: {r.calories}, P: {r.protein_g}g, Tags: {r.dietary_tags}")
        print(f"   Allergens: {r.allergens}")

if __name__ == "__main__":
    # Test 1: Vegetarian High Protein
    p1 = UserProfile(
        height_cm=180, weight_kg=75, age=30, gender="male",
        activity_level="moderately_active", goal="bulking",
        dietary_restrictions=["vegetarian"],
        cuisine_preferences=["Indian"]
    )
    test_retrieval("High protein dinner", p1)
    
    # Test 2: Keto Weight Loss
    p2 = UserProfile(
        height_cm=165, weight_kg=70, age=28, gender="female",
        activity_level="lightly_active", goal="weight_loss",
        dietary_restrictions=["keto"],
        cuisine_preferences=["Mediterranean"]
    )
    test_retrieval("Low carb lunch", p2)
    
    # Test 3: Allergen avoidance
    p3 = UserProfile(
        height_cm=175, weight_kg=70, age=35, gender="male",
        activity_level="sedentary", goal="maintenance",
        allergens_to_avoid=["peanuts", "shellfish"]
    )
    test_retrieval("Safety first dinner", p3)
