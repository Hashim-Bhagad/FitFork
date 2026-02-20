# Personalized Culinary Assistant: RAG System Research & Design

## Project Overview
Building a RAG (Retrieval-Augmented Generation) application that creates a highly personalized culinary assistant. The system will compress recipe databases and nutritional information to provide faster meal planning based on user-specific parameters like height, weight, age, gender, fitness goals (weight loss, bulking, cutting), and regional ingredient availability.

---

## 1. Data Sources & Databases
final_recepies_enriched.jsonl file in the root directory



- **Implementation**:
  ```python
  import requests
  
  API_KEY = "your_api_key"
  BASE_URL = "https://api.nal.usda.gov/fdc/v1"
  
  # Search for food
  response = requests.get(
      f"{BASE_URL}/foods/search",
      params={"api_key": API_KEY, "query": "chicken breast"}
  )
  ```



## 2. User Profile & Personalization

### User Input Parameters

#### Basic Metrics
- **Height** (cm/inches)
- **Weight** (kg/lbs)
- **Age** (years)
- **Gender** (Male/Female/Other)
- **Activity Level** (Sedentary, Lightly Active, Moderately Active, Very Active, Extremely Active)

#### Fitness Goals
- **Weight Loss** (caloric deficit)
- **Bulking** (caloric surplus, high protein)
- **Cutting** (moderate deficit, high protein, low fat)
- **Maintenance** (maintain current weight)
- **Athletic Performance** (optimize for sports/training)

#### Regional/Dietary Preferences
- **Region** (for ingredient availability)
- **Dietary Restrictions** (vegetarian, vegan, gluten-free, etc.)
- **Allergens** to avoid
- **Cuisine Preferences**

### Nutritional Requirements Calculation

#### BMR (Basal Metabolic Rate) Calculation
Use **Mifflin-St Jeor Equation** (most accurate):

**For Men:**
```
BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
```

**For Women:**
```
BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
```

Alternative: **Harris-Benedict Equation** (older, still valid)
Alternative: **Katch-McArdle Formula** (requires body fat percentage, more accurate for lean individuals)

#### TDEE (Total Daily Energy Expenditure) Calculation
```
TDEE = BMR × Activity_Multiplier
```

**Activity Multipliers:**
- Sedentary (little/no exercise): 1.2
- Lightly Active (1-3 days/week): 1.375
- Moderately Active (3-5 days/week): 1.55
- Very Active (6-7 days/week): 1.725
- Extremely Active (physical job + training): 1.9

#### Goal-Based Caloric Adjustment
- **Weight Loss**: TDEE - 500 (0.5 kg/week loss) to TDEE - 1000 (1 kg/week loss)
- **Bulking**: TDEE + 300 to + 500
- **Cutting**: TDEE - 300 to - 500 (preserve muscle)
- **Maintenance**: TDEE

#### Macronutrient Distribution

**Standard Recommendations:**
- **Protein**: 1.6-2.2 g/kg body weight (higher for athletes/cutting)
- **Fats**: 20-35% of total calories (0.8-1g/kg minimum)
- **Carbohydrates**: Remaining calories

**Goal-Specific Adjustments:**
- **Bulking**: 40% carbs, 30% protein, 30% fat
- **Cutting**: 30% carbs, 40% protein, 30% fat
- **Endurance**: 50% carbs, 25% protein, 25% fat
- **Ketogenic**: 5% carbs, 25% protein, 70% fat

#### Micronutrient Requirements (DRI - Dietary Reference Intakes)
Use USDA recommendations:
- Vitamins (A, C, D, E, K, B-complex)
- Minerals (Calcium, Iron, Magnesium, Zinc, etc.)
- Fiber: 25-38g/day

---

## 3. Document Chunking Strategies

### Understanding Chunking for Recipe Data
Chunking is critical for RAG performance. For recipe and nutritional data, we need semantic coherence while maintaining searchability.


#### 2. **Document-Based Chunking** (SUPPLEMENTARY)
- **Structure-aware splitting**: Recipes have natural sections
  - Recipe title + metadata
  - Ingredient list
  - Cooking instructions (step-by-step)
  - Nutritional information
  - Tips/variations

