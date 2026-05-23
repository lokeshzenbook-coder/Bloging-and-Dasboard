export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  tags: string[];
  status: "draft" | "published";
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  views: number;
}

export interface AnalyticsDashboard {
  totals: {
    views: number;
    shares: number;
    subscribers: number;
    conversionRate: number;
  };
  dailyTimeline: Array<{
    date: string;
    views: number;
    shares: number;
    signups: number;
  }>;
  platformData: Array<{
    name: string;
    value: number;
  }>;
  deviceData: Array<{
    name: string;
    value: number;
  }>;
  topPosts: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    views: number;
    shares: number;
  }>;
}

export interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
  source?: string;
}

export interface IntegrationSettings {
  mailchimpEnabled: boolean;
  mailchimpApiKey: string;
  mailchimpAudienceId: string;
  sendgridEnabled: boolean;
  sendgridApiKey: string;
  sendgridSenderEmail: string;
}
