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
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }
  
  const data = await response.json();
  return data.events;
}

export async function fetchEvent(id: string): Promise<Event> {
  const response = await fetch(`${API_BASE}/events/${id}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch event");
  }
  
  const data = await response.json();
  return data.event;
}

export async function fetchPortfolioMetrics(): Promise<PortfolioMetrics> {
  const response = await fetch(`${API_BASE}/portfolio`);
  
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
