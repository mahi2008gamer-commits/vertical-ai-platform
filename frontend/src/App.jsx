
import { useEffect, useMemo, useRef, useState } from "react";
import { getAgentReply } from "./services/agentService";
import {
  Search, LayoutDashboard, Compass, Bot, Plus,
  ArrowUpRight, Sparkles, Menu, X, Zap,
  HeartPulse, Sprout, Landmark, ShoppingBag,
  Factory, GraduationCap, ArrowLeft, Send, User,
  MessageSquarePlus, History, Trash2, Copy,
  Check, ChevronDown, Clock, RefreshCw,
  Pencil, Download, Pin, PinOff,
  MessageSquare, RotateCcw, MessagesSquare,
  ExternalLink, Archive
} from "lucide-react";

const STORAGE_KEY = "vertical-ai-phase4-chats";
const CUSTOM_AGENTS_KEY = "vertical-ai-custom-agents";
const PINNED_KEY = "vertical-ai-pinned-chats";
const WORKSPACE_KEY = "vertical-ai-workspace-state";

const categories = [
  "All", "Healthcare", "Agriculture", "Finance",
  "Retail", "Manufacturing", "Education"
];

const categoryIcons = {
  Healthcare: HeartPulse,
  Agriculture: Sprout,
  Finance: Landmark,
  Retail: ShoppingBag,
  Manufacturing: Factory,
  Education: GraduationCap
};

const categoryColors = {
  Healthcare: "#22c55e",
  Agriculture: "#84cc16",
  Finance: "#38bdf8",
  Retail: "#c084fc",
  Manufacturing: "#fb923c",
  Education: "#f472b6"
};

const agents = [
  {
    id: "medical",
    name: "Medical Assistant",
    category: "Healthcare",
    description: "AI assistant for medical information and patient support.",
    icon: HeartPulse,
    color: "#22c55e",
    status: "Popular"
  },
  {
    id: "agriculture",
    name: "Agri Expert AI",
    category: "Agriculture",
    description: "Get farming guidance, crop insights and smart suggestions.",
    icon: Sprout,
    color: "#84cc16",
    status: "Featured"
  },
  {
    id: "finance",
    name: "Finance Advisor",
    category: "Finance",
    description: "Understand financial data and business performance.",
    icon: Landmark,
    color: "#38bdf8",
    status: "Popular"
  },
  {
    id: "retail",
    name: "Retail Assistant",
    category: "Retail",
    description: "AI support for customers, products and retail operations.",
    icon: ShoppingBag,
    color: "#c084fc",
    status: "New"
  },
  {
    id: "manufacturing",
    name: "Industry Expert",
    category: "Manufacturing",
    description: "Improve industrial workflows and operational efficiency.",
    icon: Factory,
    color: "#fb923c",
    status: "New"
  },
  {
    id: "education",
    name: "Education Tutor",
    category: "Education",
    description: "Personalized learning and student assistance.",
    icon: GraduationCap,
    color: "#f472b6",
    status: "Featured"
  }
];

const agentDetails = {
  medical: {
    features: [
      "General health information",
      "Medical terms explanation",
      "Patient support guidance",
      "Appointment preparation"
    ],
    uses: [
      "Understand common health topics",
      "Learn medical terminology",
      "Prepare questions for doctors"
    ]
  },
  agriculture: {
    features: [
      "Crop planning guidance",
      "Soil information",
      "Irrigation suggestions",
      "Pest awareness"
    ],
    uses: [
      "Plan crop cultivation",
      "Understand farming methods",
      "Learn about irrigation"
    ]
  },
  finance: {
    features: [
      "Budget planning",
      "Financial concepts",
      "Business performance insights",
      "Expense analysis"
    ],
    uses: [
      "Understand business expenses",
      "Learn financial concepts",
      "Organize budgets"
    ]
  },
  retail: {
    features: [
      "Product information",
      "Customer support guidance",
      "Retail operations",
      "Customer FAQ assistance"
    ],
    uses: [
      "Prepare customer responses",
      "Organize product information",
      "Improve store operations"
    ]
  },
  manufacturing: {
    features: [
      "Production planning",
      "Workflow improvement",
      "Quality management concepts",
      "Operational efficiency"
    ],
    uses: [
      "Understand production workflows",
      "Identify process improvements",
      "Learn quality management"
    ]
  },
  education: {
    features: [
      "Concept explanations",
      "Personalized study guidance",
      "Practice questions",
      "Learning assistance"
    ],
    uses: [
      "Understand difficult topics",
      "Prepare for examinations",
      "Practice questions"
    ]
  }
};

function generateId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readStorage(key, fallback = []) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function readSavedAgents() {
  const saved = readStorage(CUSTOM_AGENTS_KEY);

  if (!Array.isArray(saved)) return [];

  return saved
    .filter(agent =>
      agent &&
      typeof agent.id === "string" &&
      typeof agent.name === "string" &&
      typeof agent.description === "string" &&
      typeof agent.category === "string" &&
      categories.includes(agent.category) &&
      agent.category !== "All"
    )
    .map(agent => ({
      ...agent,
      instructions: agent.instructions || "",
      icon: categoryIcons[agent.category],
      color: categoryColors[agent.category],
      status: "Custom",
      isCustom: true
    }));
}

function createChat(agent) {
  const now = Date.now();

  return {
    id: generateId(),
    agentId: agent.id,
    title: "New conversation",
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: generateId(),
        role: "assistant",
        text: `Hello! I am ${agent.name}. Welcome! How can I help you today?`,
        createdAt: now
      }
    ]
  };
}

function isValidChat(chat) {
  return (
    chat &&
    typeof chat.id === "string" &&
    typeof chat.agentId === "string" &&
    typeof chat.title === "string" &&
    Array.isArray(chat.messages) &&
    chat.messages.every(item =>
      item &&
      typeof item.id === "string" &&
      ["user", "assistant"].includes(item.role) &&
      typeof item.text === "string"
    )
  );
}

function readSavedChats() {
  const saved = readStorage(STORAGE_KEY);

  if (!Array.isArray(saved)) return [];

  const knownIds = [
    ...agents.map(agent => agent.id),
    ...readSavedAgents().map(agent => agent.id)
  ];

  return saved.filter(chat =>
    isValidChat(chat) && knownIds.includes(chat.agentId)
  );
}

