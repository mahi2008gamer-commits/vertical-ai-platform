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

/* ------------------------------------------------------------------ */
/* CONSTANTS                                                           */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "vertical-ai-phase4-chats";
const CUSTOM_AGENTS_KEY = "vertical-ai-custom-agents";
const PINNED_KEY = "vertical-ai-pinned-chats";
const WORKSPACE_KEY = "vertical-ai-workspace-state";

const MAX_NAME = 40;
const MAX_DESCRIPTION = 300;
const MAX_INSTRUCTIONS = 1000;
const MAX_TITLE = 60;
const DEFAULT_TITLE = "New conversation";

const EMPTY_MESSAGES = [];

const categories = [
  "All", "Healthcare", "Agriculture", "Finance",
  "Retail", "Manufacturing", "Education"
];

const customCategories = categories.filter(item => item !== "All");

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

const genericDetails = {
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
};

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function generateId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;

    const value = JSON.parse(raw);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Could not save ${key}:`, error);
    return false;
  }
}

function readSavedAgents() {
  const saved = readStorage(CUSTOM_AGENTS_KEY, []);
  if (!Array.isArray(saved)) return [];

  const defaultIds = agents.map(agent => agent.id);
  const seen = new Set();
  const result = [];

  saved.forEach(agent => {
    if (!agent || typeof agent !== "object") return;

    const { id, name, category } = agent;

    if (typeof id !== "string" || !id) return;
    if (seen.has(id) || defaultIds.includes(id)) return;
    if (typeof name !== "string" || !name.trim()) return;
    if (!customCategories.includes(category)) return;

    seen.add(id);

    result.push({
      id,
      name,
      category,
      description:
        typeof agent.description === "string" ? agent.description : "",
      instructions:
        typeof agent.instructions === "string" ? agent.instructions : "",
      icon: categoryIcons[category],
      color: categoryColors[category],
      status: "Custom",
      isCustom: true
    });
  });

  return result;
}

function createChat(agent) {
  const now = Date.now();

  return {
    id: generateId(),
    agentId: agent.id,
    title: DEFAULT_TITLE,
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

// Repairs older or partly damaged saved chats instead of throwing them away.
function sanitizeChat(chat, knownAgentIds) {
  if (!chat || typeof chat !== "object") return null;
  if (typeof chat.id !== "string" || !chat.id) return null;
  if (typeof chat.agentId !== "string") return null;
  if (!knownAgentIds.includes(chat.agentId)) return null;
  if (!Array.isArray(chat.messages)) return null;

  const now = Date.now();

  const messages = chat.messages
    .filter(item =>
      item &&
      typeof item.id === "string" &&
      ["user", "assistant"].includes(item.role) &&
      typeof item.text === "string"
    )
    .map(item => ({
      ...item,
      createdAt: Number.isFinite(item.createdAt) ? item.createdAt : now
    }));

  const createdAt = Number.isFinite(chat.createdAt)
    ? chat.createdAt
    : messages[0]?.createdAt ?? now;

  return {
    ...chat,
    title:
      typeof chat.title === "string" && chat.title.trim()
        ? chat.title
        : "Conversation",
    createdAt,
    updatedAt: Number.isFinite(chat.updatedAt) ? chat.updatedAt : createdAt,
    messages
  };
}

function readSavedChats(everyAgent) {
  const saved = readStorage(STORAGE_KEY, []);
  if (!Array.isArray(saved)) return [];

  const knownAgentIds = everyAgent.map(agent => agent.id);
  const seen = new Set();
  const result = [];

  saved.forEach(item => {
    const chat = sanitizeChat(item, knownAgentIds);

    if (chat && !seen.has(chat.id)) {
      seen.add(chat.id);
      result.push(chat);
    }
  });

  return result;
}

function readSavedWorkspace() {
  const saved = readStorage(WORKSPACE_KEY, {});

  return saved && typeof saved === "object" && !Array.isArray(saved)
    ? saved
    : {};
}

function sortChats(list, pinnedChats) {
  return [...list].sort((a, b) => {
    const aPinned = pinnedChats.includes(a.id);
    const bPinned = pinnedChats.includes(b.id);

    if (aPinned !== bPinned) return Number(bPinned) - Number(aPinned);

    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
}

// Reads everything from localStorage once, safely, when the app starts.
function loadInitialState() {
  const customAgents = readSavedAgents();
  const everyAgent = [...agents, ...customAgents];
  const chats = readSavedChats(everyAgent);
  const chatIds = chats.map(chat => chat.id);

  const savedPins = readStorage(PINNED_KEY, []);
  const pinnedChats = Array.isArray(savedPins)
    ? [...new Set(savedPins)].filter(
        id => typeof id === "string" && chatIds.includes(id)
      )
    : [];

  const workspace = readSavedWorkspace();

  const selectedAgent =
    everyAgent.find(agent => agent.id === workspace.selectedAgentId) || null;

  const detailsAgent = selectedAgent
    ? null
    : everyAgent.find(agent => agent.id === workspace.detailsAgentId) || null;

  let activeChatId = null;

  if (selectedAgent) {
    const agentChats = sortChats(
      chats.filter(chat => chat.agentId === selectedAgent.id),
      pinnedChats
    );

    const savedChat = agentChats.find(
      chat => chat.id === workspace.activeChatId
    );

    activeChatId = (savedChat || agentChats[0])?.id || null;
  }

  const historyMode =
    !selectedAgent && !detailsAgent && workspace.historyMode === true;

  return {
    customAgents,
    chats,
    pinnedChats,
    selectedAgent,
    detailsAgent,
    activeChatId,
    historyMode
  };
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

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDateTime(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
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

function makeTitle(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 35 ? `${clean.slice(0, 35)}...` : clean;
}

function toFileSlug(text) {
  return (
    text.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") ||
    "conversation"
  );
}

function normalizeReply(result) {
  const reply =
    typeof result === "string"
      ? result
      : result?.reply || result?.message || "";

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("The agent returned an empty response. Please retry.");
  }

  return reply;
}

function validateAgentFields(fields, everyAgent, ignoreId = null) {
  const name = fields.name.trim();
  const description = fields.description.trim();
  const instructions = fields.instructions.trim();

  if (!name || !description || !instructions) {
    return "Please complete all fields.";
  }

  if (name.length > MAX_NAME) {
    return `Name must be ${MAX_NAME} characters or fewer.`;
  }

  if (description.length > MAX_DESCRIPTION) {
    return `Description must be ${MAX_DESCRIPTION} characters or fewer.`;
  }

  if (instructions.length > MAX_INSTRUCTIONS) {
    return `Instructions must be ${MAX_INSTRUCTIONS} characters or fewer.`;
  }

  const duplicate = everyAgent.some(
    agent =>
      agent.id !== ignoreId &&
      agent.name.toLowerCase() === name.toLowerCase()
  );

  return duplicate ? "An agent with this name already exists." : "";
}

/* ------------------------------------------------------------------ */
/* SMALL COMPONENTS (defined outside App so they never remount)        */
/* ------------------------------------------------------------------ */

function AgentCard({ agent, onOpen, onEdit, onDelete }) {
  const Icon = agent.icon || Bot;

  return (
    <article className="agent-card">
      <div className="agent-top">
        <div className="agent-icon" style={{ color: agent.color }}>
          <Icon size={27} />
        </div>
        <span className="agent-status">{agent.status}</span>
      </div>

      <p className="agent-category">{agent.category}</p>
      <h3>{agent.name}</h3>

      <p className="agent-description">{agent.description}</p>

      <button
        type="button"
        className="agent-link"
        onClick={() => onOpen(agent)}
      >
        Explore Agent
        <ArrowUpRight size={16} />
      </button>

      {agent.isCustom && (
        <div className="agent-management-actions">
          <button type="button" onClick={() => onEdit(agent)}>
            <Pencil size={15} /> Edit
          </button>

          <button type="button" onClick={() => onDelete(agent)}>
            <Trash2 size={15} /> Delete
          </button>
        </div>
      )}
    </article>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function RenameModal({ chat, onClose, onSave }) {
  const [value, setValue] = useState(chat.title);
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();

    const clean = value.trim();

    if (!clean) {
      setError("Conversation name cannot be empty.");
      return;
    }

    if (clean.length > MAX_TITLE) {
      setError(`Maximum ${MAX_TITLE} characters allowed.`);
      return;
    }

    onSave(clean);
  }

  return (
    <Modal title="Rename conversation" onClose={onClose}>
      <form className="agent-builder-form modal-form" onSubmit={submit}>
        <label className="field">
          <span>Conversation name</span>
          <input
            value={value}
            onChange={event => setValue(event.target.value)}
            maxLength={MAX_TITLE}
            autoFocus
          />
        </label>

        {error && <p className="error-message" role="alert">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>

          <button type="submit" className="primary-button">
            Save name
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditAgentModal({ agent, allAgents, onClose, onSave }) {
  const [name, setName] = useState(agent.name);
  const [category, setCategory] = useState(agent.category);
  const [description, setDescription] = useState(agent.description);
  const [instructions, setInstructions] = useState(agent.instructions || "");
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();

    const problem = validateAgentFields(
      { name, description, instructions },
      allAgents,
      agent.id
    );

    if (problem) {
      setError(problem);
      return;
    }

    onSave({
      name: name.trim(),
      category,
      description: description.trim(),
      instructions: instructions.trim()
    });
  }

  return (
    <Modal title="Edit agent" onClose={onClose}>
      <form className="agent-builder-form modal-form" onSubmit={submit}>
        <label className="field">
          <span>Agent name</span>
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            maxLength={MAX_NAME}
            autoFocus
          />
        </label>

        <label className="field">
          <span>Industry</span>
          <select
            value={category}
            onChange={event => setCategory(event.target.value)}
          >
            {customCategories.map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Agent description</span>
          <textarea
            value={description}
            onChange={event => setDescription(event.target.value)}
            rows={3}
            maxLength={MAX_DESCRIPTION}
          />
        </label>

        <label className="field">
          <span>Agent instructions</span>
          <textarea
            value={instructions}
            onChange={event => setInstructions(event.target.value)}
            rows={5}
            maxLength={MAX_INSTRUCTIONS}
          />
          <small>Maximum {MAX_INSTRUCTIONS} characters.</small>
        </label>

        {error && <p className="error-message" role="alert">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>

          <button type="submit" className="primary-button">
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* MAIN APP                                                            */
/* ------------------------------------------------------------------ */

export default function App() {
  const [initial] = useState(loadInitialState);

  const [customAgents, setCustomAgents] = useState(initial.customAgents);
  const [chats, setChats] = useState(initial.chats);
  const [pinnedChats, setPinnedChats] = useState(initial.pinnedChats);

  const [selectedAgent, setSelectedAgent] = useState(initial.selectedAgent);
  const [detailsAgent, setDetailsAgent] = useState(initial.detailsAgent);
  const [activeChatId, setActiveChatId] = useState(initial.activeChatId);
  const [historyMode, setHistoryMode] = useState(initial.historyMode);

  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showCustomOnly, setShowCustomOnly] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [loadingChatId, setLoadingChatId] = useState(null);
  const [chatError, setChatError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [notice, setNotice] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const [renameTarget, setRenameTarget] = useState(null);
  const [editAgentTarget, setEditAgentTarget] = useState(null);

  const [agentName, setAgentName] = useState("");
  const [agentCategory, setAgentCategory] = useState("Healthcare");
  const [agentDescription, setAgentDescription] = useState("");
  const [agentInstructions, setAgentInstructions] = useState("");
  const [createError, setCreateError] = useState("");

  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("All");

  const [chatSearch, setChatSearch] = useState("");
  const [showChatSearch, setShowChatSearch] = useState(false);

  const messagesContainerRef = useRef(null);
  const activeChatIdRef = useRef(activeChatId);
  const noticeTimerRef = useRef(null);

  const allAgents = useMemo(
    () => [...agents, ...customAgents],
    [customAgents]
  );

  const activeChat = useMemo(
    () => chats.find(chat => chat.id === activeChatId) || null,
    [chats, activeChatId]
  );

  const messages = activeChat?.messages ?? EMPTY_MESSAGES;

  // Only one reply can be requested at a time.
  const isBusy = loadingChatId !== null;
  const isLoadingHere = loadingChatId !== null && loadingChatId === activeChatId;

  /* ---------------- SAVE DATA ---------------- */

  useEffect(() => {
    const saved = saveStorage(STORAGE_KEY, chats);

    setStorageError(
      saved
        ? ""
        : "Browser storage is full or unavailable. Export your conversations so you do not lose them."
    );
  }, [chats]);

  useEffect(() => {
    saveStorage(
      CUSTOM_AGENTS_KEY,
      customAgents.map(({ icon, ...agent }) => agent)
    );
  }, [customAgents]);

  useEffect(() => {
    saveStorage(PINNED_KEY, pinnedChats);
  }, [pinnedChats]);

  useEffect(() => {
    saveStorage(WORKSPACE_KEY, {
      selectedAgentId: selectedAgent?.id || null,
      detailsAgentId: detailsAgent?.id || null,
      activeChatId: activeChatId || null,
      historyMode
    });
  }, [selectedAgent, detailsAgent, activeChatId, historyMode]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    return () => clearTimeout(noticeTimerRef.current);
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isLoadingHere, activeChatId]);

  function notify(text) {
    setNotice(text);
    clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(""), 3200);
  }

  /* ---------------- DERIVED DATA ---------------- */

  const totalMessages = chats.reduce(
    (total, chat) => total + chat.messages.length,
    0
  );

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

  const globalHistory = useMemo(() => {
    const term = historySearch.toLowerCase().trim();

    const matching = chats.filter(chat => {
      const agent = allAgents.find(item => item.id === chat.agentId);

      const matchesAgent =
        historyFilter === "All" || agent?.category === historyFilter;

      const searchableText = [
        chat.title,
        agent?.name || "",
        ...chat.messages.map(item => item.text)
      ].join(" ").toLowerCase();

      return matchesAgent && (!term || searchableText.includes(term));
    });

    return sortChats(matching, pinnedChats);
  }, [chats, allAgents, historySearch, historyFilter, pinnedChats]);

  const agentChats = useMemo(
    () =>
      sortChats(
        chats.filter(chat => chat.agentId === selectedAgent?.id),
        pinnedChats
      ),
    [chats, selectedAgent, pinnedChats]
  );

  const chatSearchTerm = chatSearch.trim().toLowerCase();

  const visibleMessages = chatSearchTerm
    ? messages.filter(item => item.text.toLowerCase().includes(chatSearchTerm))
    : messages;

  const lastMessage = messages[messages.length - 1];
  const needsReply = Boolean(activeChat) && lastMessage?.role === "user";
  const showRetry = !isLoadingHere && (Boolean(chatError) || needsReply);

  /* ---------------- NAVIGATION ---------------- */

  function resetChatUi() {
    setMessage("");
    setChatError("");
    setCopiedId(null);
    setEditingId(null);
    setChatSearch("");
    setShowChatSearch(false);
    setMobileMenu(false);
  }

  function showDashboard() {
    setSelectedAgent(null);
    setDetailsAgent(null);
    setActiveChatId(null);
    setHistoryMode(false);
    resetChatUi();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showGlobalHistory() {
    setSelectedAgent(null);
    setDetailsAgent(null);
    setHistoryMode(true);
    setActiveChatId(null);
    resetChatUi();
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
    resetChatUi();
  }

  function openAgent(agent) {
    setDetailsAgent(agent);
    setSelectedAgent(null);
    setHistoryMode(false);
    setActiveChatId(null);
    resetChatUi();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openExistingChat(chat) {
    const agent = allAgents.find(item => item.id === chat.agentId);
    if (!agent) return;

    setSelectedAgent(agent);
    setDetailsAgent(null);
    setHistoryMode(false);
    setActiveChatId(chat.id);
    resetChatUi();
  }

  function closeAgent() {
    showDashboard();
  }

  /* ---------------- PINS ---------------- */

  function togglePin(chatId) {
    setPinnedChats(previous =>
      previous.includes(chatId)
        ? previous.filter(id => id !== chatId)
        : [...previous, chatId]
    );
  }

  /* ---------------- CUSTOM AGENTS ---------------- */

  function handleEditCustomAgent(agent) {
    if (agent?.isCustom) setEditAgentTarget(agent);
  }

  function saveEditedAgent(values) {
    const target = editAgentTarget;
    if (!target) return;

    const updatedAgent = {
      ...target,
      ...values,
      icon: categoryIcons[values.category],
      color: categoryColors[values.category]
    };

    setCustomAgents(previous =>
      previous.map(item => (item.id === target.id ? updatedAgent : item))
    );

    if (detailsAgent?.id === target.id) setDetailsAgent(updatedAgent);
    if (selectedAgent?.id === target.id) setSelectedAgent(updatedAgent);

    setEditAgentTarget(null);
    notify("Agent updated.");
  }

  function handleDeleteCustomAgent(agent) {
    if (!agent?.isCustom) return;

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

    if (selectedAgent?.id === agent.id || detailsAgent?.id === agent.id) {
      showDashboard();
    }

    notify("Agent deleted.");
  }

  function handleCreateAgent(event) {
    event.preventDefault();

    const problem = validateAgentFields(
      {
        name: agentName,
        description: agentDescription,
        instructions: agentInstructions
      },
      allAgents
    );

    if (problem) {
      setCreateError(problem);
      return;
    }

    const newAgent = {
      id: `custom-${generateId()}`,
      name: agentName.trim(),
      category: agentCategory,
      description: agentDescription.trim(),
      instructions: agentInstructions.trim(),
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

  /* ---------------- AI REPLY (shared by send, edit and retry) ---------------- */

  async function requestReply(chatId, agent, question, history) {
    setLoadingChatId(chatId);
    setChatError("");

    try {
      const result = await getAgentReply(
        agent.name,
        question,
        agent.instructions || "",
        history
      );

      const assistantMessage = {
        id: generateId(),
        role: "assistant",
        text: normalizeReply(result),
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

      // Show the error only if the person is still looking at this chat.
      // Otherwise the chat itself shows a "no reply yet" retry notice later.
      if (activeChatIdRef.current === chatId) {
        setChatError(
          error?.message || "Unable to connect to AI. Please try again."
        );
      }
    } finally {
      setLoadingChatId(null);
    }
  }

  /* ---------------- SEND MESSAGE ---------------- */

  function sendMessage(event) {
    event.preventDefault();

    const question = message.trim();

    if (!question || !selectedAgent || !activeChat || isBusy) return;

    const chatId = activeChat.id;
    const history = activeChat.messages;
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

        const isFirstUserMessage = !chat.messages.some(
          item => item.role === "user"
        );

        return {
          ...chat,
          title:
            isFirstUserMessage && chat.title === DEFAULT_TITLE
              ? makeTitle(question)
              : chat.title,
          updatedAt: now,
          messages: [...chat.messages, userMessage]
        };
      })
    );

    setMessage("");
    requestReply(chatId, selectedAgent, question, history);
  }

  /* ---------------- EDIT MESSAGE (inline) ---------------- */

  function startEdit(item) {
    if (isLoadingHere || item.role !== "user") return;

    setEditingId(item.id);
    setEditText(item.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  function saveEdit(item) {
    if (!activeChat || !selectedAgent || isBusy) return;

    const cleanText = editText.trim();

    if (!cleanText) {
      notify("Message cannot be empty.");
      return;
    }

    if (cleanText === item.text) {
      cancelEdit();
      return;
    }

    const index = activeChat.messages.findIndex(
      messageItem => messageItem.id === item.id
    );

    if (index === -1) {
      cancelEdit();
      return;
    }

    const chatId = activeChat.id;
    const history = activeChat.messages.slice(0, index);

    setChats(previous =>
      previous.map(chat =>
        chat.id !== chatId
          ? chat
          : {
              ...chat,
              updatedAt: Date.now(),
              messages: [
                ...chat.messages.slice(0, index),
                { ...item, text: cleanText, edited: true }
              ]
            }
      )
    );

    cancelEdit();
    requestReply(chatId, selectedAgent, cleanText, history);
  }

  /* ---------------- DELETE MESSAGE ---------------- */

  function deleteMessage(messageId) {
    if (!activeChatId || isLoadingHere) return;

    setChats(previous =>
      previous.map(chat =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: chat.messages.filter(item => item.id !== messageId),
              updatedAt: Date.now()
            }
          : chat
      )
    );
  }

  /* ---------------- CLEAR CURRENT CHAT ---------------- */

  function clearCurrentChat() {
    if (!activeChat || !selectedAgent || isLoadingHere) return;

    if (!window.confirm("Clear all messages in this conversation?")) return;

    const freshChat = createChat(selectedAgent);

    setChats(previous =>
      previous.map(chat =>
        chat.id === activeChat.id
          ? { ...freshChat, id: chat.id, createdAt: chat.createdAt }
          : chat
      )
    );

    setMessage("");
    setChatError("");
    setCopiedId(null);
    setEditingId(null);
  }

  /* ---------------- DELETE CHATS ---------------- */

  function deleteChat(chatId) {
    const chat = chats.find(item => item.id === chatId);
    if (!chat) return;

    if (!window.confirm("Delete this conversation permanently?")) return;

    const remaining = sortChats(
      chats.filter(
        item => item.id !== chatId && item.agentId === chat.agentId
      ),
      pinnedChats
    );

    setChats(previous => previous.filter(item => item.id !== chatId));
    setPinnedChats(previous => previous.filter(id => id !== chatId));

    if (chatId === activeChatId) {
      // Stay in the same agent workspace. Open the next chat for that
      // agent, or show the empty state with a "New Chat" button.
      setActiveChatId(remaining[0]?.id || null);
      setMessage("");
      setChatError("");
      setEditingId(null);
    }
  }

  // Deletes only the conversations that belong to one agent.
  function clearAgentChats(agent) {
    if (!agent) return;

    const ids = chats
      .filter(chat => chat.agentId === agent.id)
      .map(chat => chat.id);

    if (!ids.length) return;

    const confirmed = window.confirm(
      `Delete all ${ids.length} conversation(s) with ${agent.name}? Other agents are not affected.`
    );

    if (!confirmed) return;

    setChats(previous => previous.filter(chat => chat.agentId !== agent.id));
    setPinnedChats(previous => previous.filter(id => !ids.includes(id)));

    if (activeChatId && ids.includes(activeChatId)) {
      setActiveChatId(null);
    }

    setMessage("");
    setChatError("");
    setEditingId(null);
    notify(`Cleared conversations with ${agent.name}.`);
  }

  // Deletes every conversation for every agent.
  function clearAllChats() {
    if (!chats.length) return;

    if (!window.confirm("Delete ALL conversations for ALL agents permanently?")) {
      return;
    }

    setChats([]);
    setPinnedChats([]);
    setActiveChatId(null);
    setSelectedAgent(null);
    setDetailsAgent(null);
    setHistoryMode(true);
    setMessage("");
    setChatError("");
    setEditingId(null);
    notify("All conversations deleted.");
  }

  /* ---------------- RENAME ---------------- */

  function renameChat(chat) {
    setRenameTarget(chat);
  }

  function saveRename(title) {
    const target = renameTarget;
    if (!target) return;

    setChats(previous =>
      previous.map(item =>
        item.id === target.id
          ? { ...item, title, updatedAt: Date.now() }
          : item
      )
    );

    setRenameTarget(null);
  }

  /* ---------------- COPY ---------------- */

  async function copyMessage(item) {
    const success = await copyText(item.text);

    if (success) {
      setCopiedId(item.id);

      setTimeout(() => {
        setCopiedId(current => (current === item.id ? null : current));
      }, 1800);
    } else {
      notify("Could not copy this message.");
    }
  }

  /* ---------------- REGENERATE / RETRY ---------------- */

  function regenerateResponse() {
    if (!activeChat || !selectedAgent || isBusy) return;

    const lastUserIndex = activeChat.messages
      .map(item => item.role)
      .lastIndexOf("user");

    if (lastUserIndex === -1) return;

    const chatId = activeChat.id;
    const question = activeChat.messages[lastUserIndex].text;
    const history = activeChat.messages.slice(0, lastUserIndex);

    setChats(previous =>
      previous.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: chat.messages.slice(0, lastUserIndex + 1) }
          : chat
      )
    );

    requestReply(chatId, selectedAgent, question, history);
  }

  /* ---------------- EXPORT ---------------- */

  function exportConversation(chat) {
    if (!chat) return;

    const agent = allAgents.find(item => item.id === chat.agentId);

    const content = [
      "VERTICAL AI PLATFORM",
      `Agent: ${agent?.name || "Unknown Agent"}`,
      `Conversation: ${chat.title}`,
      `Date: ${formatDateTime(chat.createdAt)}`,
      "",
      ...chat.messages.map(
        item =>
          `${item.role.toUpperCase()} (${formatTime(item.createdAt)}):\n${item.text}\n`
      )
    ].join("\n");

    downloadFile(`vertical-ai-${toFileSlug(chat.title)}.txt`, content);
  }

  function exportAllChats() {
    if (!chats.length) {
      notify("No conversations to export.");
      return;
    }

    const content = chats
      .map(chat => {
        const agent = allAgents.find(item => item.id === chat.agentId);

        return [
          `AGENT: ${agent?.name || "Unknown"}`,
          `CONVERSATION: ${chat.title}`,
          `DATE: ${formatDateTime(chat.createdAt)}`,
          "",
          ...chat.messages.map(
            item => `${item.role.toUpperCase()}:\n${item.text}\n`
          )
        ].join("\n");
      })
      .join("\n\n============================\n\n");

    downloadFile("vertical-ai-all-conversations.txt", content);
  }

  function exportAllChatsJSON() {
    if (!chats.length) {
      notify("No conversations to export.");
      return;
    }

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

  /* ---------------- RENDER ---------------- */

  const detailInfo = detailsAgent
    ? agentDetails[detailsAgent.id] || genericDetails
    : null;

  const DetailsIcon = detailsAgent?.icon || Bot;
  const SelectedIcon = selectedAgent?.icon || Bot;

  const recentChats = [...chats]
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 3);

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
            type="button"
            className="close-menu"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <p className="nav-label">Menu</p>

        <nav>
          <button
            type="button"
            className={`nav-item ${
              !selectedAgent && !detailsAgent && !historyMode ? "active" : ""
            }`}
            onClick={showDashboard}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => navigateTo("agents")}
          >
            <Compass size={19} />
            Explore Agents
          </button>

          <button
            type="button"
            className={`nav-item ${historyMode ? "active" : ""}`}
            onClick={showGlobalHistory}
          >
            <MessagesSquare size={19} />
            All Conversations
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => navigateTo("create")}
          >
            <Plus size={19} />
            Create AI Agent
          </button>
        </nav>

        {selectedAgent && (
          <div className="history-panel">
            <div className="history-title">
              <span><History size={16} /> Chat History</span>

              <button
                type="button"
                title="New Chat"
                aria-label="New chat"
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
                      type="button"
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
                      type="button"
                      className="history-delete"
                      title="Rename"
                      aria-label={`Rename ${chat.title}`}
                      onClick={() => renameChat(chat)}
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      type="button"
                      className="history-delete"
                      title="Pin / Unpin"
                      aria-label={`Pin or unpin ${chat.title}`}
                      onClick={() => togglePin(chat.id)}
                    >
                      {pinnedChats.includes(chat.id)
                        ? <PinOff size={13} />
                        : <Pin size={13} />}
                    </button>

                    <button
                      type="button"
                      className="history-delete"
                      title="Delete"
                      aria-label={`Delete ${chat.title}`}
                      onClick={() => deleteChat(chat.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {agentChats.length > 0 && (
              <button
                type="button"
                className="clear-history-button"
                onClick={() => clearAgentChats(selectedAgent)}
              >
                <Trash2 size={14} />
                Clear {selectedAgent.name} history
              </button>
            )}
          </div>
        )}

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <Sparkles size={23} />
            <h3>Build with AI</h3>
            <p>Create intelligent agents for your business.</p>

            <button type="button" onClick={() => navigateTo("create")}>
              Get Started
              <ArrowUpRight size={15} />
            </button>
          </div>

          <p className="version">Vertical AI Platform · V5.0</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">
        <header className="topbar">
          <button
            type="button"
            className="menu-button"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            <Menu />
          </button>

          <div className="breadcrumb">
            Platform <span>/</span>{" "}
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
            <span className="online-text">Demo mode</span>
            <div className="avatar">V</div>
          </div>
        </header>

        {storageError && (
          <div className="storage-banner" role="alert">
            {storageError}
          </div>
        )}

        {/* AGENT DETAILS */}

        {detailsAgent ? (
          <section className="agent-details-page">
            <button
              type="button"
              className="details-back-button"
              onClick={closeAgent}
            >
              <ArrowLeft size={18} />
              Back to Marketplace
            </button>

            <div className="details-hero">
              <div
                className="details-agent-icon"
                style={{ color: detailsAgent.color }}
              >
                <DetailsIcon size={38} />
              </div>

              <p className="details-category">
                {detailsAgent.category} AI agent
              </p>

              <h1>{detailsAgent.name}</h1>
              <p className="details-description">{detailsAgent.description}</p>

              <button
                type="button"
                className="primary-button details-use-button"
                onClick={() => createNewChat(detailsAgent)}
              >
                <Sparkles size={18} />
                Use This Agent
                <ArrowUpRight size={18} />
              </button>

              {detailsAgent.isCustom && (
                <div className="agent-management-actions details-management">
                  <button
                    type="button"
                    onClick={() => handleEditCustomAgent(detailsAgent)}
                  >
                    <Pencil size={16} /> Edit Agent
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCustomAgent(detailsAgent)}
                  >
                    <Trash2 size={16} /> Delete Agent
                  </button>
                </div>
              )}
            </div>

            <div className="details-section">
              <h2>Key Features</h2>

              <div className="details-feature-grid">
                {detailInfo.features.map(feature => (
                  <div className="details-feature-card" key={feature}>
                    <Check size={19} />
                    <p>{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="details-section">
              <h2>What Can You Do With This Agent?</h2>

              <div className="details-feature-grid">
                {detailInfo.uses.map(use => (
                  <div className="details-feature-card" key={use}>
                    <Sparkles size={19} />
                    <p>{use}</p>
                  </div>
                ))}
              </div>
            </div>

            {detailsAgent.isCustom && (
              <div className="chat-notice">
                <strong>Your agent instructions</strong>
                <p>{detailsAgent.instructions}</p>
              </div>
            )}

            <div className="chat-notice">
              Replies are currently demo responses. Real AI responses will work once the backend is connected.
            </div>
          </section>

        ) : selectedAgent ? (

          /* CHAT WORKSPACE */

          <section className="chat-page">
            <div className="workspace-toolbar">
              <button type="button" className="back-button" onClick={closeAgent}>
                <ArrowLeft size={18} />
                <span>Dashboard</span>
              </button>

              <div className="workspace-toolbar-actions">
                <button
                  type="button"
                  className="tool-button"
                  onClick={() => createNewChat(selectedAgent)}
                  aria-label="New chat"
                >
                  <MessageSquarePlus size={17} />
                  <span className="btn-label">New Chat</span>
                </button>

                {activeChat && (
                  <>
                    <button
                      type="button"
                      className="tool-button"
                      onClick={() => renameChat(activeChat)}
                      aria-label="Rename conversation"
                    >
                      <Pencil size={16} />
                      <span className="btn-label">Rename</span>
                    </button>

                    <button
                      type="button"
                      className="tool-button"
                      onClick={() => exportConversation(activeChat)}
                      aria-label="Export conversation"
                    >
                      <Download size={16} />
                      <span className="btn-label">Export</span>
                    </button>

                    <button
                      type="button"
                      className="tool-button"
                      onClick={() => setShowChatSearch(!showChatSearch)}
                      aria-label="Search messages"
                    >
                      <Search size={16} />
                      <span className="btn-label">Search</span>
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
                <SelectedIcon size={28} />
              </div>

              <div className="agent-heading-info">
                <h1>{selectedAgent.name}</h1>
                <p>
                  {activeChat ? activeChat.title : `${selectedAgent.category} AI Assistant`}
                </p>
              </div>

              <span className="demo-badge">Demo</span>
            </div>

            {showChatSearch && (
              <div className="search-box">
                <Search size={18} />

                <input
                  placeholder="Search messages in this conversation..."
                  aria-label="Search messages in this conversation"
                  value={chatSearch}
                  onChange={event => setChatSearch(event.target.value)}
                />

                <button
                  type="button"
                  aria-label="Close message search"
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
                  onChange={event => {
                    const nextAgent = allAgents.find(
                      item => item.id === event.target.value
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
              Conversations are saved in this browser only. Backend database storage has not been connected yet.
            </div>

            {activeChat ? (
              <>
                {/* MESSAGES */}

                <div
                  className="chat-messages"
                  ref={messagesContainerRef}
                  aria-live="polite"
                >
                  {visibleMessages.length === 0 ? (
                    <p className="history-empty">
                      {chatSearchTerm
                        ? "No matching messages found."
                        : "No messages in this conversation. Send a message to start."}
                    </p>
                  ) : (
                    visibleMessages.map(item => (
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
                            {editingId === item.id ? (
                              <div className="edit-box">
                                <textarea
                                  value={editText}
                                  onChange={event => setEditText(event.target.value)}
                                  rows={3}
                                  aria-label="Edit your message"
                                  autoFocus
                                />

                                <p className="edit-hint">
                                  Saving replaces the replies after this message with a new one.
                                </p>

                                <div className="edit-actions">
                                  <button
                                    type="button"
                                    className="primary-button small"
                                    onClick={() => saveEdit(item)}
                                    disabled={isBusy}
                                  >
                                    Save and resend
                                  </button>

                                  <button
                                    type="button"
                                    className="secondary-button small"
                                    onClick={cancelEdit}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p>{item.text}</p>
                            )}
                          </div>

                          {editingId !== item.id && (
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

                              <button
                                type="button"
                                onClick={() => copyMessage(item)}
                                title="Copy message"
                              >
                                {copiedId === item.id
                                  ? <Check size={14} />
                                  : <Copy size={14} />}
                                {copiedId === item.id ? "Copied" : "Copy"}
                              </button>

                              {item.role === "user" && (
                                <button
                                  type="button"
                                  onClick={() => startEdit(item)}
                                  disabled={isLoadingHere}
                                  title="Edit message"
                                >
                                  <Pencil size={14} />
                                  Edit
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => deleteMessage(item.id)}
                                disabled={isLoadingHere}
                                title="Delete message"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {isLoadingHere && (
                    <div className="loading-message" role="status">
                      <RefreshCw size={16} />
                      AI Agent is thinking...
                    </div>
                  )}

                  {showRetry && (
                    <div className="error-message" role="alert">
                      <span>
                        {chatError || "The last message has no reply yet."}
                      </span>

                      <button
                        type="button"
                        onClick={regenerateResponse}
                        disabled={isBusy}
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
                    onChange={event => setMessage(event.target.value)}
                    placeholder={
                      isBusy && !isLoadingHere
                        ? "Another reply is in progress..."
                        : `Ask ${selectedAgent.name}...`
                    }
                    aria-label="Type your message"
                  />

                  <button
                    type="submit"
                    disabled={!message.trim() || isBusy}
                    aria-label="Send message"
                  >
                    <Send size={19} />
                  </button>
                </form>

                <div className="workspace-bottom-actions">
                  <button
                    type="button"
                    onClick={clearCurrentChat}
                    disabled={isLoadingHere}
                  >
                    <Trash2 size={15} />
                    Clear Current Chat
                  </button>

                  <button
                    type="button"
                    onClick={regenerateResponse}
                    disabled={
                      isBusy ||
                      !messages.some(item => item.role === "user")
                    }
                  >
                    <RefreshCw size={15} />
                    Regenerate Response
                  </button>

                  <button type="button" onClick={() => togglePin(activeChat.id)}>
                    {pinnedChats.includes(activeChat.id)
                      ? <PinOff size={15} />
                      : <Pin size={15} />}
                    {pinnedChats.includes(activeChat.id) ? "Unpin" : "Pin Chat"}
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-message">
                <MessageSquarePlus size={35} />
                <h3>No conversation open</h3>

                <p>
                  Start a new conversation with {selectedAgent.name}
                  {agentChats.length > 0 ? ", or pick one from Chat History." : "."}
                </p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => createNewChat(selectedAgent)}
                >
                  <MessageSquarePlus size={17} />
                  New Chat
                </button>
              </div>
            )}

            <p className="chat-footer">
              Vertical AI Platform · Agent Workspace V5.0
            </p>
          </section>

        ) : historyMode ? (

          /* GLOBAL HISTORY */

          <section className="agents-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Your workspace</p>
                <h2>All Conversations</h2>
                <p>Manage conversations from all your AI agents.</p>
              </div>

              <div className="workspace-toolbar-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={exportAllChats}
                  disabled={!chats.length}
                >
                  <Download size={17} />
                  Export All TXT
                </button>

                <button
                  type="button"
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
                aria-label="Search conversations"
                value={historySearch}
                onChange={event => setHistorySearch(event.target.value)}
              />

              {historySearch && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setHistorySearch("")}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="category-list">
              {categories.map(category => (
                <button
                  type="button"
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
                    type="button"
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
                  const last = chat.messages[chat.messages.length - 1];

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

                        <span>{last?.text?.slice(0, 100) || "No messages"}</span>

                        <small>
                          {formatDateTime(chat.updatedAt || chat.createdAt)}
                        </small>
                      </div>

                      <div className="global-history-actions">
                        <button
                          type="button"
                          title="Open conversation"
                          aria-label="Open conversation"
                          onClick={() => openExistingChat(chat)}
                        >
                          <ExternalLink size={17} />
                        </button>

                        <button
                          type="button"
                          title="Pin or unpin conversation"
                          aria-label="Pin or unpin conversation"
                          onClick={() => togglePin(chat.id)}
                        >
                          {pinnedChats.includes(chat.id)
                            ? <PinOff size={17} />
                            : <Pin size={17} />}
                        </button>

                        <button
                          type="button"
                          title="Rename conversation"
                          aria-label="Rename conversation"
                          onClick={() => renameChat(chat)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          title="Export conversation"
                          aria-label="Export conversation"
                          onClick={() => exportConversation(chat)}
                        >
                          <Download size={17} />
                        </button>

                        <button
                          type="button"
                          title="Delete conversation"
                          aria-label="Delete conversation"
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

            {chats.length > 0 && (
              <div className="workspace-bottom-actions">
                <button type="button" onClick={clearAllChats}>
                  <Trash2 size={15} />
                  Delete All Conversations
                </button>
              </div>
            )}
          </section>

        ) : (

          /* DASHBOARD */

          <>
            <section className="welcome-section" id="dashboard">
              <div>
                <div className="eyebrow">
                  <Sparkles size={15} />
                  The future of business AI
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

              <div className="hero-visual" aria-hidden="true">
                <div className="hero-ring hero-ring-one"></div>
                <div className="hero-ring hero-ring-two"></div>

                <div className="hero-core"><Bot size={56} /></div>

                <div className="floating-icon icon-one"><HeartPulse size={22} /></div>
                <div className="floating-icon icon-two"><Sprout size={22} /></div>
                <div className="floating-icon icon-three"><Landmark size={22} /></div>
              </div>
            </section>

            {/* STATISTICS */}

            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple"><Bot /></div>
                <div>
                  <p>AI agents</p>
                  <h2>{String(allAgents.length).padStart(2, "0")}</h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green"><MessagesSquare /></div>
                <div>
                  <p>Conversations</p>
                  <h2>{String(chats.length).padStart(2, "0")}</h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue"><MessageSquare /></div>
                <div>
                  <p>Total messages</p>
                  <h2>{String(totalMessages).padStart(2, "0")}</h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple"><Zap /></div>
                <div>
                  <p>Industries</p>
                  <h2>{String(customCategories.length).padStart(2, "0")}</h2>
                </div>
              </div>
            </section>

            {/* RECENT CONVERSATIONS */}

            {recentChats.length > 0 && (
              <section className="agents-section">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Recent activity</p>
                    <h2>Recent Conversations</h2>
                    <p>Continue where you left off.</p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={showGlobalHistory}
                  >
                    View All
                    <ArrowUpRight size={16} />
                  </button>
                </div>

                <div className="global-history-list">
                  {recentChats.map(chat => {
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
                            {formatDateTime(chat.updatedAt || chat.createdAt)}
                          </small>
                        </div>

                        <button
                          type="button"
                          className="tool-button"
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
                  <p className="eyebrow">AI marketplace</p>
                  <h2>Explore AI Agents</h2>
                  <p>Find the right intelligence for your business.</p>
                </div>
              </div>

              <div className="search-box">
                <Search size={20} />

                <input
                  placeholder="Search AI agents or industries..."
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  aria-label="Search AI agents"
                />

                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="category-list">
                {categories.map(category => (
                  <button
                    type="button"
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
                  type="button"
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
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onOpen={openAgent}
                    onEdit={handleEditCustomAgent}
                    onDelete={handleDeleteCustomAgent}
                  />
                ))}

                {filteredAgents.length === 0 && (
                  <p className="empty-message">
                    No agents found. Try another search or filter.
                  </p>
                )}
              </div>
            </section>

            {/* CREATE AGENT INTRO */}

            <section className="create-section" id="create">
              <div className="create-icon"><Sparkles size={30} /></div>

              <div className="create-text">
                <p className="eyebrow">Build your own</p>
                <h2>Create Your Custom AI Agent</h2>
                <p>
                  Design an intelligent assistant tailored to your business needs.
                </p>
              </div>

              <button
                type="button"
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

            <section className="create-section builder" id="agent-builder">
              <div className="create-icon"><Bot size={30} /></div>

              <div className="create-text">
                <p className="eyebrow">Custom agent builder</p>
                <h2>Build Your Own AI Agent</h2>

                <p>
                  Enter details and instructions for your personalized assistant.
                </p>

                <form onSubmit={handleCreateAgent} className="agent-builder-form">
                  <label className="field">
                    <span>Agent name</span>
                    <input
                      value={agentName}
                      onChange={event => setAgentName(event.target.value)}
                      placeholder="Example: My Business Assistant"
                      maxLength={MAX_NAME}
                    />
                  </label>

                  <label className="field">
                    <span>Industry</span>
                    <select
                      value={agentCategory}
                      onChange={event => setAgentCategory(event.target.value)}
                    >
                      {customCategories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Agent description</span>
                    <textarea
                      value={agentDescription}
                      onChange={event => setAgentDescription(event.target.value)}
                      placeholder="Describe what your AI agent should help with..."
                      rows={3}
                      maxLength={MAX_DESCRIPTION}
                    />
                  </label>

                  <label className="field">
                    <span>Agent instructions</span>
                    <textarea
                      value={agentInstructions}
                      onChange={event => setAgentInstructions(event.target.value)}
                      placeholder="Explain how your AI agent should behave..."
                      rows={5}
                      maxLength={MAX_INSTRUCTIONS}
                    />
                    <small>Maximum {MAX_INSTRUCTIONS} characters.</small>
                  </label>

                  {createError && (
                    <p className="error-message" role="alert">{createError}</p>
                  )}

                  <button type="submit" className="primary-button">
                    <Plus size={18} />
                    Create My Agent
                  </button>
                </form>
              </div>
            </section>

            <footer className="site-footer">
              <p>© 2026 Vertical AI Platform. All rights reserved.</p>
              <p>Built for the future of every industry.</p>
            </footer>
          </>
        )}
      </main>

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}

      {renameTarget && (
        <RenameModal
          chat={renameTarget}
          onClose={() => setRenameTarget(null)}
          onSave={saveRename}
        />
      )}

      {editAgentTarget && (
        <EditAgentModal
          agent={editAgentTarget}
          allAgents={allAgents}
          onClose={() => setEditAgentTarget(null)}
          onSave={saveEditedAgent}
        />
      )}
    </div>
  );
}