**Implementation:**
```python
def chunk_recipe(recipe_dict):
    chunks = []
    
    # Chunk 1: Overview
    overview = f"""
    Recipe: {recipe_dict['title']}
    Cuisine: {recipe_dict['cuisine']}
    Prep Time: {recipe_dict['prep_time']}
    Cook Time: {recipe_dict['cook_time']}
    Servings: {recipe_dict['servings']}
    Difficulty: {recipe_dict['difficulty']}
    """
    
    # Chunk 2: Ingredients with measurements
    ingredients = "Ingredients:\n" + "\n".join(recipe_dict['ingredients'])
    
    # Chunk 3-N: Instructions (group 2-3 steps)
    instructions = group_instructions(recipe_dict['instructions'], n=3)
    
    # Final Chunk: Nutrition
    nutrition = format_nutrition_info(recipe_dict['nutrition'])
    
    return [overview, ingredients] + instructions + [nutrition]
```

2. **Add Context Metadata**
   ```python
   chunk = {
       "text": chunk_content,
       "recipe_id": recipe_id,
       "recipe_title": title,
       "section_type": "ingredients" | "instructions" | "nutrition",
       "cuisine": cuisine_type,
       "dietary_tags": ["vegan", "gluten-free"],
       "calories_per_serving": 450,
       "protein_g": 30,
       "carbs_g": 40,
       "fats_g": 15
   }
   ```

3. **Nutritional Data Handling**
   - Create separate chunks for detailed nutrition
   - Include summary nutrition in overview chunks
   - Enable filtering by nutritional ranges



### Top Embedding Models for RAG (2025)

Based on MTEB benchmarks and real-world performance, here are the recommended models:

#### Tier 1: Production-Ready Open Source

##### 1. **intfloat/e5-large-v2** ⭐ TOP RECOMMENDATION
- **Parameters**: 335M
- **Dimensions**: 1024
- **Performance**: Excellent on MTEB retrieval tasks
- **Advantages**:
  - Best balance of accuracy and speed
  - Strong semantic understanding
  - Supports prefix prompting ("query: " and "passage: ")
  - Well-maintained and documented
- **Use Case**: Primary embedding model for recipe and nutrition retrieval
- **Context Window**: 512 tokens

**Usage:**
```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('intfloat/e5-large-v2')

# For queries
query_embedding = model.encode("query: low carb chicken recipes", normalize_embeddings=True)

# For documents
doc_embedding = model.encode("passage: This grilled chicken recipe...", normalize_embeddings=True)
```

##### 2. **BAAI/bge-large-en-v1.5**
- **Parameters**: 335M
- **Dimensions**: 1024
- **Performance**: Top-tier on MTEB
- **Advantages**:
  - Excellent retrieval accuracy (85%+ in benchmarks)
  - Contrastive training with hard negatives
  - Strong for domain-specific fine-tuning
- **Considerations**: Slightly higher latency than e5-small

##### 3. **sentence-transformers/all-MiniLM-L6-v2**
- **Parameters**: 23M
- **Dimensions**: 384
- **Performance**: Very fast, good accuracy
- **Advantages**:
  - Lightweight (fast inference)
  - Low storage requirements
  - Good for prototyping and resource-constrained environments
- **Trade-off**: Lower accuracy than large models (acceptable for many use cases)

#### Tier 2: Specialized Models

##### 4. **Alibaba-NLP/gte-Qwen2-7B-instruct**
- **Parameters**: 7B
- **Dimensions**: 3584 (supports MRL for flexibility)
- **Performance**: #1 on MTEB multilingual, leading on MTEB-Code
- **Advantages**:
  - Instruction-aware
  - 32k context window
  - Apache 2.0 license
- **Considerations**: Requires more compute (200ms latency vs 30ms for smaller models)

##### 5. **NV-Embed-v2** (NVIDIA)
- **State-of-the-art**: Top performance across benchmarks
- **Considerations**: Larger model, higher resource requirements

#### Tier 3: Commercial APIs (for comparison)

- **OpenAI text-embedding-3-small**: Fast, reliable, 1536 dims
- **OpenAI text-embedding-3-large**: Highest accuracy, 3072 dims
- **Cohere Embed v3**: Competitive, 1024 dims

