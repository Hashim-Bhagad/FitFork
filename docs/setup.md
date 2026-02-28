# Setup & Installation Guide ⚙️

Follow these steps to get FitFork running on your local machine.

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **MongoDB**: A running instance (local or MongoDB Atlas).
- **Git**

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/FitFork.git
cd FitFork
```

## 2. Backend Setup (FastAPI)

Navigate to the backend directory and set up a virtual environment.

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
MONGODB_URL=mongodb://localhost:27017
DB_NAME=fitfork
OPEN_ROUTER_API_KEY=your_key_here
SCALEDOWN_API_KEY=your_key_here  # Optional
JWT_SECRET=your_random_secret

# Google Calendar (Google Cloud Console)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8001/auth/google/callback
```

### 3. Google Cloud Console Setup (Required for Sync)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project and enable the **Google Calendar API**.
3. Configure the **OAuth Consent Screen** (Internal or External/Testing).
4. Create **OAuth 2.0 Client IDs** (Web application).
5. Add `http://localhost:8001/auth/google/callback` to the **Authorized redirect URIs**.
6. Copy the Client ID and Secret to your `.env` file.

## 4. Run Backend

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

## 3. Frontend Setup (React + Vite)

Open a new terminal and navigate to the frontend directory.

```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

## 4. Troubleshooting

- **Database Connection**: Ensure MongoDB is running before starting the backend.
- **API Keys**: Ensure `OPEN_ROUTER_API_KEY` is valid to allow the RAG engine to generate responses.
- **CORS**: If the frontend cannot reach the backend, check the `CORSMiddleware` configuration in `backend/app/main.py`.
