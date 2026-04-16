export interface GCPProject {
  projectId: string;
  name: string;
  lifecycleState?: string;
}

export interface GA4Property {
  name: string;          // "properties/XXXXXXX"
  displayName: string;
  propertyType?: string;
  account: string;
  createTime?: string;
  dataStreams?: number;
}

export interface BQLink {
  name: string;
  project: string;
  defaultDatasetLocation?: string;
  dailyExportEnabled?: boolean;
  streamingExportEnabled?: boolean;
}

export interface BQDiagnostic {
  linked: boolean;
  link?: BQLink;
  dataset?: string;        // analytics_XXXXXXX
  projectId?: string;
  latestDate?: string;
  canQuery?: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  eventCount?: number;
  oldestDate?: string;
  latestDate?: string;
  scanBytes?: number;
  error?: string;
}

export interface PropertySchema {
  propertyId: string;
  customDimensions: Array<{ name: string; scope: string; parameterName: string }>;
  customMetrics: Array<{ name: string; measurementUnit: string }>;
  detectedEventParams: string[];
  detectedUserProperties: string[];
  lastScannedAt: string;
}

export interface UserSession {
  email: string;
  selectedProjectId: string;
  selectedPropertyId: string;
  selectedPropertyName: string;
  selectedDataset: string;
  bqLinkStatus: 'linked' | 'not_linked' | 'fallback_api';
  onboardingCompleted: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  createdAt: string;
}

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  durationMs?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  propertyName: string;
  propertyId: string;
  bqLinkStatus: 'linked' | 'not_linked' | 'fallback_api';
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
