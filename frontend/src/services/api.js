// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:3000/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// export default api;











import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the access token to every request automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Catch 401 errors, refresh the token, and retry the request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.log("1. Interceptor caught an error:", error.response?.status);

    // If it's a 401 error and we haven't retried this request yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("2. It is a 401 error. Preparing to refresh...");
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        console.log("3. Refresh token from storage is:", refreshToken);
        console.log("refresh token",refreshToken);
        if (!refreshToken) {
          console.log("❌ NO REFRESH TOKEN FOUND IN STORAGE. Aborting.");
          throw new Error("No refresh token");}

        console.log("4. Sending request to backend to refresh token...");

        // Call your backend to get a new access token
        // We use axios directly here, NOT 'api', to avoid an infinite loop of 401s
        const response = await axios.post("http://localhost:3000/api/user/refresh-token", {
          refreshToken: refreshToken // Update this key to match whatever your backend expects (e.g., 'refreshToken' or 'token')
        });

        console.log("5. Backend responded to refresh request:", response.data);

        // Assuming your backend returns { accessToken: "new_token_here" }
        // Update this based on your actual backend response structure
        const newAccessToken = response.data.data.token;

        console.log("6. New access token extracted:", newAccessToken);

        // Save the new token
        localStorage.setItem("accessToken", newAccessToken);

        // Update the failed request with the new token and try again
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        console.log("7. Retrying the original /profile request...");
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh token is expired or invalid. Force logout.
        console.error("❌ Refresh process failed:", refreshError.message);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login"; // Redirect to login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;