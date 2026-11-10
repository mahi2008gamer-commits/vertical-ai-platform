// VERTICAL AI PLATFORM
// AI Agent Service
// Supports conversation history and custom agent instructions.
// Demo mode until real AI backend/API is connected.

export async function getAgentReply(
  agentName,
  message,
  instructions = "",
  conversationHistory = []
) {
  await new Promise(resolve => setTimeout(resolve, 800));

  if (!message || !message.trim()) {
    throw new Error("Please enter a message.");
  }

  // Convert previous messages into API-friendly format.
  const history = Array.isArray(conversationHistory)
    ? conversationHistory
        .filter(item =>
          item &&
          ["user", "assistant"].includes(item.role) &&
          typeof item.text === "string"
        )
        .map(item => ({
          role: item.role,
          content: item.text
        }))
    : [];

  // Demo response.
  // Real AI API integration will replace this section.

  const previousCount = history.length;

  if (instructions && instructions.trim()) {
    return [
      `${agentName} received your message.`,
      "",
      `Your instructions: ${instructions}`,
      "",
      `Previous conversation messages available: ${previousCount}`,
      "",
      `Your latest message: ${message}`,
      "",
      "This is currently a demo response.",
      "Your conversation history is being prepared for AI integration.",
      "Connect a real AI backend/API to receive intelligent contextual responses."
    ].join("\n");
  }

  return [
    `${agentName} received your message.`,
    "",
    `Previous conversation messages available: ${previousCount}`,
    "",
    `Your latest message: ${message}`,
    "",
    "This is currently a demo response.",
    "Connect a real AI backend/API to receive intelligent contextual responses."
  ].join("\n");
}
