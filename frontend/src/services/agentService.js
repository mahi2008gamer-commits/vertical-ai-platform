// Frontend AI Agent Service
// Demo mode until backend integration.

export async function getAgentReply(agentName, message, instructions = "") {
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (!message || !message.trim()) {
    throw new Error("Please enter a message.");
  }

  if (instructions && instructions.trim()) {
    return `${agentName} is configured with your custom instructions:

"${instructions}"

Your message: "${message}"

This is a demo response. Real AI responses using these instructions will be available after backend integration.`;
  }

  return `${agentName} received your message: "${message}". This is a demo response. Real AI responses will be available after backend integration.`;
}
