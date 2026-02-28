"""
Google Calendar integration service.
Handles OAuth 2.0 flow and event creation for meal plans.
"""

from datetime import datetime, timedelta
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from app.core.config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

# OAuth 2.0 scopes — only need event write access
SCOPES = ["https://www.googleapis.com/auth/calendar.events"]

# Default meal times (hour of day)
MEAL_TIMES = {
    "breakfast": 8,
    "lunch": 13,
    "dinner": 19,
    "snack": 16,
}

# Meal emoji map
MEAL_EMOJI = {
    "breakfast": "🍳",
    "lunch": "🥗",
    "dinner": "🍽️",
    "snack": "🍎",
}


def _build_client_config():
    """Build the OAuth client config dict from env vars."""
    return {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [GOOGLE_REDIRECT_URI],
        }
    }


from urllib.parse import urlencode

def get_auth_url(state: str = "") -> str:
    """
    Generate the Google OAuth consent URL manually.
    This avoids the automatic PKCE code challenge generation that causes
    'Missing code verifier' errors in stateless/multi-process environments.
    """
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "consent",
        "state": state,
    }
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    return f"{base_url}?{urlencode(params)}"


def exchange_code(code: str) -> dict:
    """
    Exchange the authorization code for access + refresh tokens.
    Returns a dict: {access_token, refresh_token, expiry}
    """
    flow = Flow.from_client_config(_build_client_config(), scopes=SCOPES)
    flow.redirect_uri = GOOGLE_REDIRECT_URI
    flow.fetch_token(code=code)

    creds = flow.credentials
    return {
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
        "expiry": creds.expiry.isoformat() if creds.expiry else None,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
    }


def _get_calendar_service(tokens: dict):
    """Build an authorized Google Calendar API service from stored tokens."""
    creds = Credentials(
        token=tokens["access_token"],
        refresh_token=tokens.get("refresh_token"),
        token_uri=tokens.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=tokens.get("client_id", GOOGLE_CLIENT_ID),
        client_secret=tokens.get("client_secret", GOOGLE_CLIENT_SECRET),
    )
    return build("calendar", "v3", credentials=creds)


def _meal_time_hour(meal_type: str) -> int:
    """Map a meal type string to an hour of the day."""
    key = meal_type.strip().lower()
    return MEAL_TIMES.get(key, 12)  # default to noon


def _meal_emoji(meal_type: str) -> str:
    key = meal_type.strip().lower()
    return MEAL_EMOJI.get(key, "🍴")


def sync_meal_plan(tokens: dict, plan_data: dict, start_date: str, timezone: str = "Asia/Kolkata") -> dict:
    """
    Push meal plan events to the user's Google Calendar.

    Args:
        tokens: stored Google OAuth tokens
        plan_data: the CalendarResponse dict with 'days' list
        start_date: ISO date string (e.g. "2026-02-28")
        timezone: IANA timezone (e.g. "Asia/Kolkata")

    Returns:
        dict with count of created events and any errors
    """
    service = _get_calendar_service(tokens)
    base_date = datetime.fromisoformat(start_date)

    created = 0
    errors = []

    days = plan_data.get("days", [])

    for day in days:
        day_number = day.get("day_number", 1)
        event_date = base_date + timedelta(days=day_number - 1)

        for meal in day.get("meals", []):
            meal_type = meal.get("meal_type", "Meal")
            recipe_title = meal.get("recipe_title", "Untitled")
            calories = meal.get("calories", 0)
            protein = meal.get("protein_g", 0)
            carbs = meal.get("carbs_g", 0)
            fat = meal.get("fat_g", 0)

            hour = _meal_time_hour(meal_type)
            emoji = _meal_emoji(meal_type)

            start_dt = event_date.replace(hour=hour, minute=0, second=0)
            end_dt = start_dt + timedelta(minutes=30)

            event_body = {
                "summary": f"{emoji} {meal_type}: {recipe_title}",
                "description": (
                    f"🔥 {int(calories)} kcal\n"
                    f"💪 Protein: {protein}g\n"
                    f"🌾 Carbs: {carbs}g\n"
                    f"🥑 Fat: {fat}g\n\n"
                    f"Generated by FitFork"
                ),
                "start": {
                    "dateTime": start_dt.isoformat(),
                    "timeZone": timezone,
                },
                "end": {
                    "dateTime": end_dt.isoformat(),
                    "timeZone": timezone,
                },
                "colorId": "2",  # Sage green in Google Calendar
                "reminders": {
                    "useDefault": False,
                    "overrides": [
                        {"method": "popup", "minutes": 30},
                    ],
                },
            }

            try:
                service.events().insert(calendarId="primary", body=event_body).execute()
                created += 1
            except Exception as e:
                errors.append(f"Day {day_number} {meal_type}: {str(e)}")

    return {
        "created": created,
        "errors": errors,
        "message": f"Successfully synced {created} meals to Google Calendar!" if not errors else f"Synced {created} meals with {len(errors)} error(s).",
    }
