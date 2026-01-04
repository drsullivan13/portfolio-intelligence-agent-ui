import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { docClient, TABLE_NAME, WATCHLIST_TABLE_NAME, USER_EVENTS_TABLE_NAME } from "./lib/dynamodb";
import { ScanCommand, QueryCommand, GetCommand, PutCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { verifyPassword, requireAuth, getCurrentUser } from "./auth";
import { z } from "zod";

// Initialize Lambda client for backfill invocations
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

const authSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Helper to batch-get events efficiently
async function batchGetEvents(eventIds: string[]) {
  if (eventIds.length === 0) return [];

  const batches = chunkArray(eventIds, 100); // DynamoDB limit
  const allEvents = [];

  for (const batch of batches) {
    const response = await docClient.send(new BatchGetCommand({
      RequestItems: {
        [TABLE_NAME]: {
          Keys: batch.map(id => ({ event_id: id }))
        }
      }
    }));
    allEvents.push(...(response.Responses?.[TABLE_NAME] || []));
  }

  return allEvents;
}

// Helper to chunk arrays
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

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
  app.get("/api/events", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { ticker, status, limit = "100" } = req.query;

      let events: any[] = [];

      if (ticker) {
        // SECURITY: Query user-events to get only events this user is authorized to see
        const userEventsCommand = new QueryCommand({
          TableName: USER_EVENTS_TABLE_NAME,
          KeyConditionExpression: 'user_id = :userId',
          FilterExpression: 'ticker = :ticker',
          ExpressionAttributeValues: {
            ':userId': userId,
            ':ticker': ticker
          },
          ScanIndexForward: false,
          Limit: parseInt(limit as string) * 2 // Fetch more to account for filtering
        });

        const userEventsResponse = await docClient.send(userEventsCommand);
        const eventIds = userEventsResponse.Items?.map(item => item.event_id) || [];

        // Batch get event details from portfolio-events
        events = await batchGetEvents(eventIds);
      } else {
        // Query user-events junction table for user's events
        const userEventsCommand = new QueryCommand({
          TableName: USER_EVENTS_TABLE_NAME,
          KeyConditionExpression: 'user_id = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          },
          ScanIndexForward: false,
          Limit: parseInt(limit as string)
        });

        const userEventsResponse = await docClient.send(userEventsCommand);
        const eventIds = userEventsResponse.Items?.map(item => item.event_id) || [];

        // Batch get event details
        events = await batchGetEvents(eventIds);

        if (events.length === 0) {
          console.log("No events found for user:", userId);
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
  app.get("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId!;

      // SECURITY: First check if user has access to this event via junction table
      const userEventCommand = new GetCommand({
        TableName: USER_EVENTS_TABLE_NAME,
        Key: {
          user_id: userId,
          event_id: id
        }
      });

      const userEventResponse = await docClient.send(userEventCommand);

      if (!userEventResponse.Item) {
        return res.status(403).json({
          success: false,
          error: "Access denied"
        });
      }

      // User has access, now fetch the event details
      const eventCommand = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          event_id: id
        }
      });

      const eventResponse = await docClient.send(eventCommand);

      if (!eventResponse.Item) {
        return res.status(404).json({
          success: false,
          error: "Event not found"
        });
      }

      res.json({
        success: true,
        event: eventResponse.Item
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
  app.get("/api/portfolio", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;

      // Query user-events junction table
      const userEventsCommand = new QueryCommand({
        TableName: USER_EVENTS_TABLE_NAME,
        KeyConditionExpression: 'user_id = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false
      });

      const userEventsResponse = await docClient.send(userEventsCommand);
      const eventIds = userEventsResponse.Items?.map(item => item.event_id) || [];

      // Batch get event details
      const events = await batchGetEvents(eventIds);

      if (events.length === 0) {
        console.log("No events found for user in portfolio:", userId);
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

  // GET /api/users/current - Get current user
  app.get("/api/users/current", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await getStorage().getUser(userId);
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

  // GET /api/watchlist - Get user's watchlist
  app.get("/api/watchlist", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      console.log(`[Watchlist] Fetching watchlist for user: ${userId}, table: ${WATCHLIST_TABLE_NAME}`);
      
      const command = new GetCommand({
        TableName: WATCHLIST_TABLE_NAME,
        Key: {
          user_id: userId
        }
      });
      
      const response = await docClient.send(command);
      console.log(`[Watchlist] DynamoDB response:`, JSON.stringify(response.Item || 'NO_ITEM_FOUND'));
      
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
  app.put("/api/watchlist", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { tickers, webhook_url } = req.body;

      if (!Array.isArray(tickers)) {
        return res.status(400).json({
          success: false,
          error: "Tickers must be an array"
        });
      }

      // Validate webhook URL format if provided
      if (webhook_url !== null && webhook_url !== undefined && webhook_url !== '') {
        if (typeof webhook_url !== 'string') {
          return res.status(400).json({
            success: false,
            error: "Webhook URL must be a string"
          });
        }

        // Basic URL validation
        try {
          new URL(webhook_url);
          if (!webhook_url.startsWith('https://hooks.slack.com/')) {
            return res.status(400).json({
              success: false,
              error: "Invalid Slack webhook URL format. Must start with https://hooks.slack.com/"
            });
          }
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: "Invalid webhook URL format"
          });
        }
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
          webhook_url: webhook_url || null,
          updated_at: now,
          created_at: createdAt
        }
      });
      
      await docClient.send(putCommand);

      // Determine which tickers were added
      const oldTickers = existing.Item?.tickers?.map((t: any) =>
        typeof t === 'string' ? t : t.symbol
      ) || [];
      const newTickerSymbols = tickers.map((t: any) =>
        typeof t === 'string' ? t : t.symbol
      );
      const addedTickers = newTickerSymbols.filter((ticker: string) =>
        !oldTickers.includes(ticker)
      );
      const removedTickers = oldTickers.filter((ticker: string) =>
        !newTickerSymbols.includes(ticker)
      );

      console.log(`Watchlist updated for user: ${userId}`);
      console.log(`Added tickers: ${addedTickers.length ? addedTickers.join(', ') : 'none'}`);
      console.log(`Removed tickers: ${removedTickers.length ? removedTickers.join(', ') : 'none'}`);

      // If tickers were added, trigger backfill/detection Lambda asynchronously
      if (addedTickers.length > 0) {
        try {
          console.log(`Triggering backfill Lambda for ${addedTickers.length} added tickers`);

          await lambdaClient.send(new InvokeCommand({
            FunctionName: 'event-detector-backfill',
            InvocationType: 'Event', // Async invocation (fire and forget)
            Payload: JSON.stringify({
              userId: userId,
              addedTickers: addedTickers,
              removedTickers: removedTickers
            })
          }));

          console.log(`Backfill Lambda invoked successfully`);
        } catch (backfillError) {
          console.error('Failed to trigger backfill Lambda:', backfillError);
          // Don't fail the watchlist update if backfill fails
          // User's watchlist is still updated correctly
        }
      }

      res.json({
        success: true,
        watchlist: {
          user_id: userId,
          tickers: tickers,
          webhook_url: webhook_url || null,
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

  // POST /api/watchlist/test-webhook - Test a Slack webhook
  app.post("/api/watchlist/test-webhook", requireAuth, async (req, res) => {
    try {
      const { webhook_url } = req.body;

      if (!webhook_url || typeof webhook_url !== 'string') {
        return res.status(400).json({
          success: false,
          error: "Webhook URL is required"
        });
      }

      // Validate URL format
      try {
        new URL(webhook_url);
        if (!webhook_url.startsWith('https://hooks.slack.com/')) {
          return res.status(400).json({
            success: false,
            error: "Invalid Slack webhook URL format. Must start with https://hooks.slack.com/"
          });
        }
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: "Invalid webhook URL format"
        });
      }

      // Send test message using axios (dynamically imported)
      const axios = (await import('axios')).default;

      const testMessage = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '✅ Webhook Test Successful',
              emoji: true
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Your Portfolio Intelligence Agent webhook is configured correctly! You will receive notifications here when new events are detected.'
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Test sent at <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} {time}|${new Date().toISOString()}>`
              }
            ]
          }
        ]
      };

      await axios.post(webhook_url, testMessage, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      res.json({
        success: true,
        message: "Test message sent successfully"
      });
    } catch (error: any) {
      console.error("Error testing webhook:", error);

      if (error.code === 'ECONNABORTED') {
        return res.status(408).json({
          success: false,
          error: "Webhook request timed out"
        });
      }

      if (error.response) {
        return res.status(400).json({
          success: false,
          error: `Slack returned error: ${error.response.status} - ${error.response.statusText}`
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to send test message to webhook"
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
