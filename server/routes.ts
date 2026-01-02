import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { docClient, TABLE_NAME } from "./lib/dynamodb";
import { ScanCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // GET /api/events - Fetch all events with optional filtering
  app.get("/api/events", async (req, res) => {
    try {
      const { ticker, status, limit = "50" } = req.query;
      
      let command;
      
      if (ticker) {
        // Use GSI to query by ticker
        command = new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "ticker-timestamp-index",
          KeyConditionExpression: "ticker = :ticker",
          ExpressionAttributeValues: {
            ":ticker": ticker
          },
          ScanIndexForward: false, // Sort descending by timestamp
          Limit: parseInt(limit as string)
        });
      } else {
        // Scan all events
        command = new ScanCommand({
          TableName: TABLE_NAME,
          Limit: parseInt(limit as string)
        });
      }
      
      const response = await docClient.send(command);
      let events = response.Items || [];
      
      // Filter by status if provided
      if (status) {
        events = events.filter(event => event.status === status);
      }
      
      // Sort by timestamp descending
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      res.json({
        success: true,
        count: events.length,
        events
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch events"
      });
    }
  });

  // GET /api/events/:id - Fetch single event by ID
  app.get("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          event_id: id
        }
      });
      
      const response = await docClient.send(command);
      
      if (!response.Item) {
        return res.status(404).json({
          success: false,
          error: "Event not found"
        });
      }
      
      res.json({
        success: true,
        event: response.Item
      });
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch event"
      });
    }
  });

  // GET /api/portfolio - Calculate portfolio metrics
  app.get("/api/portfolio", async (req, res) => {
    try {
      const command = new ScanCommand({
        TableName: TABLE_NAME
      });
      
      const response = await docClient.send(command);
      const events = response.Items || [];
      
      // Calculate metrics
      const metrics = {
        total_events: events.length,
        events_by_type: {
          NEWS: events.filter(e => e.event_type === 'NEWS').length,
          SEC_FILING: events.filter(e => e.event_type === 'SEC_FILING').length
        },
        events_by_status: {
          PENDING_ANALYSIS: events.filter(e => e.status === 'PENDING_ANALYSIS').length,
          ANALYZED: events.filter(e => e.status === 'ANALYZED').length,
          FAILED: events.filter(e => e.status === 'FAILED').length
        },
        sentiment_distribution: {
          positive: events.filter(e => e.sentiment_score && e.sentiment_score > 0.2).length,
          neutral: events.filter(e => e.sentiment_score && e.sentiment_score >= -0.2 && e.sentiment_score <= 0.2).length,
          negative: events.filter(e => e.sentiment_score && e.sentiment_score < -0.2).length
        },
        top_tickers: calculateTopTickers(events),
        recent_activity: calculateRecentActivity(events)
      };
      
      res.json({
        success: true,
        metrics
      });
    } catch (error) {
      console.error("Error fetching portfolio metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch portfolio metrics"
      });
    }
  });

  // GET /api/users/current - Get current user (admin for now)
  app.get("/api/users/current", async (req, res) => {
    try {
      const user = await storage.getUser("admin-001");
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "No user found"
        });
      }
      
      // Don't expose password
      const { password, ...safeUser } = user;
      res.json({
        success: true,
        user: safeUser
      });
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user"
      });
    }
  });

  // GET /api/users - Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't expose passwords
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json({
        success: true,
        users: safeUsers
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch users"
      });
    }
  });

  // GET /api/health - Health check
  app.get("/api/health", async (req, res) => {
    try {
      // Try to scan with limit 1 to verify connection
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        Limit: 1
      });
      
      await docClient.send(command);
      
      res.json({
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  return httpServer;
}

// Helper function to calculate top tickers
function calculateTopTickers(events: any[]) {
  const tickerCounts: Record<string, number> = {};
  
  events.forEach(event => {
    if (event.ticker) {
      tickerCounts[event.ticker] = (tickerCounts[event.ticker] || 0) + 1;
    }
  });
  
  return Object.entries(tickerCounts)
    .map(([ticker, count]) => ({ ticker, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// Helper function to calculate recent activity (last 7 days)
function calculateRecentActivity(events: any[]) {
  const now = new Date();
  const activityByDate: Record<string, number> = {};
  
  // Initialize last 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    activityByDate[dateStr] = 0;
  }
  
  // Count events per day
  events.forEach(event => {
    if (event.timestamp) {
      const dateStr = event.timestamp.split('T')[0];
      if (activityByDate.hasOwnProperty(dateStr)) {
        activityByDate[dateStr]++;
      }
    }
  });
  
  return Object.entries(activityByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
