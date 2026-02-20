"""
Data ingestion script: loads JSONL recipes, chunks them, embeds and stores into ChromaDB.
Run once before starting the server.

Usage:
    python ingest.py
    python ingest.py --file ../sample_recipes_1k.jsonl  (for quick dev)
"""

import json
import os
import argparse
import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path

# ---- Config ----------------------------------------------------------------
CHROMA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "chroma_store"))
COLLECTION_NAME = "recipes"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
BATCH_SIZE = 100
# ---------------------------------------------------------------------------


def load_jsonl(path: str):
    """Load all records from a JSONL file."""
    records = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def build_recipe_text(recipe: dict) -> str:
    """
    Create a rich text chunk for embedding.
    Combines title, cuisine, ingredients, tags, and nutrition.
    """
    parts = []
    parts.append(f"Recipe: {recipe.get('title', '')}")
    parts.append(f"Cuisine: {recipe.get('cuisine', 'unknown')}")
    parts.append(f"Description: {recipe.get('description', '')[:200]}")

    ingredients = recipe.get("ingredients", [])
    parts.append("Ingredients: " + ", ".join(ingredients[:20]))

    tags = recipe.get("tags", [])
    parts.append("Tags: " + ", ".join(tags[:15]))

    meal_types = recipe.get("meal_types", [])
    if meal_types:
        parts.append("Meal types: " + ", ".join(meal_types))

    dietary = recipe.get("dietary_tags", [])
    if dietary:
        parts.append("Dietary: " + ", ".join(dietary))

    allergens = recipe.get("allergens", [])
    if allergens:
        parts.append("Allergens: " + ", ".join(allergens))

    nutrition = recipe.get("nutrition", {})
    if nutrition:
        parts.append(
            f"Nutrition per serving: {nutrition.get('calories', 0):.0f} kcal, "
            f"{nutrition.get('protein_g', 0):.1f}g protein, "
            f"{nutrition.get('carbs_g', 0):.1f}g carbs, "
            f"{nutrition.get('fat_g', 0):.1f}g fat"
        )

    time_min = recipe.get("total_time_min") or recipe.get("time_minutes")
    if time_min:
        parts.append(f"Total time: {time_min} minutes")

    return ". ".join(parts)


def build_metadata(recipe: dict) -> dict:
    """Build ChromaDB-compatible metadata (flat, primitive types only)."""
    nutrition = recipe.get("nutrition", {})
    return {
        "recipe_id": recipe.get("id", ""),
        "title": recipe.get("title", ""),
        "cuisine": recipe.get("cuisine", ""),
        "cuisine_confidence": float(recipe.get("cuisine_confidence", 0.0)),
        "calories": float(nutrition.get("calories", 0)),
        "protein_g": float(nutrition.get("protein_g", 0)),
        "carbs_g": float(nutrition.get("carbs_g", 0)),
        "fat_g": float(nutrition.get("fat_g", 0)),
        "fiber_g": float(nutrition.get("fiber_g", 0)),
        "sodium_mg": float(nutrition.get("sodium_mg", 0)),
        "saturated_fat_g": float(nutrition.get("saturated_fat_g", 0)),
        "time_minutes": int(recipe.get("total_time_min") or recipe.get("time_minutes") or 0),
        "n_ingredients": int(recipe.get("n_ingredients", 0)),
        "n_steps": int(recipe.get("n_steps", 0)),
        "meal_types": ",".join(recipe.get("meal_types", [])),
        "dietary_tags": ",".join(recipe.get("dietary_tags", [])),
        "allergens": ",".join(recipe.get("allergens", [])),
        "regions": ",".join(recipe.get("regions", [])),
        "tags": ",".join(recipe.get("tags", [])[:20]),
        "ingredients_raw": json.dumps(recipe.get("ingredients", [])[:20]),
        "instructions_raw": json.dumps(recipe.get("instructions", [])[:15]),
        "description": (recipe.get("description", "") or "")[:500],
        "nutrition_valid": bool(recipe.get("nutrition_valid", True)),
    }


def ingest(file_path: str):
    print(f"[Ingest] Loading: {file_path}")
    records = load_jsonl(file_path)
    print(f"[Ingest] Loaded {len(records)} recipes")

    # Init ChromaDB
    client = chromadb.PersistentClient(path=CHROMA_PATH)

    # Use built-in sentence-transformer embedding function
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=EMBEDDING_MODEL
    )

    # Clear old collection if exists and create fresh
    try:
        client.delete_collection(COLLECTION_NAME)
        print(f"[Ingest] Deleted existing collection '{COLLECTION_NAME}'")
    except Exception:
        pass

    collection = client.create_collection(
        name=COLLECTION_NAME,
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"},
    )
    print(f"[Ingest] Created collection '{COLLECTION_NAME}' with model '{EMBEDDING_MODEL}'")

    ids, documents, metadatas = [], [], []
    total = 0

    for i, recipe in enumerate(records):
        rid = recipe.get("id", f"recipe_{i}")
        doc_text = build_recipe_text(recipe)
        meta = build_metadata(recipe)

        ids.append(rid)
        documents.append(doc_text)
        metadatas.append(meta)

        if len(ids) >= BATCH_SIZE:
            collection.add(ids=ids, documents=documents, metadatas=metadatas)
            total += len(ids)
            print(f"\r[Ingest] Indexed {total}/{len(records)} recipes...", end="", flush=True)
            ids, documents, metadatas = [], [], []

    # Flush remaining
    if ids:
        collection.add(ids=ids, documents=documents, metadatas=metadatas)
        total += len(ids)

    print(f"\n[Ingest] Done. Total indexed: {total} recipes.")
    print(f"[Ingest] ChromaDB stored at: {os.path.abspath(CHROMA_PATH)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest recipes into ChromaDB")
    parser.add_argument(
        "--file",
        default="../sample_recipes_1k.jsonl",
        help="Path to the JSONL recipes file (default: sample_recipes_1k.jsonl)"
    )
    args = parser.parse_args()
    path = Path(args.file).resolve()
    if not path.exists():
        print(f"[Ingest] ERROR: File not found: {path}")
        exit(1)
    ingest(str(path))
