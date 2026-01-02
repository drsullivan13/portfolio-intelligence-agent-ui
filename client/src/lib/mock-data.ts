import { Event, PortfolioMetrics } from "./types";
import { subHours, subDays } from "date-fns";

const now = new Date();

export const mockEvents: Event[] = [
  {
    event_id: "a1b2c3d4e5f6g7h8",
    ticker: "NVDA",
    event_type: "NEWS",
    timestamp: subHours(now, 2).toISOString(),
    headline: "NVIDIA Announces Next-Generation AI Chips at CES 2025",
    url: "https://example.com/nvda-ces-2025",
    sentiment_score: 0.85,
    status: "ANALYZED",
    summary: "NVIDIA unveiled its next-generation Blackwell Ultra architecture...",
    analysis: {
      summary: "NVIDIA unveiled its next-generation Blackwell Ultra architecture at CES 2025, promising 4x performance improvements for AI training workloads. This announcement reinforces NVIDIA's dominant position in the AI accelerator market.",
      key_insights: [
        "Blackwell Ultra delivers 4x performance improvement over previous generation",
        "New architecture specifically optimized for trillion-parameter models",
        "Major cloud providers announced day-one availability",
        "Pricing positioned 20% higher than current generation"
      ],
      impact_assessment: {
        market_implications: "Reinforces NVIDIA's AI leadership and creates higher barriers to entry for AMD/Intel competition",
        financial_impact: "Higher ASPs could expand gross margins; strong hyperscaler demand signals robust Q1 datacenter revenue",
        strategic_significance: "Demonstrates continued R&D execution and maintains 18-month lead over competitors"
      },
      related_context: "Follows similar product announcements and positions NVIDIA ahead of AMD's MI400 launch expected in Q2.",
      investigation_areas: [
        "Verify hyperscaler volume commitments and delivery timelines",
        "Analyze competitive response from AMD MI400 roadmap",
        "Review supply chain capacity for new node production"
      ],
      confidence_level: "HIGH"
    },
    detected_at: subHours(now, 2).toISOString(),
    analyzed_at: subHours(now, 1.9).toISOString(),
    processing_metadata: {
      similar_events_count: 7,
      model_version: "claude-sonnet-4-5-20250929"
    }
  },
  {
    event_id: "sec-0001193125-25-000123",
    ticker: "TSLA",
    event_type: "SEC_FILING",
    timestamp: subHours(now, 5).toISOString(),
    headline: "8-K Filing: Item 5.02 - Officer/Director Changes",
    url: "https://www.sec.gov/Archives/edgar/data/...",
    status: "ANALYZED",
    items_reported: "5.02, 9.01",
    primary_item: "5.02",
    analysis: {
      summary: "Tesla filed an 8-K announcing the departure of the Chief Financial Officer, effective immediately. The company appointed an interim CFO from within the finance organization.",
      key_insights: [
        "CFO departure was unexpected based on recent earnings call tone",
        "Interim appointment suggests permanent search underway",
        "Filing language indicates standard transition, not termination for cause"
      ],
      impact_assessment: {
        market_implications: "C-suite turnover typically creates short-term uncertainty; watch for analyst downgrades",
        financial_impact: "No immediate financial impact, but may affect Q1 guidance credibility",
        strategic_significance: "Leadership continuity important during Cybertruck ramp and margin pressure"
      },
      related_context: "Third executive departure in 6 months following VP of Engineering and Head of Autopilot.",
      investigation_areas: [
        "Research departing CFO's tenure and prior statements",
        "Monitor for follow-on departures",
        "Track analyst rating changes over next 48 hours"
      ],
      confidence_level: "MEDIUM"
    },
    detected_at: subHours(now, 5).toISOString(),
    analyzed_at: subHours(now, 4.9).toISOString(),
    processing_metadata: {
      similar_events_count: 3,
      model_version: "claude-sonnet-4-5-20250929"
    }
  },
  {
    event_id: "pending-news-001",
    ticker: "AAPL",
    event_type: "NEWS",
    timestamp: subHours(now, 0.5).toISOString(),
    headline: "Apple Reportedly in Talks to Acquire AI Startup for $1B",
    url: "https://example.com/apple-ai-acquisition",
    sentiment_score: 0.42,
    status: "PENDING_ANALYSIS",
    summary: "Apple is reportedly in advanced negotiations to acquire an AI startup...",
    detected_at: subHours(now, 0.5).toISOString()
  },
  {
    event_id: "news-msft-002",
    ticker: "MSFT",
    event_type: "NEWS",
    timestamp: subDays(now, 1).toISOString(),
    headline: "Microsoft Azure Revenue Growth Slows Slightly in Q2",
    url: "https://example.com/msft-earnings",
    sentiment_score: -0.15,
    status: "ANALYZED",
    analysis: {
      summary: "Microsoft reported Q2 earnings with Azure revenue growth of 28%, slightly missing analyst expectations of 29%. However, AI contribution to growth increased.",
      key_insights: [
        "Azure growth deceleration concerns investors",
        "AI services now contribute 8 points to growth",
        "Capital expenditure guidance raised for AI infrastructure"
      ],
      impact_assessment: {
        market_implications: "May cause short-term stock dip; creates buying opportunity if long-term AI thesis holds",
        financial_impact: "Margins slightly compressed due to high AI investement",
        strategic_significance: "Confirm's aggressive investment phase in AI transition"
      },
      related_context: "Similar to Google Cloud's recent deceleration.",
      investigation_areas: [
        "Listen to earnings call for guidance updates",
        "Compare with AWS growth rates"
      ],
      confidence_level: "HIGH"
    },
    detected_at: subDays(now, 1).toISOString(),
    analyzed_at: subDays(now, 1).toISOString()
  },
  {
    event_id: "sec-googl-003",
    ticker: "GOOGL",
    event_type: "SEC_FILING",
    timestamp: subDays(now, 2).toISOString(),
    headline: "10-Q Filing: Quarterly Report",
    url: "https://sec.gov/...",
    status: "ANALYZED",
    items_reported: "N/A",
    primary_item: "10-Q",
    analysis: {
      summary: "Alphabet Inc. filed its quarterly report on Form 10-Q. No major surprises in the risk factors or legal proceedings sections.",
      key_insights: [
        "Legal reserves remain stable",
        "Headcount reduction pace has slowed",
        "Cloud segment achieved profitability milestone"
      ],
      impact_assessment: {
        market_implications: "Neutral to positive as it confirms operational discipline",
        financial_impact: "Improved operating margins driven by cost cuts",
        strategic_significance: "Shows maturity of Cloud business"
      },
      related_context: "Follows strong earnings release.",
      investigation_areas: [
        "Deep dive into 'Other Bets' spending",
        "Monitor regulatory disclosures"
      ],
      confidence_level: "HIGH"
    },
    detected_at: subDays(now, 2).toISOString(),
    analyzed_at: subDays(now, 2).toISOString()
  },
  {
    event_id: "news-tsla-004",
    ticker: "TSLA",
    event_type: "NEWS",
    timestamp: subHours(now, 24).toISOString(),
    headline: "Tesla Cybertruck Production Hits 1000 Units Per Week",
    url: "https://example.com/cybertruck-ramp",
    sentiment_score: 0.65,
    status: "ANALYZED",
    analysis: {
      summary: "Internal memo leaks indicate Tesla has reached a production rate of 1000 Cybertrucks per week at Giga Texas.",
      key_insights: [
        "Ramp proceeding faster than some bear cases",
        "Still below 250k annual target run rate",
        "Quality control reports remain mixed"
      ],
      impact_assessment: {
        market_implications: "Positive sentiment for execution",
        financial_impact: "Cash burn may improve as overhead is absorbed",
        strategic_significance: "Crucial for 2026 growth story"
      },
      related_context: "Previous guidance suggested this milestone would be hit next month.",
      investigation_areas: [
        "Verify with VIN registration data",
        "Check supplier delivery schedules"
      ],
      confidence_level: "MEDIUM"
    },
    detected_at: subHours(now, 24).toISOString(),
    analyzed_at: subHours(now, 23.5).toISOString()
  },
  {
    event_id: "news-aapl-005",
    ticker: "AAPL",
    event_type: "NEWS",
    timestamp: subHours(now, 3).toISOString(),
    headline: "Analyst Downgrades Apple on iPhone China Weakness",
    url: "https://example.com/aapl-downgrade",
    sentiment_score: -0.4,
    status: "ANALYZED",
    analysis: {
      summary: "Top analyst firm downgrades AAPL to Neutral, citing 15% drop in iPhone sales in China year-over-year.",
      key_insights: [
        "Huawei competition intensifying",
        "Government ban impacts widening",
        "Services growth may not offset hardware decline"
      ],
      impact_assessment: {
        market_implications: "Pressure on stock price in near term",
        financial_impact: "Revenue headwinds in Greater China region",
        strategic_significance: "Need to accelerate India diversification"
      },
      related_context: "Second downgrade this week.",
      investigation_areas: [
        "Track weekly channel check data",
        "Monitor India manufacturing ramp"
      ],
      confidence_level: "HIGH"
    },
    detected_at: subHours(now, 3).toISOString(),
    analyzed_at: subHours(now, 2.8).toISOString()
  },
  {
    event_id: "sec-nvda-006",
    ticker: "NVDA",
    event_type: "SEC_FILING",
    timestamp: subDays(now, 3).toISOString(),
    headline: "4 Filing: Insider Trading",
    url: "https://sec.gov/...",
    status: "PENDING_ANALYSIS",
    items_reported: "4",
    primary_item: "4",
    detected_at: subDays(now, 3).toISOString()
  }
];

export const mockPortfolioMetrics: PortfolioMetrics = {
  total_events: 142,
  events_by_type: {
    NEWS: 98,
    SEC_FILING: 44
  },
  events_by_status: {
    PENDING_ANALYSIS: 12,
    ANALYZED: 128,
    FAILED: 2
  },
  sentiment_distribution: {
    positive: 45,
    neutral: 65,
    negative: 32
  },
  top_tickers: [
    { ticker: "NVDA", count: 42 },
    { ticker: "TSLA", count: 38 },
    { ticker: "AAPL", count: 25 },
    { ticker: "MSFT", count: 20 },
    { ticker: "GOOGL", count: 17 }
  ],
  recent_activity: [
    { date: "2025-01-02", count: 15 },
    { date: "2025-01-01", count: 12 },
    { date: "2024-12-31", count: 8 },
    { date: "2024-12-30", count: 22 },
    { date: "2024-12-29", count: 5 },
    { date: "2024-12-28", count: 4 },
    { date: "2024-12-27", count: 18 }
  ]
};
