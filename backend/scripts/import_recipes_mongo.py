import json
import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Add parent dir to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "fitfork")
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
RECIPES_FILE = os.path.join(SCRIPT_DIR, "..", "..", "data", "processed", "final_recipes_enriched.jsonl")

if not os.path.exists(RECIPES_FILE):
    print(f"❌ Error: {RECIPES_FILE} not found")
    sys.exit(1)

def import_recipes():
    client = MongoClient(MONGO_URI)
    db = client.get_database(DB_NAME)
    recipes_collection = db.get_collection("recipes")

    print(f"🚀 Starting import from {RECIPES_FILE}...")
    
    # Check if empty, or if we should just clear it for a clean migration
    # recipes_collection.delete_many({}) 

    batch = []
    count = 0
    total_imported = 0

    with open(RECIPES_FILE, "r", encoding="utf-8") as f:
        for line in f:
            try:
                recipe = json.loads(line.strip())
                # Ensure fields are consistent with MongoDBClient search
                # Dietary tags should be lowercase for easier matching
                if "dietary_tags" in recipe and isinstance(recipe["dietary_tags"], list):
                    recipe["dietary_tags"] = [t.lower() for t in recipe["dietary_tags"]]
                
                batch.append(recipe)
                count += 1
                
                if count >= 1000:
                    recipes_collection.insert_many(batch)
                    total_imported += count
                    print(f"✅ Imported {total_imported} recipes...")
                    batch = []
                    count = 0
            except Exception as e:
                print(f"❌ Error parsing line: {e}")

    if batch:
        recipes_collection.insert_many(batch)
        total_imported += count
        print(f"✅ Finished! Imported total: {total_imported} recipes.")

    # Create indexes
    print("🧠 Creating search indexes...")
    recipes_collection.create_index([("dietary_tags", 1)])
    recipes_collection.create_index([("allergens", 1)])
    recipes_collection.create_index([
        ("title", "text"),
        ("description", "text")
    ])
    print("✨ Indexes created.")

if __name__ == "__main__":
    import_recipes()