function readSavedWorkspace() {
  const saved = readStorage(WORKSPACE_KEY, {});

  return saved && typeof saved === "object" && !Array.isArray(saved)
    ? saved
    : {};
}

function copyText(text) {
  return new Promise(async resolve => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        resolve(true);
        return;
      }

      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);
      textarea.select();

      const success = document.execCommand("copy");
      document.body.removeChild(textarea);

      resolve(success);
    } catch {
      resolve(false);
    }
  });
}

function formatTime(timestamp) {
  if (!timestamp) return "";

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function downloadFile(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [customAgents, setCustomAgents] = useState(readSavedAgents);

  const allAgents = useMemo(
    () => [...agents, ...customAgents],
    [customAgents]
  );

  const [savedWorkspace] = useState(readSavedWorkspace);

  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState(() => {
    const savedId = savedWorkspace.selectedAgentId;

    return allAgents.find(agent => agent.id === savedId) || null;
  });

  const [detailsAgent, setDetailsAgent] = useState(() => {
    if (savedWorkspace.selectedAgentId) return null;

    const savedId = savedWorkspace.detailsAgentId;

    return allAgents.find(agent => agent.id === savedId) || null;
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    const savedId = savedWorkspace.activeChatId;

    const savedChat = readSavedChats().find(
      chat => chat.id === savedId
    );

    if (!savedChat) return null;

    if (
      savedWorkspace.selectedAgentId &&
      savedChat.agentId !== savedWorkspace.selectedAgentId
    ) {
      return null;
    }

    return savedChat.id;
  });

  const [chats, setChats] = useState(readSavedChats);

  const [pinnedChats, setPinnedChats] = useState(
    () => readStorage(PINNED_KEY, [])
  );

  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const [agentName, setAgentName] = useState("");
  const [agentCategory, setAgentCategory] = useState("Healthcare");
  const [agentDescription, setAgentDescription] = useState("");
  const [agentInstructions, setAgentInstructions] = useState("");
  const [createError, setCreateError] = useState("");

  const [showCustomOnly, setShowCustomOnly] = useState(false);

  const [historyMode, setHistoryMode] = useState(() => {
    return (
      !savedWorkspace.selectedAgentId &&
      !savedWorkspace.detailsAgentId &&
      savedWorkspace.historyMode === true
    );
  });

  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("All");

  const [chatSearch, setChatSearch] = useState("");
  const [showChatSearch, setShowChatSearch] = useState(false);

  const messagesContainerRef = useRef(null);

  // SAVE DATA

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));

      setChatError(current =>
        current === "Storage is full. Export or delete old conversations."
          ? ""
          : current
      );
    } catch (error) {
      console.error("Chat saving error:", error);
      setChatError("Storage is full. Export or delete old conversations.");
    }
  }, [chats]);

  useEffect(() => {
    try {
      localStorage.setItem(
        CUSTOM_AGENTS_KEY,
        JSON.stringify(customAgents.map(({ icon, ...agent }) => agent))
      );
    } catch (error) {
      console.error("Agent saving error:", error);
    }
  }, [customAgents]);

  useEffect(() => {
    try {
      localStorage.setItem(PINNED_KEY, JSON.stringify(pinnedChats));
    } catch (error) {
      console.error("Pinned chat saving error:", error);
    }
  }, [pinnedChats]);

  // SAVE LAST ACTIVE WORKSPACE

  useEffect(() => {
    try {
      localStorage.setItem(
        WORKSPACE_KEY,
        JSON.stringify({
          selectedAgentId: selectedAgent?.id || null,
          detailsAgentId: detailsAgent?.id || null,
          activeChatId: activeChatId || null,
          historyMode
        })
      );
    } catch (error) {
      console.error("Workspace saving error:", error);
    }
  }, [selectedAgent, detailsAgent, activeChatId, historyMode]);

  const activeChat = chats.find(chat => chat.id === activeChatId);
  const messages = activeChat?.messages || [];

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isLoading]);

  // STATISTICS

  const totalMessages = chats.reduce(
    (total, chat) => total + chat.messages.length,
    0
  );

  // AGENT FILTERING

  const filteredAgents = allAgents.filter(agent => {
    const term = search.toLowerCase().trim();

    const matchesCategory =
      activeCategory === "All" || agent.category === activeCategory;

    const matchesSearch =
      agent.name.toLowerCase().includes(term) ||
      agent.category.toLowerCase().includes(term) ||
      agent.description.toLowerCase().includes(term);

    const matchesType = !showCustomOnly || agent.isCustom;

    return matchesCategory && matchesSearch && matchesType;
  });

  // GLOBAL HISTORY

  const globalHistory = useMemo(() => {
    const term = historySearch.toLowerCase().trim();

    return [...chats]
      .filter(chat => {
        const agent = allAgents.find(item => item.id === chat.agentId);

        const matchesAgent =
          historyFilter === "All" ||
          agent?.category === historyFilter;

        const searchableText = [
          chat.title,
          agent?.name || "",
          ...chat.messages.map(item => item.text)
        ].join(" ").toLowerCase();

        return matchesAgent && (!term || searchableText.includes(term));
      })
      .sort((a, b) => {
        const aPinned = pinnedChats.includes(a.id);
        const bPinned = pinnedChats.includes(b.id);

        if (aPinned !== bPinned) {
          return Number(bPinned) - Number(aPinned);
        }

        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
  }, [chats, allAgents, historySearch, historyFilter, pinnedChats]);

  const agentChats = chats
    .filter(chat => chat.agentId === selectedAgent?.id)
    .sort((a, b) => {
      const aPinned = pinnedChats.includes(a.id);
      const bPinned = pinnedChats.includes(b.id);

      if (aPinned !== bPinned) {
        return Number(bPinned) - Number(aPinned);
      }

      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

  // NAVIGATION

  function showDashboard() {
    setSelectedAgent(null);
    setDetailsAgent(null);
    setActiveChatId(null);
    setHistoryMode(false);
    setMessage("");
    setChatError("");
    setMobileMenu(false);
    setIsLoading(false);
    setChatSearch("");
    setShowChatSearch(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showGlobalHistory() {
    setSelectedAgent(null);
    setDetailsAgent(null);
    setHistoryMode(true);
    setActiveChatId(null);
    setMessage("");
    setChatError("");
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function navigateTo(section) {
    showDashboard();

    setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({
        behavior: "smooth"
      });
    }, 100);
  }

  function createNewChat(agent) {
    if (!agent) return;

    const newChat = createChat(agent);

    setChats(previous => [newChat, ...previous]);
    setSelectedAgent(agent);
    setDetailsAgent(null);
    setHistoryMode(false);
    setActiveChatId(newChat.id);
    setMessage("");
    setChatError("");
    setCopiedId(null);
    setMobileMenu(false);
    setIsLoading(false);
    setChatSearch("");
    setShowChatSearch(false);
  }

  function openAgent(agent) {
    setDetailsAgent(agent);
    setSelectedAgent(null);
    setHistoryMode(false);
    setActiveChatId(null);
    setMessage("");
    setChatError("");
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openExistingChat(chat) {
    const agent = allAgents.find(item => item.id === chat.agentId);
    if (!agent) return;

    setSelectedAgent(agent);
    setDetailsAgent(null);
    setHistoryMode(false);
    setActiveChatId(chat.id);
    setMessage("");
    setChatError("");
    setCopiedId(null);
    setMobileMenu(false);
    setIsLoading(false);
    setChatSearch("");
    setShowChatSearch(false);
  }

  function closeAgent() {
    showDashboard();
  }

  // PIN CHATS

  function togglePin(chatId) {
    setPinnedChats(previous =>
      previous.includes(chatId)
        ? previous.filter(id => id !== chatId)
        : [...previous, chatId]
    );
  }

  // CUSTOM AGENT EDIT

  function handleEditCustomAgent(agent) {
    if (!agent.isCustom) return;

    const name = window.prompt("Enter new agent name:", agent.name);
    if (name === null) return;

    const description = window.prompt(
      "Enter new description:",
      agent.description
    );
    if (description === null) return;

    const instructions = window.prompt(
      "Enter new agent instructions:",
      agent.instructions || ""
    );
    if (instructions === null) return;

    const cleanName = name.trim();
    const cleanDescription = description.trim();
    const cleanInstructions = instructions.trim();

    if (!cleanName || !cleanDescription || !cleanInstructions) {
      alert("All fields are required.");
      return;
    }

    if (
      cleanName.length > 40 ||
      cleanDescription.length > 300 ||
      cleanInstructions.length > 1000
    ) {
      alert("Please check the field character limits.");
      return;
    }

    const duplicate = allAgents.some(item =>
      item.id !== agent.id &&
      item.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (duplicate) {
      alert("An agent with this name already exists.");
      return;
    }

    const updatedAgent = {
      ...agent,
      name: cleanName,
      description: cleanDescription,
      instructions: cleanInstructions
    };

    setCustomAgents(previous =>
      previous.map(item =>
        item.id === agent.id ? updatedAgent : item
      )
    );

    if (detailsAgent?.id === agent.id) setDetailsAgent(updatedAgent);
    if (selectedAgent?.id === agent.id) setSelectedAgent(updatedAgent);

    alert("Custom agent updated successfully!");
  }

  // CUSTOM AGENT DELETE

  function handleDeleteCustomAgent(agent) {
    if (!agent.isCustom) return;

    const confirmed = window.confirm(
      `Delete "${agent.name}" and all its chat history permanently?`
    );

    if (!confirmed) return;

    const deletedChatIds = chats
      .filter(chat => chat.agentId === agent.id)
      .map(chat => chat.id);

    setCustomAgents(previous =>
      previous.filter(item => item.id !== agent.id)
    );

    setChats(previous =>
      previous.filter(chat => chat.agentId !== agent.id)
    );

    setPinnedChats(previous =>
      previous.filter(id => !deletedChatIds.includes(id))
    );

    if (
      selectedAgent?.id === agent.id ||
      detailsAgent?.id === agent.id
    ) {
      showDashboard();
    }

    alert("Custom agent deleted successfully!");
  }

  // CREATE CUSTOM AGENT

  function handleCreateAgent(e) {
    e.preventDefault();

    const name = agentName.trim();
    const description = agentDescription.trim();
    const instructions = agentInstructions.trim();

    if (!name || !description || !instructions) {
      setCreateError("Please complete all fields.");
      return;
    }

    if (
      name.length > 40 ||
      description.length > 300 ||
      instructions.length > 1000
    ) {
      setCreateError("Please check the character limits.");
      return;
    }

    const duplicate = allAgents.some(
      agent => agent.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      setCreateError("An agent with this name already exists.");
      return;
    }

    const newAgent = {
      id: `custom-${generateId()}`,
      name,
      category: agentCategory,
      description,
      instructions,
      icon: categoryIcons[agentCategory],
      color: categoryColors[agentCategory],
      status: "Custom",
      isCustom: true
    };

    setCustomAgents(previous => [...previous, newAgent]);

    setAgentName("");
    setAgentCategory("Healthcare");
    setAgentDescription("");
    setAgentInstructions("");
    setCreateError("");
    setActiveCategory("All");
    setSearch("");
    setShowCustomOnly(true);

    openAgent(newAgent);
  }

  // SEND MESSAGE WITH FULL CONVERSATION HISTORY

  async function sendMessage(e) {
    e.preventDefault();

    const question = message.trim();
    const agent = selectedAgent;
    const chatId = activeChatId;

    if (!question || !agent || !chatId || isLoading) return;

    const currentChat = chats.find(chat => chat.id === chatId);
    const conversationHistory = currentChat?.messages || [];

    const now = Date.now();

    const userMessage = {
      id: generateId(),
      role: "user",
      text: question,
      createdAt: now
    };

    setChats(previous =>
      previous.map(chat => {
        if (chat.id !== chatId) return chat;

        const firstUserMessage = !chat.messages.some(
          item => item.role === "user"
        );

        return {
          ...chat,
          title: firstUserMessage
            ? question.slice(0, 35) + (question.length > 35 ? "..." : "")
            : chat.title,
          updatedAt: now,
          messages: [...chat.messages, userMessage]
        };
      })
    );

    setMessage("");
    setChatError("");
    setIsLoading(true);

    try {
      const result = await getAgentReply(
        agent.name,
        question,
        agent.instructions || "",
        conversationHistory
      );

      const reply =
        typeof result === "string"
          ? result
          : String(
              result?.reply ||
              result?.message ||
              "No response received."
            );

      const assistantMessage = {
        id: generateId(),
        role: "assistant",
        text: reply,
        createdAt: Date.now()
      };

      setChats(previous =>
        previous.map(chat =>
          chat.id === chatId
            ? {
                ...chat,
                updatedAt: Date.now(),
                messages: [...chat.messages, assistantMessage]
              }
            : chat
        )
      );
    } catch (error) {
      console.error("AI response error:", error);
      setChatError(
        error?.message || "Unable to connect to AI. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  // EDIT USER MESSAGE

  function editUserMessage(item) {
    if (!activeChatId || isLoading || item.role !== "user") return;

    const updatedText = window.prompt("Edit your message:", item.text);
    if (updatedText === null) return;

    const cleanText = updatedText.trim();

    if (!cleanText) {
      alert("Message cannot be empty.");
      return;
    }

    setChats(previous =>
      previous.map(chat => {
        if (chat.id !== activeChatId) return chat;

        const messageIndex = chat.messages.findIndex(
          messageItem => messageItem.id === item.id
        );

        if (messageIndex === -1) return chat;

        const updatedMessages = chat.messages
          .slice(0, messageIndex + 1)
          .map(messageItem =>
            messageItem.id === item.id
              ? { ...messageItem, text: cleanText, edited: true }
              : messageItem
          );

        return {
          ...chat,
          messages: updatedMessages,
          updatedAt: Date.now()
        };
      })
    );

    setChatError("");
    setMessage(cleanText);
  }

  // DELETE MESSAGE

  function deleteMessage(messageId) {
    if (!activeChatId || isLoading) return;

    setChats(previous =>
      previous.map(chat =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: chat.messages.filter(
                item => item.id !== messageId
              ),
              updatedAt: Date.now()
            }
          : chat
      )
    );
  }

  // CLEAR CURRENT CHAT

  function clearCurrentChat() {
    if (!activeChatId || !selectedAgent || isLoading) return;

    if (!window.confirm("Clear all messages in this conversation?")) {
      return;
    }

    const freshChat = createChat(selectedAgent);

    setChats(previous =>
      previous.map(chat =>
        chat.id === activeChatId
          ? {
              ...freshChat,
              id: chat.id,
              createdAt: chat.createdAt
            }
          : chat
      )
    );

    setMessage("");
    setChatError("");
    setCopiedId(null);
  }

  // DELETE CHAT

  function deleteChat(chatId) {
    if (isLoading && chatId === activeChatId) {
      alert("Please wait until the AI response finishes.");
      return;
    }

    if (!window.confirm("Delete this conversation permanently?")) {
      return;
    }

    const remainingChats = chats
      .filter(chat => chat.id !== chatId)
      .filter(chat => chat.agentId === selectedAgent?.id)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    setChats(previous =>
      previous.filter(chat => chat.id !== chatId)
    );

    setPinnedChats(previous =>
      previous.filter(id => id !== chatId)
    );

    if (chatId === activeChatId) {
      if (remainingChats.length > 0) {
        openExistingChat(remainingChats[0]);
      } else {
        setActiveChatId(null);
        setSelectedAgent(null);
        setDetailsAgent(null);
      }
    }
  }

  // RENAME CHAT

  function renameChat(chat) {
    const title = window.prompt("Enter conversation name:", chat.title);
    if (title === null) return;

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      alert("Conversation name cannot be empty.");
      return;
    }

    if (cleanTitle.length > 60) {
      alert("Maximum 60 characters allowed.");
      return;
    }

    setChats(previous =>
      previous.map(item =>
        item.id === chat.id
          ? { ...item, title: cleanTitle, updatedAt: Date.now() }
          : item
      )
    );
  }

  // DELETE ALL CHATS

  function clearAllChats() {
    if (isLoading) {
      alert("Wait until the current AI response finishes.");
      return;
    }

    if (!chats.length) return;

    if (!window.confirm("Delete ALL conversation history permanently?")) {
      return;
    }

    setChats([]);
    setPinnedChats([]);
    setActiveChatId(null);
    setSelectedAgent(null);
    setDetailsAgent(null);
    setHistoryMode(false);
    setMessage("");
    setChatError("");
  }

  // COPY MESSAGE

  async function copyMessage(item) {
    const success = await copyText(item.text);

    if (success) {
      setCopiedId(item.id);

      setTimeout(() => {
        setCopiedId(current => current === item.id ? null : current);
      }, 1800);
    } else {
      alert("Could not copy this message.");
    }
  }

  // REGENERATE RESPONSE WITH HISTORY

  async function regenerateResponse() {
    if (!activeChat || !selectedAgent || isLoading) return;

    const lastUserIndex = activeChat.messages
      .map(item => item.role)
      .lastIndexOf("user");

    if (lastUserIndex === -1) return;

    const lastUserMessage = activeChat.messages[lastUserIndex];
    const chatId = activeChat.id;
    const question = lastUserMessage.text;
    const agent = selectedAgent;

    const conversationHistory = activeChat.messages.slice(0, lastUserIndex);

    setChats(previous =>
      previous.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.slice(0, lastUserIndex + 1)
            }
          : chat
      )
    );

    setChatError("");
    setIsLoading(true);

    try {
      const result = await getAgentReply(
        agent.name,
        question,
        agent.instructions || "",
        conversationHistory
      );

      const reply =
        typeof result === "string"
          ? result
          : String(
              result?.reply ||
              result?.message ||
              "No response received."
            );

      const assistantMessage = {
        id: generateId(),
        role: "assistant",
        text: reply,
        createdAt: Date.now()
      };

      setChats(previous =>
        previous.map(chat =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, assistantMessage],
                updatedAt: Date.now()
              }
            : chat
        )
      );
    } catch (error) {
      setChatError(
        error?.message || "Could not regenerate response."
      );
    } finally {
      setIsLoading(false);
    }
  }

  // EXPORT ONE CHAT

  function exportConversation(chat) {
    if (!chat) return;

    const agent = allAgents.find(item => item.id === chat.agentId);

    const content = [
      "VERTICAL AI PLATFORM",
      `Agent: ${agent?.name || "Unknown Agent"}`,
      `Conversation: ${chat.title}`,
      `Date: ${new Date(chat.createdAt).toLocaleString()}`,
      "",
      ...chat.messages.map(item =>
        `${item.role.toUpperCase()} (${formatTime(item.createdAt)}):\n${item.text}\n`
      )
    ].join("\n");

    downloadFile(
      `vertical-ai-${chat.title.replace(/[^a-z0-9]/gi, "-")}.txt`,
      content
    );
  }

  // EXPORT ALL CHATS AS TXT

  function exportAllChats() {
    if (!chats.length) {
      alert("No conversations to export.");
      return;
    }

    const content = chats.map(chat => {
      const agent = allAgents.find(item => item.id === chat.agentId);

      return [
        `AGENT: ${agent?.name || "Unknown"}`,
        `CONVERSATION: ${chat.title}`,
        `DATE: ${new Date(chat.createdAt).toLocaleString()}`,
        "",
        ...chat.messages.map(item =>
          `${item.role.toUpperCase()}:\n${item.text}\n`
        )
      ].join("\n");
    }).join("\n\n============================\n\n");

    downloadFile("vertical-ai-all-conversations.txt", content);
  }

  // EXPORT JSON BACKUP

  function exportAllChatsJSON() {
    const backup = {
      app: "Vertical AI Platform",
      version: "5.0",
      exportedAt: new Date().toISOString(),
      agents: customAgents.map(({ icon, ...agent }) => agent),
      chats,
      pinnedChats
    };

    downloadFile(
      "vertical-ai-backup.json",
      JSON.stringify(backup, null, 2),
      "application/json;charset=utf-8"
    );
  }

  // AGENT CARD

  function AgentCard({ agent }) {
    const Icon = agent.icon;

    return (
      <article className="agent-card" key={agent.id}>
        <div className="agent-top">
          <div className="agent-icon" style={{ color: agent.color }}>
            <Icon size={27} />
          </div>
          <span className="agent-status">{agent.status}</span>
        </div>

        <p className="agent-category">{agent.category}</p>
        <h3>{agent.name}</h3>

        <p className="agent-description">{agent.description}</p>

        <button className="agent-link" onClick={() => openAgent(agent)}>
          Explore Agent
          <ArrowUpRight size={16} />
        </button>

        {agent.isCustom && (
          <div className="agent-management-actions">
            <button type="button" onClick={() => handleEditCustomAgent(agent)}>
              <Pencil size={15} /> Edit
            </button>

            <button type="button" onClick={() => handleDeleteCustomAgent(agent)}>
              <Trash2 size={15} /> Delete
            </button>
          </div>
        )}
      </article>
    );
  }

  const detailInfo = detailsAgent
    ? agentDetails[detailsAgent.id] || {
        features: [
          "Custom AI assistant",
          "Industry-specific guidance",
          "Personalized responses",
          "Dedicated chat history"
        ],
        uses: [
          "Ask questions related to your industry",
          "Get assistance for your tasks",
          "Explore your custom AI assistant"
        ]
      }
    : null;

  return (
    <div className="app">

      {mobileMenu && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-icon"><Bot size={25} /></div>

          <span>
            Vertical<span className="brand-light">AI</span>
          </span>

          <button
            className="close-menu"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>

        <p className="nav-label">MENU</p>

        <nav>
          <button
            className={`nav-item ${
              !selectedAgent && !detailsAgent && !historyMode ? "active" : ""
            }`}
            onClick={showDashboard}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button className="nav-item" onClick={() => navigateTo("agents")}>
            <Compass size={19} />
            Explore Agents
          </button>

          <button
            className={`nav-item ${historyMode ? "active" : ""}`}
            onClick={showGlobalHistory}
          >
            <MessagesSquare size={19} />
            All Conversations
          </button>

          <button className="nav-item" onClick={() => navigateTo("create")}>
            <Plus size={19} />
            Create AI Agent
          </button>
        </nav>

        {selectedAgent && (
          <div className="history-panel">
            <div className="history-title">
              <span><History size={16} /> Chat History</span>

              <button
                title="New Chat"
                onClick={() => createNewChat(selectedAgent)}
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="history-list">
              {agentChats.length === 0 ? (
                <p className="history-empty">No conversations yet.</p>
              ) : (
                agentChats.map(chat => (
                  <div
                    key={chat.id}
                    className={`history-item ${
                      activeChatId === chat.id ? "selected" : ""
                    }`}
                  >
                    <button
                      className="history-open"
                      onClick={() => openExistingChat(chat)}
                      title={chat.title}
                    >
                      {pinnedChats.includes(chat.id)
                        ? <Pin size={14} />
                        : <MessageSquarePlus size={15} />}
                      <span>{chat.title}</span>
                    </button>

                    <button
                      className="history-delete"
                      title="Rename"
                      onClick={() => renameChat(chat)}
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      className="history-delete"
                      title="Pin / Unpin"
                      onClick={() => togglePin(chat.id)}
                    >
                      {pinnedChats.includes(chat.id)
                        ? <PinOff size={13} />
                        : <Pin size={13} />}
                    </button>

                    <button
                      className="history-delete"
                      title="Delete"
                      onClick={() => deleteChat(chat.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {agentChats.length > 0 && (
              <button className="clear-history-button" onClick={clearAllChats}>
                <Trash2 size={14} />
                Clear All History
              </button>
            )}
          </div>
        )}

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <Sparkles size={23} />
            <h3>Build with AI</h3>
            <p>Create intelligent agents for your business.</p>

            <button onClick={() => navigateTo("create")}>
              Get Started
              <ArrowUpRight size={15} />
            </button>
          </div>

          <p className="version">VERTICAL AI PLATFORM · V5.0</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            <Menu />
          </button>

          <div className="breadcrumb">
            Platform <span>/</span>

            {historyMode
              ? "All Conversations"
              : detailsAgent
              ? detailsAgent.name
              : selectedAgent
              ? selectedAgent.name
              : "Dashboard"}
          </div>

          <div className="top-actions">
            <span className="online-dot"></span>
            <span className="online-text">System Online</span>
            <div className="avatar">V</div>
          </div>
        </header>

        {/* AGENT DETAILS */}

        {detailsAgent ? (
          <section className="agent-details-page">
            <button className="details-back-button" onClick={closeAgent}>
              <ArrowLeft size={18} />
              Back to Marketplace
            </button>

            <div className="details-hero">
              <div
                className="details-agent-icon"
                style={{ color: detailsAgent.color }}
              >
                {(() => {
                  const Icon = detailsAgent.icon;
                  return <Icon size={38} />;
                })()}
              </div>

              <p className="details-category">
                {detailsAgent.category} AI AGENT
              </p>

              <h1>{detailsAgent.name}</h1>
              <p className="details-description">{detailsAgent.description}</p>

              <button
                className="details-use-button"
                onClick={() => createNewChat(detailsAgent)}
              >
                <Sparkles size={18} />
                Use This Agent
                <ArrowUpRight size={18} />
              </button>

              {detailsAgent.isCustom && (
                <div className="agent-management-actions details-management">
                  <button onClick={() => handleEditCustomAgent(detailsAgent)}>
                    <Pencil size={16} /> Edit Agent
                  </button>

                  <button onClick={() => handleDeleteCustomAgent(detailsAgent)}>
                    <Trash2 size={16} /> Delete Agent
                  </button>
                </div>
              )}
            </div>

            <div className="details-section">
              <h2>Key Features</h2>

              <div className="details-feature-grid">
                {detailInfo.features.map((feature, index) => (
                  <div className="details-feature-card" key={index}>
                    <Check size={19} />
                    <p>{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="details-section">
              <h2>What Can You Do With This Agent?</h2>

              <div className="details-feature-grid">
                {detailInfo.uses.map((use, index) => (
                  <div className="details-feature-card" key={index}>
                    <Sparkles size={19} />
                    <p>{use}</p>
                  </div>
                ))}
              </div>
            </div>

            {detailsAgent.isCustom && (
              <div className="chat-notice">
                <strong>Your Agent Instructions:</strong>
                <p>{detailsAgent.instructions}</p>
              </div>
            )}

            <div className="chat-notice">
              AI responses and backend integration can be connected through the agent service.
            </div>
          </section>

        ) : selectedAgent ? (

          /* CHAT WORKSPACE */

          <section className="chat-page">
            <div className="workspace-toolbar">
              <button className="back-button" onClick={closeAgent}>
                <ArrowLeft size={18} />
                Dashboard
              </button>

              <div className="workspace-toolbar-actions">
                <button
                  className="new-chat-button"
                  onClick={() => createNewChat(selectedAgent)}
                >
                  <MessageSquarePlus size={17} />
                  New Chat
                </button>

                {activeChat && (
                  <>
                    <button
                      className="new-chat-button"
                      onClick={() => renameChat(activeChat)}
                    >
                      <Pencil size={16} />
                      Rename
                    </button>

                    <button
                      className="new-chat-button"
                      onClick={() => exportConversation(activeChat)}
                    >
                      <Download size={16} />
                      Export
                    </button>

                    <button
                      className="new-chat-button"
                      onClick={() => setShowChatSearch(!showChatSearch)}
                    >
                      <Search size={16} />
                      Search
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="chat-heading">
              <div
                className="chat-agent-icon"
                style={{ color: selectedAgent.color }}
              >
                {(() => {
                  const Icon = selectedAgent.icon;
                  return <Icon size={30} />;
                })()}
              </div>

              <div className="agent-heading-info">
                <h1>{selectedAgent.name}</h1>
                <p>{selectedAgent.category} AI Assistant</p>
              </div>

              <span className="demo-badge">DEMO</span>
            </div>

            {showChatSearch && (
              <div className="search-box">
                <Search size={18} />

                <input
                  placeholder="Search messages in this conversation..."
                  value={chatSearch}
                  onChange={e => setChatSearch(e.target.value)}
                />

                <button
                  onClick={() => {
                    setChatSearch("");
                    setShowChatSearch(false);
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="agent-switcher">
              <label htmlFor="agent-switch">
                <Bot size={16} />
                Switch Agent
              </label>

              <div className="agent-select-wrapper">
                <select
                  id="agent-switch"
                  value={selectedAgent.id}
                  onChange={e => {
                    const nextAgent = allAgents.find(
                      item => item.id === e.target.value
                    );

                    if (nextAgent) openAgent(nextAgent);
                  }}
                >
                  {allAgents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>

                <ChevronDown size={16} />
              </div>
            </div>

            <div className="chat-notice">
              Your conversations are saved in this browser. Backend database integration can be added later.
            </div>

            {/* MESSAGES */}

            <div
              className="chat-messages"
              ref={messagesContainerRef}
              aria-live="polite"
            >
              {messages.filter(item =>
                !chatSearch.trim() ||
                item.text.toLowerCase().includes(chatSearch.toLowerCase())
              ).length === 0 ? (
                <p className="history-empty">
                  {chatSearch
                    ? "No matching messages found."
                    : "No messages in this conversation. Send a message to start."}
                </p>
              ) : (
                messages
                  .filter(item =>
                    !chatSearch.trim() ||
                    item.text.toLowerCase().includes(chatSearch.toLowerCase())
                  )
                  .map(item => (
                    <div
                      className={`message-row ${item.role}`}
                      key={item.id}
                    >
                      <div className="message-avatar">
                        {item.role === "assistant"
                          ? <Bot size={18} />
                          : <User size={18} />}
                      </div>

                      <div className="message-content">
                        <div className="message-bubble">
                          <p>{item.text}</p>
                        </div>

                        <div className="message-actions">
                          {item.createdAt && (
                            <span className="message-time">
                              <Clock size={12} />
                              {formatTime(item.createdAt)}
                            </span>
                          )}

                          {item.edited && (
                            <span className="message-time">Edited</span>
                          )}

                          <button onClick={() => copyMessage(item)} title="Copy message">
                            {copiedId === item.id
                              ? <Check size={14} />
                              : <Copy size={14} />}
                            {copiedId === item.id ? "Copied" : "Copy"}
                          </button>

                          {item.role === "user" && (
                            <button
                              onClick={() => editUserMessage(item)}
                              disabled={isLoading}
                              title="Edit message"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                          )}

                          <button
                            onClick={() => deleteMessage(item.id)}
                            disabled={isLoading}
                            title="Delete message"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}

              {isLoading && (
                <div className="loading-message">
                  <RefreshCw size={16} />
                  AI Agent is thinking...
                </div>
              )}

              {chatError && (
                <div className="error-message" role="alert">
                  <span>{chatError}</span>

                  <button
                    type="button"
                    onClick={regenerateResponse}
                    disabled={isLoading}
                  >
                    <RotateCcw size={15} />
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* MESSAGE INPUT */}

            <form className="chat-input-area" onSubmit={sendMessage}>
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={`Ask ${selectedAgent.name}...`}
                aria-label="Type your message"
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={!message.trim() || !activeChat || isLoading}
                aria-label="Send message"
              >
                <Send size={19} />
              </button>
            </form>

            <div className="workspace-bottom-actions">
              <button
                onClick={clearCurrentChat}
                disabled={!activeChat || isLoading}
              >
                <Trash2 size={15} />
                Clear Current Chat
              </button>

              <button
                onClick={regenerateResponse}
                disabled={
                  isLoading ||
                  !messages.some(item => item.role === "user")
                }
              >
                <RefreshCw size={15} />
                Regenerate Response
              </button>

              {activeChat && (
                <button onClick={() => togglePin(activeChat.id)}>
                  {pinnedChats.includes(activeChat.id)
                    ? <PinOff size={15} />
                    : <Pin size={15} />}
                  {pinnedChats.includes(activeChat.id) ? "Unpin" : "Pin Chat"}
                </button>
              )}
            </div>

            <p className="chat-footer">
              Vertical AI Platform · Agent Workspace V5.0
            </p>
          </section>

        ) : historyMode ? (

          /* GLOBAL HISTORY */

          <section className="agents-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR WORKSPACE</p>
                <h2>All Conversations</h2>
                <p>Manage conversations from all your AI agents.</p>
              </div>

              <div className="workspace-toolbar-actions">
                <button
                  className="primary-button"
                  onClick={exportAllChats}
                  disabled={!chats.length}
                >
                  <Download size={17} />
                  Export All TXT
                </button>

                <button
                  className="secondary-button"
                  onClick={exportAllChatsJSON}
                  disabled={!chats.length}
                >
                  <Archive size={17} />
                  JSON Backup
                </button>
              </div>
            </div>

            <div className="search-box">
              <Search size={20} />

              <input
                placeholder="Search conversations, agents or messages..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
              />

              {historySearch && (
                <button onClick={() => setHistorySearch("")}>
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="category-list">
              {categories.map(category => (
                <button
                  key={category}
                  className={
                    historyFilter === category
                      ? "category active-category"
                      : "category"
                  }
                  onClick={() => setHistoryFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="agent-filter-actions">
              <span>{globalHistory.length} conversations found</span>
              <span>{pinnedChats.length} pinned</span>
            </div>

            <div className="global-history-list">
              {globalHistory.length === 0 ? (
                <div className="empty-message">
                  <MessagesSquare size={35} />
                  <h3>No conversations found</h3>
                  <p>Start a new conversation with any AI agent.</p>

                  <button
                    className="primary-button"
                    onClick={() => navigateTo("agents")}
                  >
                    Explore Agents
                  </button>
                </div>
              ) : (
                globalHistory.map(chat => {
                  const agent = allAgents.find(
                    item => item.id === chat.agentId
                  );

                  const Icon = agent?.icon || Bot;
                  const lastMessage = chat.messages[chat.messages.length - 1];

                  return (
                    <div className="global-history-card" key={chat.id}>
                      <div
                        className="chat-agent-icon"
                        style={{ color: agent?.color || "#a78bfa" }}
                      >
                        <Icon size={24} />
                      </div>

                      <div className="global-history-info">
                        <div className="global-history-heading">
                          <h3>{chat.title}</h3>

                          {pinnedChats.includes(chat.id) && <Pin size={14} />}
                        </div>

                        <p>
                          {agent?.name || "Unknown Agent"} ·{" "}
                          {agent?.category || "Unknown"}
                        </p>

                        <span>
                          {lastMessage?.text?.slice(0, 100) || "No messages"}
                        </span>

                        <small>
                          {new Date(
                            chat.updatedAt || chat.createdAt
                          ).toLocaleString()}
                        </small>
                      </div>

                      <div className="global-history-actions">
                        <button
                          title="Open conversation"
                          onClick={() => openExistingChat(chat)}
                        >
                          <ExternalLink size={17} />
                        </button>

                        <button
                          title="Pin conversation"
                          onClick={() => togglePin(chat.id)}
                        >
                          {pinnedChats.includes(chat.id)
                            ? <PinOff size={17} />
                            : <Pin size={17} />}
                        </button>

                        <button
                          title="Rename conversation"
                          onClick={() => renameChat(chat)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          title="Export conversation"
                          onClick={() => exportConversation(chat)}
                        >
                          <Download size={17} />
                        </button>

                        <button
                          title="Delete conversation"
                          onClick={() => deleteChat(chat.id)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="workspace-bottom-actions">
              <button onClick={clearAllChats}>
                <Trash2 size={15} />
                Delete All Conversations
              </button>
            </div>
          </section>

        ) : (

          /* DASHBOARD */

          <>
            <section className="welcome-section" id="dashboard">
              <div>
                <div className="eyebrow">
                  <Sparkles size={15} />
                  THE FUTURE OF BUSINESS AI
                </div>

                <h1>
                  Intelligence for
                  <br />
                  <span>Every Industry.</span>
                </h1>

                <p className="welcome-description">
                  Discover powerful AI agents designed for your industry.
                  Automate workflows, improve productivity and grow faster.
                </p>

                <div className="hero-actions">
                  <a href="#agents" className="primary-button">
                    Explore AI Agents
                    <ArrowUpRight size={17} />
                  </a>

                  <a href="#create" className="secondary-button">
                    Create Your Agent
                  </a>
                </div>
              </div>

              <div className="hero-visual">
                <div className="orbit orbit-one"></div>
                <div className="orbit orbit-two"></div>

                <div className="hero-core"><Bot size={65} /></div>

                <div className="floating-icon icon-one"><HeartPulse /></div>
                <div className="floating-icon icon-two"><Sprout /></div>
                <div className="floating-icon icon-three"><Landmark /></div>
              </div>
            </section>

            {/* STATISTICS */}

            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple"><Bot /></div>
                <div>
                  <p>AI AGENTS</p>
                  <h2>{String(allAgents.length).padStart(2, "0")}</h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green"><MessagesSquare /></div>
                <div>
                  <p>CONVERSATIONS</p>
                  <h2>{String(chats.length).padStart(2, "0")}</h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue"><MessageSquare /></div>
                <div>
                  <p>TOTAL MESSAGES</p>
                  <h2>{String(totalMessages).padStart(2, "0")}</h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple"><Zap /></div>
                <div>
                  <p>INDUSTRIES</p>
                  <h2>06</h2>
                </div>
              </div>
            </section>

            {/* RECENT CONVERSATIONS */}

            {chats.length > 0 && (
              <section className="agents-section">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">RECENT ACTIVITY</p>
                    <h2>Recent Conversations</h2>
                    <p>Continue where you left off.</p>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={showGlobalHistory}
                  >
                    View All
                    <ArrowUpRight size={16} />
                  </button>
                </div>

                <div className="global-history-list">
                  {[...chats]
                    .sort((a, b) =>
                      (b.updatedAt || 0) - (a.updatedAt || 0)
                    )
                    .slice(0, 3)
                    .map(chat => {
                      const agent = allAgents.find(
                        item => item.id === chat.agentId
                      );

                      const Icon = agent?.icon || Bot;

                      return (
                        <div className="global-history-card" key={chat.id}>
                          <div
                            className="chat-agent-icon"
                            style={{ color: agent?.color || "#a78bfa" }}
                          >
                            <Icon size={23} />
                          </div>

                          <div className="global-history-info">
                            <h3>{chat.title}</h3>
                            <p>{agent?.name || "Unknown Agent"}</p>
                            <small>
                              {new Date(
                                chat.updatedAt || chat.createdAt
                              ).toLocaleString()}
                            </small>
                          </div>

                          <button
                            className="new-chat-button"
                            onClick={() => openExistingChat(chat)}
                          >
                            Open
                            <ArrowUpRight size={15} />
                          </button>
                        </div>
                      );
                    })}
                </div>
              </section>
            )}

            {/* AGENT MARKETPLACE */}

            <section className="agents-section" id="agents">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">AI MARKETPLACE</p>
                  <h2>Explore AI Agents</h2>
                  <p>Find the right intelligence for your business.</p>
                </div>
              </div>

              <div className="search-box">
                <Search size={20} />

                <input
                  placeholder="Search AI agents or industries..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Search AI agents"
                />

                {search && (
                  <button onClick={() => setSearch("")}>
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="category-list">
                {categories.map(category => (
                  <button
                    key={category}
                    className={
                      activeCategory === category
                        ? "category active-category"
                        : "category"
                    }
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="agent-filter-actions">
                <button
                  className={
                    showCustomOnly ? "category active-category" : "category"
                  }
                  onClick={() => setShowCustomOnly(!showCustomOnly)}
                >
                  {showCustomOnly ? "Showing My Agents" : "My Custom Agents"}
                </button>

                <span>{filteredAgents.length} agents found</span>
              </div>

              <div className="agents-grid">
                {filteredAgents.map(agent => (
                  <AgentCard agent={agent} key={agent.id} />
                ))}

                {filteredAgents.length === 0 && (
                  <p className="empty-message">
                    No agents found. Try another search.
                  </p>
                )}
              </div>
            </section>

            {/* CREATE AGENT INTRO */}

            <section className="create-section" id="create">
              <div className="create-icon"><Sparkles size={30} /></div>

              <div>
                <p className="eyebrow">BUILD YOUR OWN</p>
                <h2>Create Your Custom AI Agent</h2>
                <p>
                  Design an intelligent assistant tailored to your business needs.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() => {
                  document.getElementById("agent-builder")?.scrollIntoView({
                    behavior: "smooth"
                  });
                }}
              >
                <Plus size={18} />
                Create Agent
              </button>
            </section>

            {/* CUSTOM AGENT BUILDER */}

            <section className="create-section" id="agent-builder">
              <div className="create-icon"><Bot size={30} /></div>

              <div style={{ width: "100%" }}>
                <p className="eyebrow">CUSTOM AGENT BUILDER</p>
                <h2>Build Your Own AI Agent</h2>

                <p>
                  Enter details and instructions for your personalized assistant.
                </p>

                <form onSubmit={handleCreateAgent} className="agent-builder-form">
                  <label>
                    Agent Name
                    <input
                      value={agentName}
                      onChange={e => setAgentName(e.target.value)}
                      placeholder="Example: My Business Assistant"
                      maxLength={40}
                      required
                    />
                  </label>

                  <label>
                    Industry
                    <select
                      value={agentCategory}
                      onChange={e => setAgentCategory(e.target.value)}
                    >
                      {categories
                        .filter(item => item !== "All")
                        .map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label>
                    Agent Description
                    <textarea
                      value={agentDescription}
                      onChange={e => setAgentDescription(e.target.value)}
                      placeholder="Describe what your AI agent should help with..."
                      rows={3}
                      maxLength={300}
                      required
                    />
                  </label>

                  <label>
                    Agent Instructions
                    <textarea
                      value={agentInstructions}
                      onChange={e => setAgentInstructions(e.target.value)}
                      placeholder="Explain how your AI agent should behave..."
                      rows={5}
                      maxLength={1000}
                      required
                    />

                    <small>Maximum 1000 characters.</small>
                  </label>

                  {createError && (
                    <p className="error-message">{createError}</p>
                  )}

                  <button type="submit" className="primary-button">
                    <Plus size={18} />
                    Create My Agent
                  </button>
                </form>
              </div>
            </section>

            <footer>
              <p>© 2026 Vertical AI Platform. All rights reserved.</p>
              <p>Built for the future of every industry.</p>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