### Model Selection Decision Framework

**For this culinary assistant project:**

```python
# RECOMMENDED SETUP
primary_model = "intfloat/e5-large-v2"  # Best overall
fallback_model = "all-MiniLM-L6-v2"     # Fast queries/prototyping
```

**Reasoning:**
1. **e5-large-v2** offers best accuracy-to-speed ratio
2. Recipe/nutrition content isn't extremely long (512 tokens sufficient)
3. Open source allows fine-tuning on recipe-specific data
4. 1024 dimensions provide good semantic richness

### Fine-tuning Recommendations

For domain-specific improvements:

```python
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

# Load base model
model = SentenceTransformer('intfloat/e5-large-v2')

# Create training examples (query, positive, negative)
train_examples = [
    InputExample(texts=[
        'query: low carb dinner recipes',
        'passage: Keto grilled chicken with vegetables',  # positive
        'passage: Chocolate chip cookie recipe'           # negative
    ])
]

# Train with MultipleNegativesRankingLoss
train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=16)
train_loss = losses.MultipleNegativesRankingLoss(model)

model.fit(
    train_objectives=[(train_dataloader, train_loss)],
    epochs=3,
    warmup_steps=100
)
```

### Evaluation Metrics

Track these metrics:
- **NDCG@10**: Normalized Discounted Cumulative Gain
- **Recall@5**: Percentage of relevant docs in top 5
- **MRR**: Mean Reciprocal Rank
- **Latency**: Query time (target: <100ms)

---

## 5. Vector Databases

##### 1. **ChromaDB**
**Strengths:**
- Lightweight, easy to start
- Python-native
- Good for prototyping
- Free and open-source

**Considerations:**
- Limited production features
- Not ideal for scale >10M vectors
- Plan migration path for production

**Best For:**
- Rapid prototyping
- Development/testing
- Small-scale applications



### Recommendation for Culinary Assistant

```
Development/Prototype: ChromaDB
Production: Qdrant
Enterprise (if needed): Pinecone or Weaviate
```

**Reasoning:**
1. Recipe database likely 100k-5M vectors (manageable scale)
2. Need strong metadata filtering (nutrition ranges)
3. Cost-effectiveness important
4. Flexibility for hybrid search

---

## 6. Retrieval Pipeline Architecture

### Advanced RAG Pipeline Components

#### 6.1 Hybrid Search Strategy

Combine **Dense Retrieval** (semantic) + **Sparse Retrieval** (keyword) for optimal results.

**Why Hybrid Search:**
- Dense: Captures semantic meaning ("low calorie" matches "diet-friendly")
- Sparse (BM25): Catches exact matches ("quinoa", "turmeric")
- Fusion: Best of both worlds





**Alternative: Manual Fusion**

```python
# Separate queries
dense_results = client.search(collection_name="recipes", query_vector=dense_vector, limit=20)
sparse_results = bm25_search(query, limit=20)  # Traditional BM25

# Reciprocal Rank Fusion (RRF)
def reciprocal_rank_fusion(dense_results, sparse_results, k=60):
    scores = {}
    
    for rank, result in enumerate(dense_results):
        doc_id = result.id
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)
    
    for rank, result in enumerate(sparse_results):
        doc_id = result.id
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)
    
    # Sort by combined score
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)

fused_results = reciprocal_rank_fusion(dense_results, sparse_results)
```

#### 6.2 Reranking Stage

After initial retrieval, rerank results for precision.

**Cross-Encoder Reranker:**

```python
from sentence_transformers import CrossEncoder

# Load reranker model
reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

# Get top 20 from hybrid search
candidates = fused_results[:20]

# Rerank with query
pairs = [[query, doc.text] for doc in candidates]
scores = reranker.predict(pairs)

# Sort by reranker scores
reranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
final_results = [doc for doc, score in reranked[:5]]  # Top 5
```

**Alternative: ColBERT (Late Interaction)**
- More efficient than cross-encoders
- Token-level similarity scoring
- Better for production at scale

**Available Models:**
- `cross-encoder/ms-marco-MiniLM-L-6-v2` (fast, good)
- `cross-encoder/ms-marco-MiniLM-L-12-v2` (better accuracy)
- `BAAI/bge-reranker-large` (state-of-the-art)

