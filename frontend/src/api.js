import axios from "axios";

const BASE_URL = "http://localhost:8001";

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 60000, // 60 seconds
});

// Attach token automatically to every request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("ff_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized error handling
axiosClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (!error.response) {
      return Promise.reject(
        new Error(
          "Cannot connect to server. Please make sure the backend is running on port 8001.",
        ),
      );
    }

    const { status, data, config } = error.response;
    let msg = `Server error (HTTP ${status})`;

    // Handle session expiration (401 Unauthorized)
    if (status === 401) {
      // Don't redirect if we're actually trying to login - allow the local catch to handle "Invalid email/password"
      if (config.url === "/auth/login") {
        msg = "Invalid email or password.";
      } else {
        // Clear auth state and redirect
        localStorage.removeItem("fitfork_user");
        localStorage.removeItem("ff_token");
        localStorage.removeItem("ff_profile");
        localStorage.removeItem("ff_nutrition");

        // Use window.location for a hard redirect since we're outside a component
        if (window.location.pathname !== "/login") {
          window.location.href = "/login?expired=true";
        }
        return Promise.reject(
          new Error("Session expired. Please log in again."),
        );
      }
    } else if (status === 422 && data.detail) {
      msg = Array.isArray(data.detail)
        ? data.detail.map((e) => e.msg).join(", ")
        : String(data.detail);
    } else if (status === 403) {
      msg = "You are not authorized to perform this action.";
    } else if (status === 400) {
      msg = data.detail || "Bad request. Please check your input.";
    } else if (status === 500) {
      msg = "Server error. Please try again in a moment.";
    } else if (data.detail) {
      msg = String(data.detail);
    }

    return Promise.reject(new Error(msg));
  },
);

export const api = {
  signup: (email, password, full_name) =>
    axiosClient
      .post("/auth/signup", { email, password, full_name })
      .then((r) => r.data),

  login: (email, password) => {
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);
    return axiosClient
      .post("/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
      .then((r) => r.data);
  },

  getMe: () => axiosClient.get("/user/me").then((r) => r.data),
  getProfile: () => axiosClient.get("/user/profile").then((r) => r.data),
  getNutrition: (profile) =>
    axiosClient.post("/user/nutrition", profile).then((r) => r.data),

  searchRecipes: (query, user_profile, top_k = 6) =>
    axiosClient
      .post("/search", { query, user_profile, top_k })
      .then((r) => r.data),

  getRecipe: (id) => axiosClient.get(`/recipes/${id}`).then((r) => r.data),

  getMealPlan: (user_profile, days = 7, meals_per_day = 3) =>
    axiosClient
      .post("/meal-plan", { user_profile, days, meals_per_day })
      .then((r) => r.data),

  getLatestMealPlan: () =>
    axiosClient.get("/meal-plan/latest").then((r) => r.data),

  // Google Calendar
  getGoogleAuthUrl: () => axiosClient.get("/auth/google").then((r) => r.data),

  getCalendarStatus: () =>
    axiosClient.get("/calendar/status").then((r) => r.data),

  syncToCalendar: (start_date, timezone = "Asia/Kolkata") =>
    axiosClient
      .post("/calendar/sync", { start_date, timezone })
      .then((r) => r.data),

  disconnectCalendar: () =>
    axiosClient.delete("/calendar/disconnect").then((r) => r.data),

  health: () => axiosClient.get("/health").then((r) => r.data),
};
