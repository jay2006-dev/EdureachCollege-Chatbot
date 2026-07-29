const BASE_URL = "http://127.0.0.1:5000/api";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { message: await response.text() };

    if (!response.ok) {
      throw new Error(data?.message || data?.error || "Request failed");
    }

    return data;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

export const api = {
  post: (endpoint, body) =>
    request(endpoint, { method: "POST", body: JSON.stringify(body) }),
};
