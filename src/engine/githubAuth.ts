const SUPABASE_URL = "https://xblqghhhchffuqkmzgta.supabase.co";
const SUPABASE_KEY = "sb_publishable__TDF6zsAZEvsWgSkAntJgw_qxYYuUop";
const TOKEN_KEY = "ingredora.github.access";
const REFRESH_KEY = "ingredora.github.refresh";
const EXPIRY_KEY = "ingredora.github.expiry";

function saveSession(session: { access_token: string; refresh_token?: string; expires_in?: number }) {
  localStorage.setItem(TOKEN_KEY, session.access_token);
  if (session.refresh_token) localStorage.setItem(REFRESH_KEY, session.refresh_token);
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + (session.expires_in ?? 3600) * 1000));
}

export function consumeGithubCallback() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  if (accessToken) {
    saveSession({
      access_token: accessToken,
      refresh_token: params.get("refresh_token") ?? undefined,
      expires_in: Number(params.get("expires_in") || 3600),
    });
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  }
  const error = params.get("error_description") || params.get("error");
  if (error) window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  return error;
}

export function startGithubLogin() {
  const redirectTo = window.location.origin + window.location.pathname + window.location.search;
  const url = new URL(SUPABASE_URL + "/auth/v1/authorize");
  url.searchParams.set("provider", "github");
  url.searchParams.set("redirect_to", redirectTo);
  url.searchParams.set("scopes", "read:user user:email");
  url.searchParams.set("response_type", "token");
  window.location.assign(url.toString());
}

export async function getGithubAccessToken(): Promise<string | null> {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const expiresAt = Number(localStorage.getItem(EXPIRY_KEY) || 0);
  if (expiresAt > Date.now() + 60_000) return token;

  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) {
    clearGithubSession();
    return null;
  }
  const response = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) {
    clearGithubSession();
    return null;
  }
  const session = await response.json();
  if (!session.access_token) {
    clearGithubSession();
    return null;
  }
  saveSession(session);
  token = session.access_token;
  return token;
}

export function clearGithubSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

export async function isAuthorizedGithubUser(token: string): Promise<boolean> {
  const response = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + token },
  });
  if (!response.ok) return false;
  const user = await response.json();
  const githubIdentity = Array.isArray(user.identities)
    ? user.identities.find((identity: { provider?: string; identity_data?: { login?: string; user_name?: string } }) => identity.provider === "github")
    : null;
  return githubIdentity?.identity_data?.login === "matibh" || githubIdentity?.identity_data?.user_name === "matibh";
}
