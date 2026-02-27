from app.models.schemas import UserProfile
from typing import List

def build_meal_plan_system_prompt(profile: UserProfile, nutrition_profile, days: int) -> str:
    """
    Build a comprehensive system prompt for Gemini to generate structured meal plans.
    """
    restrictions = ", ".join(profile.dietary_restrictions) if profile.dietary_restrictions else "None"
    cuisines = ", ".join(profile.cuisine_preferences) if profile.cuisine_preferences else "Any"
    
    prompt = f"""
You are a world-class professional nutritionist and culinary expert.
Your task is to create a highly personalized {days}-day meal plan for a user.

USER PROFILE:
- Goal: {profile.goal}
- Dietary Restrictions: {restrictions}
- Cuisine Preferences: {cuisines}

NUTRITIONAL TARGETS (DAILY):
- Calories: {nutrition_profile.target_calories} kcal
- Protein: {nutrition_profile.protein_g}g
- Carbs: {nutrition_profile.carbs_g}g
- Fat: {nutrition_profile.fat_g}g

CORE INSTRUCTIONS:
1. Use ONLY the provided recipe context to select meals.
2. Ensure nutritional balance according to the user's goal and targets.
3. Provide a brief, inspiring overview of the meal plan.
4. Output a FULL {days}-day plan (day 1 to day {days}).
5. Output the result strictly in the following JSON format for a calendar UI.

JSON STRUCTURE:
{{
  "overview": "A brief summary of the plan and why it fits the user.",
  "days": [
    {{
      "day_number": 1,
      "total_calories": 2100,
      "meals": [
        {{
          "meal_type": "Breakfast",
          "recipe_id": "id_here",
          "recipe_title": "Title here",
          "calories": 450,
          "protein_g": 30.5,
          "carbs_g": 40.0,
          "fat_g": 15.2
        }},
        ... (Include Lunch and Dinner)
      ]
    }},
    ... (Repeat for ALL {days} days)
  ],
  "nutrition_targets": {{
      "bmr": {nutrition_profile.bmr},
      "tdee": {nutrition_profile.tdee},
      "target_calories": {nutrition_profile.target_calories},
      "protein_g": {nutrition_profile.protein_g},
      "carbs_g": {nutrition_profile.carbs_g},
      "fat_g": {nutrition_profile.fat_g}
  }}
}}

Ensure the JSON is perfectly valid and contains no additional text outside the JSON block.
"""
    return prompt.strip()


def build_augmented_query(query: str, profile: UserProfile, nutrition_profile) -> str:
    """
    Produce a weighted keyword string for MongoDB text search.
    Filters out common sentence noise to focus on food keywords.
    """
    import re
    noise_patterns = [
        r"I want a \d+-day meal plan",
        r"with \d+ meals per day",
        r"generate a plan",
        r"can you make",
        r"please provide",
        r"for me"
    ]
    
    clean_query = query
    for pattern in noise_patterns:
        clean_query = re.sub(pattern, "", clean_query, flags=re.IGNORECASE)
    
    terms = []
    if clean_query.strip():
        terms.append(clean_query.strip())
        
    # Profile attributes (Goal and Cuisines)
    terms.append(profile.goal.replace('_', ' '))
    
    if profile.cuisine_preferences:
        terms.extend(profile.cuisine_preferences)
        
    # Dietary hints
    if profile.dietary_restrictions:
        terms.extend(profile.dietary_restrictions)
        
    final_query = " ".join(terms)
    print(f"DEBUG: [RAG] Augmented Query: {final_query}")
    return final_query
