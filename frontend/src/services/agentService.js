// Frontend AI Agent Service
// Demo mode until backend integration.

export async function getAgentReply(agentName, message) {
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (!message || !message.trim()) {
    throw new Error("Please enter a message.");
  }

  return `${agentName} received your message: "${message}". This is a demo response. Real AI responses will be available after backend integration.`;
}
