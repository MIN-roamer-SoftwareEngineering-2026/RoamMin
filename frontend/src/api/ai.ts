import type { ApiResponse } from "../types";
import { http, unwrap } from "./http";

type Language = "en" | "zh";

export interface ItineraryRequest {
  destination: string;
  days: number;
  budget?: number;
  preferences?: string[];
  requirements?: string;
  language: Language;
}

export interface ItineraryDraft {
  destination: string;
  days: number;
  dailyItinerary: {
    day: number;
    title: string;
    activities: {
      name: string;
      description: string;
      estimatedCost: number | null;
    }[];
  }[];
  suggestions: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
  language: Language;
  travelContext?: string;
}

const config = { timeout: 65_000 };

export const aiApi = {
  generate: (input: ItineraryRequest) =>
    unwrap(
      http.post<ApiResponse<ItineraryDraft>>(
        "/ai/generate-itinerary",
        input,
        config,
      ),
    ),
  chat: (input: ChatRequest) =>
    unwrap(
      http.post<ApiResponse<{ reply: string }>>("/ai/chat", input, config),
    ),
};

export function aiErrorKey(reason: unknown) {
  const error = reason as { status?: number; code?: string } | null;
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
    return "aiErrorTimeout";
  }
  switch (error?.status) {
    case 400:
    case 413:
    case 415:
      return "aiErrorInput";
    case 429:
      return "aiErrorQuota";
    case 502:
      return "aiErrorOutput";
    case 503:
      return "aiErrorUnavailable";
    case 504:
      return "aiErrorTimeout";
    default:
      return "aiErrorRequest";
  }
}
