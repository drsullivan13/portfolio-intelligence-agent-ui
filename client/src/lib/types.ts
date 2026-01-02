export interface EventAnalysis {
  summary: string;
  key_insights: string[];
  impact_assessment: {
    market_implications: string;
    financial_impact: string;
    strategic_significance: string;
  };
  related_context: string;
  investigation_areas: string[];
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface Event {
  event_id: string;
  ticker: string;
  event_type: 'NEWS' | 'SEC_FILING';
  timestamp: string; // ISO 8601
  headline: string;
  url: string;
  sentiment_score?: number; // -1 to 1
  status: 'PENDING_ANALYSIS' | 'ANALYZED' | 'FAILED';
  summary?: string;
  
  // SEC Filing specific fields
  items_reported?: string;
  primary_item?: string;
  content_summary?: string;
  
  // Analysis fields
  analysis?: EventAnalysis;
  detected_at: string;
  analyzed_at?: string;
  processing_metadata?: {
    similar_events_count: number;
    model_version: string;
  };
}

export interface PortfolioMetrics {
  total_events: number;
  events_by_type: {
    NEWS: number;
    SEC_FILING: number;
  };
  events_by_status: {
    PENDING_ANALYSIS: number;
    ANALYZED: number;
    FAILED: number;
  };
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  top_tickers: Array<{
    ticker: string;
    count: number;
  }>;
  recent_activity: Array<{
    date: string;
    count: number;
  }>;
}

export interface SimilarEvent {
  score: number;
  ticker: string;
  event_type: string;
  timestamp: string;
  headline: string;
  url: string;
}
