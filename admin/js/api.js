/* Talks to /admin/api. Sends the CSRF token on every change and reports a signed-out session once. */
let csrf = "";
let onSignedOut = () => {};

export const setCsrf = (t) => { csrf = t || ""; };
export const whenSignedOut = (fn) => { onSignedOut = fn; };

export class ApiError extends Error {
  constructor(status, body) {
    super((body && body.message) || messageFor(status, body));
    this.status = status; this.body = body || {};
  }
}
function messageFor(status, body) {
  if (status === 0) return "Can't reach the server. Check your connection and try again.";
  if (status === 403 && body && body.error === "admins_only") return "Only admins can do that.";
  if (status === 403 && body && body.error === "bad_csrf") return "Your session changed in another tab. Reload the page and try again.";
  if (status === 404) return "That item doesn't exist anymore.";
  if (status === 429) return "Too many requests. Wait a moment and try again.";
  if (status >= 500) return "Something went wrong on the server. Try again in a moment.";
  return "That didn't work.";
}

export async function api(path, { method = "GET", body, query, raw } = {}) {
  let url = "/admin/api" + path;
  if (query) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== "") q.set(k, v);
    const s = q.toString();
    if (s) url += "?" + s;
  }
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["X-CSRF-Token"] = csrf;
  let res;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, credentials: "same-origin", cache: "no-store" });
  } catch (e) {
    throw new ApiError(0, null);
  }
  if (raw) return res;
  let data = null;
  try { data = await res.json(); } catch (e) { /* empty body */ }
  if (res.status === 401 && !path.startsWith("/login")) { onSignedOut(); throw new ApiError(401, data); }
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const get = (p, query) => api(p, { query });
export const post = (p, body) => api(p, { method: "POST", body: body || {} });
export const patch = (p, body) => api(p, { method: "PATCH", body });
export const put = (p, body) => api(p, { method: "PUT", body });
export const del = (p) => api(p, { method: "DELETE" });