#### 6.3 Complete Retrieval Pipeline

```python
class CulinaryRAGRetriever:
    def __init__(self, vector_db, embedding_model, reranker):
        self.vector_db = vector_db
        self.embedding_model = embedding_model
        self.reranker = reranker
    
    def retrieve(self, query, user_profile, top_k=5):
        # 1. Generate query embedding
        query_vector = self.embedding_model.encode(f"query: {query}")
        
        # 2. Build nutritional filters from user profile
        filters = self._build_filters(user_profile)
        
        # 3. Hybrid search (dense + sparse)
        candidates = self.vector_db.hybrid_search(
            query_vector=query_vector,
            filters=filters,
            limit=20  # Retrieve more for reranking
        )
        
        # 4. Rerank
        pairs = [[query, doc.text] for doc in candidates]
        scores = self.reranker.predict(pairs)
        
        # 5. Sort and return top_k
        reranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
        return [doc for doc, score in reranked[:top_k]]
    
    def _build_filters(self, user_profile):
        """Build filters based on user's nutritional needs"""
        calorie_target = user_profile['daily_calories'] / 3  # Per meal
        protein_target = user_profile['daily_protein_g'] / 3
        
        return Filter(
            must=[
                FieldCondition(
                    key="calories",
                    range={"gte": calorie_target * 0.8, "lte": calorie_target * 1.2}
                ),
                FieldCondition(
                    key="protein_g",
                    range={"gte": protein_target * 0.7}
                ),
                FieldCondition(
                    key="region_ingredients",
                    match={"value": user_profile['region']}
                )
            ],
            should=[
                FieldCondition(
                    key="dietary_tags",
                    match={"any": user_profile['dietary_preferences']}
                )
            ]
        )
```

#### 6.4 Query Enhancement

Improve retrieval with query expansion:

```python
def enhance_query(user_query, user_profile):
    """Add context from user profile to query"""
    
    goal_context = {
        "weight_loss": "low calorie, high protein, filling",
        "bulking": "high calorie, high protein, nutrient dense",
        "cutting": "lean protein, low fat, moderate carbs"
    }
    
    enhanced = f"{user_query} {goal_context[user_profile['goal']]}"
    
    # Add dietary constraints
    if user_profile.get('dietary_restrictions'):
        enhanced += f" {' '.join(user_profile['dietary_restrictions'])}"
    
    return enhanced
```

#### 6.5 Multi-Stage Retrieval Pipeline

```
Stage 1: Initial Broad Retrieval (Hybrid Search)
  ↓ ~100 candidates
Stage 2: Metadata Filtering (Nutrition, Dietary)
  ↓ ~20-30 candidates
Stage 3: Reranking (Cross-Encoder)
  ↓ ~10 candidates
Stage 4: Diversity & Final Selection
  ↓ Top 5 recipes
```

**Diversity Enhancement:**
```python
def ensure_diversity(candidates, diversity_field='cuisine'):
    """Ensure top results aren't all the same cuisine"""
    seen = set()
    diverse_results = []
    
    for candidate in candidates:
        value = candidate.payload.get(diversity_field)
        if value not in seen or len(diverse_results) < 2:
            diverse_results.append(candidate)
            seen.add(value)
        
        if len(diverse_results) >= 5:
            break
    
    return diverse_results
```


## 7. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│  (Web/Mobile App with profile setup and recipe display) │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  API Gateway / Backend                   │
│  - User profile management                               │
│  - BMR/TDEE calculation                                  │
│  - Query processing                                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                 RAG Pipeline Layer                       │
│                                                          │
│  1. Query Enhancement                                    │
│     - Add user profile context                           │
│     - Expand with synonyms                               │
│                                                          │
│  2. Embedding Generation                                 │
│     - free text embedingmodel                                 │
│     - Dense + Sparse vectors                             │
│                                                          │
│  3. Vector Search (Qdrant)                               │
│     - Hybrid search (semantic + keyword)                 │
│     - Metadata filtering (nutrition, region)             │
│                                                          │
│  4. Reranking                                            │
│     - Cross-encoder scoring                              │
│     - Diversity filtering                                │
│                                                          │
│  5. Response Generation                                  │
│     - LLM summarization                      │
│     - Recipe formatting                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                    Data Storage                          │
│                                                          │
│  - Chroma Vector DB (recipes, embeddings, metadata)     │
│  - Mongo DB (user profiles, preferences, history)      │
│  - USDA API (real-time nutritional data)                 │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Query: "low carb dinner ideas"
        ↓
