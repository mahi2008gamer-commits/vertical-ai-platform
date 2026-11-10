
// Frontend AI Agent Service
// Demo mode until backend integration.

export async function getAgentReply(
  agentName,
  message,
  instructions = "",
  conversationHistory = []
) {
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (!message || !message.trim()) {
    throw new Error("Please enter a message.");
  }

  const previousMessages = Array.isArray(conversationHistory)
    ? conversationHistory
        .filter((item) => item && item.content)
        .map((item) => ({
          role: item.role,
          content: item.content,
        }))
    : [];

  const contextText = previousMessages.length
    ? previousMessages
        .map((item) => `${item.role}: ${item.content}`)
        .join("\n")
    : "No previous conversation.";

  return `${agentName} Demo Agent

${instructions ? `Agent Instructions:\n${instructions}\n\n` : ""}Previous Conversation:
${contextText}

New Message:
${message}

This is a demo response. Real AI responses will be available after backend integration.`;
}
