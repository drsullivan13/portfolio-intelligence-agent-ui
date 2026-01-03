import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { docClient, TABLE_NAME, WATCHLIST_TABLE_NAME } from "./lib/dynamodb";
import { ScanCommand, QueryCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { verifyPassword, requireAuth, getCurrentUser } from "./auth";
import { z } from "zod";

const authSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ==================== AUTH ROUTES ====================
  
  // POST /api/auth/signup - Create new user account
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validation = authSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: validation.error.errors[0].message,
        });
      }

      const { username, password } = validation.data;
      const storage = getStorage();
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "Username already taken",
        });
      }

      // Create user with hashed password
      const user = await storage.createUserWithHashedPassword(username, password);

      // Create empty watchlist in DynamoDB for new user
      try {
        const putCommand = new PutCommand({
          TableName: WATCHLIST_TABLE_NAME,
          Item: {
            user_id: user.id,
            tickers: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        });
        await docClient.send(putCommand);
        console.log(`Created watchlist for new user: ${user.id}`);
      } catch (watchlistError) {
        console.error("Failed to create watchlist in DynamoDB:", watchlistError);
        // Don't fail signup if watchlist creation fails
      }

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;

      res.json({
        success: true,
        user: { id: user.id, username: user.username },
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create account",
      });
    }
  });

  // POST /api/auth/login - Authenticate user
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validation = authSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: validation.error.errors[0].message,
        });
      }

      const { username, password } = validation.data;
      const storage = getStorage();

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid username or password",
        });
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: "Invalid username or password",
        });
      }

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;

      res.json({
        success: true,
        user: { id: user.id, username: user.username },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to login",
      });
    }
  });

  // POST /api/auth/logout - End user session
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: "Failed to logout",
        });
      }
      res.json({ success: true });
    });
  });

  // GET /api/auth/me - Get current authenticated user
  app.get("/api/auth/me", (req, res) => {
    const user = getCurrentUser(req);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, error: "Not authenticated" });
    }
  });

  // ==================== PROTECTED ROUTES ====================
  
  // GET /api/events - Fetch all events with optional filtering
  app.get("/api/events", async (req, res) => {
    try {
      const userId = "admin-001"; // TODO: Get from authenticated user
      const { ticker, status, limit = "100" } = req.query;
      
      let command;
      let events: any[] = [];
      
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
        const response = await docClient.send(command);
        events = response.Items || [];
      } else {
        // Try to use user-timestamp-index GSI to get user's events
        try {
          command = new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "user-timestamp-index",
            KeyConditionExpression: "user_id = :userId",
            ExpressionAttributeValues: {
              ":userId": userId
            },
            ScanIndexForward: false, // Sort descending by timestamp
            Limit: parseInt(limit as string)
          });
          const response = await docClient.send(command);
          events = response.Items || [];
          
          // If no events found for user, fallback to scan
          if (events.length === 0) {
            console.log("No events found for user, falling back to scan");
            const scanCommand = new ScanCommand({
              TableName: TABLE_NAME,
              Limit: parseInt(limit as string)
            });
            const scanResponse = await docClient.send(scanCommand);
            events = scanResponse.Items || [];
          }
        } catch (gsiError) {
          // Fallback to scan if GSI doesn't exist yet
          console.log("Falling back to scan - user-timestamp-index error:", gsiError);
          command = new ScanCommand({
            TableName: TABLE_NAME,
            Limit: parseInt(limit as string)
          });
          const response = await docClient.send(command);
          events = response.Items || [];
        }
      }
      
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
      const userId = "admin-001"; // TODO: Get from authenticated user
      let events: any[] = [];
      
      // Try to use user-timestamp-index GSI to get user's events
      try {
        const command = new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "user-timestamp-index",
          KeyConditionExpression: "user_id = :userId",
          ExpressionAttributeValues: {
            ":userId": userId
          },
          ScanIndexForward: false
        });
        const response = await docClient.send(command);
        events = response.Items || [];
        
        // If no events found for user, fallback to scan
        if (events.length === 0) {
          console.log("No events found for user in portfolio, falling back to scan");
          const scanCommand = new ScanCommand({
            TableName: TABLE_NAME
          });
          const scanResponse = await docClient.send(scanCommand);
          events = scanResponse.Items || [];
        }
      } catch (gsiError) {
        // Fallback to scan if GSI doesn't exist yet
        console.log("Falling back to scan for portfolio metrics:", gsiError);
        const command = new ScanCommand({
          TableName: TABLE_NAME
        });
        const response = await docClient.send(command);
        events = response.Items || [];
      }
      
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
      const user = await getStorage().getUser("admin-001");
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
      const users = await getStorage().getAllUsers();
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

  // GET /api/watchlist - Get user's watchlist
  app.get("/api/watchlist", async (req, res) => {
    try {
      const userId = "admin-001"; // TODO: Get from authenticated user
      
      const command = new GetCommand({
        TableName: WATCHLIST_TABLE_NAME,
        Key: {
          user_id: userId
        }
      });
      
      const response = await docClient.send(command);
      
      if (!response.Item) {
        // Return empty watchlist if none exists
        return res.json({
          success: true,
          watchlist: {
            user_id: userId,
            tickers: [],
            updated_at: null,
            created_at: null
          }
        });
      }
      
      // Normalize tickers - convert strings to objects if needed
      let tickers = response.Item.tickers || [];
      tickers = tickers.map((ticker: any) => {
        if (typeof ticker === 'string') {
          // Convert legacy string format to object format
          return {
            symbol: ticker,
            name: ticker, // Use symbol as name for legacy data
            status: "Active" as const
          };
        }
        return ticker;
      });
      
      res.json({
        success: true,
        watchlist: {
          ...response.Item,
          tickers
        }
      });
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch watchlist"
      });
    }
  });

  // PUT /api/watchlist - Update user's watchlist
  app.put("/api/watchlist", async (req, res) => {
    try {
      const userId = "admin-001"; // TODO: Get from authenticated user
      const { tickers } = req.body;
      
      if (!Array.isArray(tickers)) {
        return res.status(400).json({
          success: false,
          error: "Tickers must be an array"
        });
      }
      
      const now = new Date().toISOString();
      
      // Get existing item to preserve created_at
      const getCommand = new GetCommand({
        TableName: WATCHLIST_TABLE_NAME,
        Key: { user_id: userId }
      });
      
      const existing = await docClient.send(getCommand);
      const createdAt = existing.Item?.created_at || now;
      
      const putCommand = new PutCommand({
        TableName: WATCHLIST_TABLE_NAME,
        Item: {
          user_id: userId,
          tickers: tickers,
          updated_at: now,
          created_at: createdAt
        }
      });
      
      await docClient.send(putCommand);
      
      res.json({
        success: true,
        watchlist: {
          user_id: userId,
          tickers: tickers,
          updated_at: now,
          created_at: createdAt
        }
      });
    } catch (error) {
      console.error("Error updating watchlist:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update watchlist"
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
