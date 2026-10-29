export type ChatResponse = {
  answer: string;
  intent: string;
  sources: { id: string; title: string }[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
  sources?: ChatResponse["sources"];
  isError?: boolean;
};
