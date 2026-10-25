const EVENT = "open-ai-chat";

/** Mở popup MediCare AI của FloatingActions từ bất kỳ nơi nào */
export function openAiChat() {
  window.dispatchEvent(new Event(EVENT));
}

export const OPEN_AI_CHAT_EVENT = EVENT;