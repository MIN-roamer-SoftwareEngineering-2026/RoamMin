import type {
  ApiResponse,
  ChatReply,
  ChatRequest,
  ItineraryDraft,
  ItineraryRequest,
} from "../types";
import { http, unwrap } from "./http";

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
    unwrap(http.post<ApiResponse<ChatReply>>("/ai/chat", input, config)),
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