1. Profile Context Added: "low carb dinner ideas, target: 400-500 cal, 
   high protein, user prefers Mediterranean, location: Italy"
        ↓
2. Embeddings Generated:
   - Dense: [0.234, -0.567, ..., 0.891]  (1024-dim)
   - Sparse: {carb: 0.9, dinner: 0.8, protein: 0.7}
        ↓
3. Vector Search (Qdrant):
   - Query with filters: 300-600 cal, >25g protein, region: Europe
   - Hybrid search: returns 20 candidates
        ↓
4. Reranking:
   - Cross-encoder scores each recipe
   - Sort by relevance
        ↓
5. Final Results (Top 5):
   Recipe A: Greek Chicken Salad (420 cal, 35g protein, 8g net carbs)
   Recipe B: Italian Zucchini Boats (380 cal, 28g protein, 12g net carbs)
   ...
```

---




```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

@app.post("/user/profile")
async def create_user_profile(profile: UserProfile):
    """Create or update user profile with nutritional calculations"""
    calculator = NutritionCalculator()
    # Calculate BMR, TDEE, macros
    # Store in database
    return calculated_profile

@app.post("/recipes/search")
async def search_recipes(query: RecipeQuery):
    """Search recipes based on query and user profile"""
    user_profile = get_user_profile(query.user_id)
    results = retriever.retrieve(
        query=query.text,
        user_profile=user_profile,
        top_k=10
    )
    return format_results(results)

@app.get("/recipes/{recipe_id}")
async def get_recipe_details(recipe_id: str):
    """Get full recipe details with nutritional breakdown"""
    return get_recipe_from_db(recipe_id)

@app.post("/meal-plan/generate")
async def generate_meal_plan(request: MealPlanRequest):
    """Generate daily or weekly meal plan"""
    user_profile = get_user_profile(request.user_id)
    meal_plan = generate_optimized_meal_plan(
        user_profile=user_profile,
        days=request.days,
        meals_per_day=request.meals_per_day
    )
    return meal_plan
```


# RAG Framework: LangChain
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Qdrant
from langchain.chains import RetrievalQA


### Research Papers
1. "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" (Lewis et al., 2020)
2. "BERT: Pre-training of Deep Bidirectional Transformers" (Devlin et al., 2019)
3. "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks" (Reimers & Gurevych, 2019)

### Documentation
- USDA FoodData Central API: https://fdc.nal.usda.gov/api-guide.html
- Qdrant Documentation: https://qdrant.tech/documentation/
- Sentence Transformers: https://www.sbert.net/
- LangChain: https://python.langchain.com/docs/

### Benchmarks
- MTEB Leaderboard: https://huggingface.co/spaces/mteb/leaderboard
- VectorDBBench: https://github.com/zilliztech/VectorDBBench

---

## Conclusion

This comprehensive research provides a solid foundation for building a personalized culinary assistant using RAG. The key technical decisions are:

1. **Data**: RecipeNLG + USDA API
2. **Chunking**: Hybrid (document-based + semantic)
3. **Embeddings**: intfloat/e5-large-v2
4. **Vector DB**: Qdrant
5. **Retrieval**: Hybrid search + cross-encoder reranking
6. **Personalization**: BMR/TDEE calculations with macro-based filtering

The system will provide fast, accurate, and personalized recipe recommendations while respecting regional ingredient availability and individual nutritional needs. Start with Phase 1 (data preparation) and iterate through the roadmap, continuously evaluating and optimizing based on user feedback and performance metrics.

---

**Project Timeline**: 8-10 weeks
**Team Size**: 2-3 developers
**Recommended Tech Stack**: Python, FastAPI, React, Qdrant, PostgreSQL
**Estimated Cost**: $250-450/month in cloud infrastructure (moderate scale)
