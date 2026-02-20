"""
Nutrition Calculator: BMR, TDEE, and Macro Targets
"""
from app.models.schemas import UserProfile, NutritionProfile


ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "lightly_active": 1.375,
    "moderately_active": 1.55,
    "very_active": 1.725,
    "extremely_active": 1.9,
}

GOAL_CALORIC_ADJUSTMENTS = {
    "weight_loss": -500,
    "bulking": 400,
    "cutting": -350,
    "maintenance": 0,
    "athletic_performance": 200,
}

MACRO_RATIOS = {
    "weight_loss":        {"protein": 0.35, "carbs": 0.35, "fat": 0.30},
    "bulking":            {"protein": 0.30, "carbs": 0.40, "fat": 0.30},
    "cutting":            {"protein": 0.40, "carbs": 0.30, "fat": 0.30},
    "maintenance":        {"protein": 0.30, "carbs": 0.40, "fat": 0.30},
    "athletic_performance": {"protein": 0.30, "carbs": 0.45, "fat": 0.25},
}


def calculate_bmr(profile: UserProfile) -> float:
    """Mifflin-St Jeor Equation."""
    base = (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age)
    if profile.gender.lower() == "male":
        return base + 5
    return base - 161


def calculate_nutrition_profile(profile: UserProfile) -> NutritionProfile:
    bmr = calculate_bmr(profile)
    multiplier = ACTIVITY_MULTIPLIERS.get(profile.activity_level, 1.375)
    tdee = bmr * multiplier
    adjustment = GOAL_CALORIC_ADJUSTMENTS.get(profile.goal, 0)
    target_calories = max(1200, tdee + adjustment)  # Floor at 1200

    ratios = MACRO_RATIOS.get(profile.goal, MACRO_RATIOS["maintenance"])
    protein_g = (target_calories * ratios["protein"]) / 4   # 4 cal/g
    carbs_g   = (target_calories * ratios["carbs"]) / 4     # 4 cal/g
    fat_g     = (target_calories * ratios["fat"]) / 9       # 9 cal/g

    return NutritionProfile(
        bmr=round(bmr, 1),
        tdee=round(tdee, 1),
        target_calories=round(target_calories, 1),
        protein_g=round(protein_g, 1),
        carbs_g=round(carbs_g, 1),
        fat_g=round(fat_g, 1),
    )
