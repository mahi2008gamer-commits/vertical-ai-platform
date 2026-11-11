// VERTICAL AI PLATFORM - agent service
//
// This is the ONLY file that talks to a backend.
//
// Demo mode  : VITE_API_BASE_URL is empty -> replies are generated locally.
// Live mode  : VITE_API_BASE_URL is set   -> the request below is sent.
//
// The request/response format in backendReply() is a PROPOSAL, not a
// confirmed contract. When the backend developer shares the real API
// (see BACKEND_HANDOFF.md), only buildRequestBody(), the URL path and
// readReply() below need to change. App.jsx does not need to change.
//
// Never put API keys or secrets in the frontend. Keep them in the backend.

const API_BASE_URL = String(import.meta.env?.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 60000;

export function isBackendConfigured() {
  return API_BASE_URL.length > 0;
}

function toApiHistory(conversationHistory) {
  if (!Array.isArray(conversationHistory)) return [];

  return conversationHistory
    .filter(
      item =>
        item &&
        ["user", "assistant"].includes(item.role) &&
        typeof item.text === "string"
    )
    .map(item => ({ role: item.role, content: item.text }));
}

/* ---------------- DEMO MODE ---------------- */

async function demoReply(agentName, message, instructions, history) {
  await new Promise(resolve => setTimeout(resolve, 700));

  const lines = [
    `This is a demo reply from ${agentName}.`,
    "",
    "Real AI answers will appear here once the backend is connected.",
    "",
    `You asked: ${message}`
  ];

  if (instructions && instructions.trim()) {
    lines.push("", "Your custom instructions are saved with this agent and will be sent to the backend.");
  }

  if (history.length > 0) {
    lines.push("", `Earlier messages in this conversation: ${history.length}`);
  }

  return lines.join("\n");
}

/* ---------------- LIVE MODE (proposed contract) ---------------- */

// PROPOSED request:  POST {VITE_API_BASE_URL}/chat
// {
//   "agent_name": "Finance Advisor",
//   "message": "How do I plan a budget?",
//   "instructions": "",                       // custom agents only
//   "history": [ { "role": "user" | "assistant", "content": "..." } ]
// }
function buildRequestBody(agentName, message, instructions, history) {
  return {
    agent_name: agentName,
    message,
    instructions: instructions || "",
    history
  };
}

// PROPOSED response: { "reply": "text" }
function readReply(data) {
  const reply = data?.reply ?? data?.message;
  return typeof reply === "string" ? reply : "";
}

async function readErrorMessage(response) {
  try {
    const data = await response.json();
    const detail = data?.detail ?? data?.error ?? data?.message;

    if (typeof detail === "string" && detail.trim()) return detail;
  } catch {
    // response had no JSON body
  }

  return `The server returned an error (${response.status}). Please try again.`;
}

async function backendReply(agentName, message, instructions, history) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        buildRequestBody(agentName, message, instructions, history)
      ),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const reply = readReply(await response.json());

    if (!reply.trim()) {
      throw new Error("The server returned an empty reply. Please try again.");
    }

    return reply;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("The request took too long. Please try again.");
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Could not reach the server. Check your connection and try again."
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------- PUBLIC FUNCTION ---------------- */

export async function getAgentReply(
  agentName,
  message,
  instructions = "",
  conversationHistory = []
) {
  if (!message || !message.trim()) {
    throw new Error("Please enter a message.");
  }

  const history = toApiHistory(conversationHistory);

  return isBackendConfigured()
    ? backendReply(agentName, message, instructions, history)
    : demoReply(agentName, message, instructions, history);
}
