import { Event, PortfolioMetrics } from "./types";

const API_BASE = "/api";

export async function fetchEvents(params?: {
  ticker?: string;
  status?: string;
  limit?: number;
}): Promise<Event[]> {
  const queryParams = new URLSearchParams();
  if (params?.ticker) queryParams.append("ticker", params.ticker);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const url = `${API_BASE}/events${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const response = await fetch(url, {
    credentials: 'include', // Send cookies with request
  });

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  const data = await response.json();
  return data.events;
}

export async function fetchEvent(id: string): Promise<Event> {
  const response = await fetch(`${API_BASE}/events/${id}`, {
    credentials: 'include', // Send cookies with request
  });

  if (!response.ok) {
    throw new Error("Failed to fetch event");
  }

  const data = await response.json();
  return data.event;
}

export async function fetchPortfolioMetrics(): Promise<PortfolioMetrics> {
  const response = await fetch(`${API_BASE}/portfolio`, {
    credentials: 'include', // Send cookies with request
  });

  if (!response.ok) {
    throw new Error("Failed to fetch portfolio metrics");
  }

  const data = await response.json();
  return data.metrics;
}

export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  const response = await fetch(`${API_BASE}/health`);
  
  if (!response.ok) {
    throw new Error("Health check failed");
  }
  
  return response.json();
}

export interface WatchlistTicker {
  symbol: string;
  name: string;
  status: "Active" | "Inactive";
}

export interface Watchlist {
  user_id: string;
  tickers: WatchlistTicker[];
  updated_at: string | null;
  created_at: string | null;
}

export async function fetchWatchlist(): Promise<Watchlist> {
  const response = await fetch(`${API_BASE}/watchlist`, {
    credentials: 'include', // Send cookies with request
  });

  if (!response.ok) {
    throw new Error("Failed to fetch watchlist");
  }

  const data = await response.json();
  return data.watchlist;
}

export async function updateWatchlist(tickers: WatchlistTicker[]): Promise<Watchlist> {
  const response = await fetch(`${API_BASE}/watchlist`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: 'include', // Send cookies with request
    body: JSON.stringify({ tickers }),
  });

  if (!response.ok) {
    throw new Error("Failed to update watchlist");
  }

  const data = await response.json();
  return data.watchlist;
}

export interface CurrentUser {
  id: string;
  username: string;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await fetch(`${API_BASE}/users/current`, {
    credentials: 'include', // Send cookies with request
  });

  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }

  const data = await response.json();
  return data.user;
}
