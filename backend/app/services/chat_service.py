from google import genai
from app.core.config import GEMINI_API_KEY
from app.db.mongodb import mongodb_client
from app.models.schemas import UserProfile, ChatResponse

DISCOVERY_SYSTEM_PROMPT = """
You are "Chef Discovery," a world-class culinary expert and metabolic health coach. 
Your goal is to have a short, punchy, and highly personalized discovery chat with a user to help them build the perfect meal plan.

CORE BEHAVIOR:
1. ASK & LISTEN: Instead of giving a plan immediately, ask 1-2 clarifying questions per turn.
2. DISCOVER: Ask about their energy levels, favorite seasonal ingredients, kitchen equipment, or time constraints for specific days.
3. TONE: Premium, encouraging, botanical, and expert.
4. LIMIT: Aim to finish the discovery in 3-5 turns.

PLAN COMPLETION:
When you feel you have enough information to build a truly bespoke meal plan, you MUST end your message with the exact token: [PLAN_READY].
This will signal the system to switch to the generation phase.

USER DATA:
{profile_summary}
"""

class ChatService:
    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
        self.model_name = "gemini-2.5-flash"

    def get_chef_response(self, user_id: str, message: str, profile: UserProfile = None) -> ChatResponse:
        # 1. Store user message
        mongodb_client.save_chat_message(user_id, "user", message)

        # 2. Get history
        history = mongodb_client.get_chat_history(user_id)
        
        # 3. Format profile for prompt
        profile_text = "No profile set yet."
        if profile:
            profile_text = f"Goal: {profile.goal}, Restrictions: {profile.dietary_restrictions}, Cuisines: {profile.cuisine_preferences}"

        # 4. Build prompt (Native Gemini Format)
        system_msg = DISCOVERY_SYSTEM_PROMPT.format(profile_summary=profile_text)
        
        contents = []
        for h in history:
            role = "user" if h["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": h["content"]}]
            })

        # 5. Call Gemini
        if not self.client:
            return ChatResponse(reply="API key missing, but I'm listening!", is_complete=False)

        try:
            print(f"DEBUG: Calling Gemini with {len(contents)} history items")
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config={"system_instruction": system_msg}
            )
            reply = response.text or ""
            print(f"DEBUG: Received reply: {reply[:50]}...")
        except Exception as e:
            print(f"DEBUG: Gemini Error: {str(e)}")
            reply = "I'm having a bit of trouble connecting to my culinary database. Could you try that again?"
        
        # 6. Check for completion token
        is_complete = "[PLAN_READY]" in reply
        clean_reply = reply.replace("[PLAN_READY]", "").strip()

        # 7. Store assistant response
        mongodb_client.save_chat_message(user_id, "assistant", clean_reply)

        return ChatResponse(
            reply=clean_reply,
            is_complete=is_complete,
            suggested_actions=self._generate_suggestions(is_complete)
        )

    def _generate_suggestions(self, is_complete: bool):
        if is_complete:
            return ["✨ Generate My Plan", "🤔 Wait, one more thing..."]
        return ["I'm a beginner cook", "I love spicy food", "I have a slow cooker"]

chat_service = ChatService()
