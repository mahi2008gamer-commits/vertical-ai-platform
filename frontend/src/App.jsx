import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { getAgentReply, isBackendConfigured } from "./services/agentService";
import AdminDashboard from "./AdminDashboard";
import {
  Search, LayoutDashboard, Compass, Bot, Plus,
  ArrowUpRight, Menu, X, ArrowLeft, ArrowUp,
  HeartPulse, Sprout, Landmark, ShoppingBag,
  Factory, GraduationCap, User, Info,
  MessageSquarePlus, History, Trash2, Copy,
  Check, ChevronDown, Clock, RefreshCw,
  Pencil, Download, Upload, Pin, PinOff,
  RotateCcw, MessagesSquare, ExternalLink, Settings
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* CONSTANTS                                                           */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "vertical-ai-phase4-chats";
const CUSTOM_AGENTS_KEY = "vertical-ai-custom-agents";
const PINNED_KEY = "vertical-ai-pinned-chats";
const WORKSPACE_KEY = "vertical-ai-workspace-state";
const SETTINGS_KEY = "vertical-ai-settings";

const MAX_NAME = 40;
const MAX_DESCRIPTION = 300;
const MAX_INSTRUCTIONS = 1000;
const MAX_TITLE = 60;
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const DEFAULT_TITLE = "New conversation";
const APP_VERSION = "6.0";

const BACKEND_READY = isBackendConfigured();
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
  Healthcare: "#16a34a",
  Agriculture: "#65a30d",
  Finance: "#0284c7",
  Retail: "#9333ea",
  Manufacturing: "#ea580c",
  Education: "#db2777"
};

const safetyNotes = {
  Healthcare:
    "General health information only. This is not medical advice or a diagnosis. In an emergency, contact your local emergency services.",
  Finance:
    "Educational information only. This is not personalised financial advice, and no returns are guaranteed."
};

const agents = [
  {
    id: "medical",
    name: "Medical Assistant",
    category: "Healthcare",
    description: "AI assistant for medical information and patient support.",
    icon: HeartPulse,
    color: categoryColors.Healthcare,
    status: "Popular"
  },
  {
    id: "agriculture",
    name: "Agri Expert AI",
    category: "Agriculture",
    description: "Get farming guidance, crop insights and smart suggestions.",
    icon: Sprout,
    color: categoryColors.Agriculture,
    status: "Featured"
  },
  {
    id: "finance",
    name: "Finance Advisor",
    category: "Finance",
    description: "Understand financial data and business performance.",
    icon: Landmark,
    color: categoryColors.Finance,
    status: "Popular"
  },
  {
    id: "retail",
    name: "Retail Assistant",
    category: "Retail",
    description: "AI support for customers, products and retail operations.",
    icon: ShoppingBag,
    color: categoryColors.Retail,
    status: "New"
  },
  {
    id: "manufacturing",
    name: "Industry Expert",
    category: "Manufacturing",
    description: "Improve industrial workflows and operational efficiency.",
    icon: Factory,
    color: categoryColors.Manufacturing,
    status: "New"
  },
  {
    id: "education",
    name: "Education Tutor",
    category: "Education",
    description: "Personalized learning and student assistance.",
    icon: GraduationCap,
    color: categoryColors.Education,
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

const agentStarters = {
  medical: [
    "What are common causes of headaches?",
    "Explain what blood pressure numbers mean",
    "Help me prepare questions for a doctor visit"
  ],
  agriculture: [
    "Which crops suit red soil in a dry season?",
    "How often should I irrigate tomato plants?",
    "How do I spot early signs of pest damage?"
  ],
  finance: [
    "Help me plan a monthly budget",
    "What is the difference between a SIP and a fixed deposit?",
    "How can I track my business expenses?"
  ],
  retail: [
    "Write a polite reply to a delayed order complaint",
    "How should I organise products in my store?",
    "Suggest ways to avoid running out of stock"
  ],
  manufacturing: [
    "How can I reduce downtime on a production line?",
    "Explain the basics of quality control",
    "What is lean manufacturing?"
  ],
  education: [
    "Explain photosynthesis in simple words",
    "Give me 5 practice questions on fractions",
    "Help me make a weekly study plan"
  ]
};

function getStarters(agent) {
  if (agentStarters[agent.id]) return agentStarters[agent.id];

  const base = agents.find(item => item.category === agent.category);
  return base ? agentStarters[base.id] : [];
}

/* ------------------------------------------------------------------ */
/* STORAGE AND DATA HELPERS                                            */
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

function sanitizeAgents(list) {
  if (!Array.isArray(list)) return [];

  const defaultIds = agents.map(agent => agent.id);
  const seen = new Set();
  const result = [];

  list.forEach(agent => {
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
        text: `Hello! I am ${agent.name}. How can I help you today?`,
        createdAt: now
      }
    ]
  };
}

// Repairs older or partly damaged chats instead of throwing them away.
function sanitizeChat(chat, knownAgentIds) {
  if (!chat || typeof chat !== "object") return null;
  if (typeof chat.id !== "string" || !chat.id) return null;
  if (typeof chat.agentId !== "string") return null;
  if (!knownAgentIds.includes(chat.agentId)) return null;
  if (!Array.isArray(chat.messages)) return null;

  const now = Date.now();

  const messages = chat.messages
    .filter(
      item =>
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

function sanitizeChats(list, knownAgentIds) {
  if (!Array.isArray(list)) return [];

  const seen = new Set();
  const result = [];

  list.forEach(item => {
    const chat = sanitizeChat(item, knownAgentIds);

    if (chat && !seen.has(chat.id)) {
      seen.add(chat.id);
      result.push(chat);
    }
  });

  return result;
}

function sortChats(list, pinnedChats) {
  return [...list].sort((a, b) => {
    const aPinned = pinnedChats.includes(a.id);
    const bPinned = pinnedChats.includes(b.id);

    if (aPinned !== bPinned) return Number(bPinned) - Number(aPinned);

    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
}

function readSavedTheme() {
  const saved = readStorage(SETTINGS_KEY, {});
  const theme = saved && typeof saved === "object" ? saved.theme : null;

  return ["system", "light", "dark"].includes(theme) ? theme : "system";
}

// Reads everything from localStorage once, safely, when the app starts.
function loadInitialState() {
  const customAgents = sanitizeAgents(readStorage(CUSTOM_AGENTS_KEY, []));
  const everyAgent = [...agents, ...customAgents];
  const chats = sanitizeChats(
    readStorage(STORAGE_KEY, []),
    everyAgent.map(agent => agent.id)
  );
  const chatIds = chats.map(chat => chat.id);

  const savedPins = readStorage(PINNED_KEY, []);
  const pinnedChats = Array.isArray(savedPins)
    ? [...new Set(savedPins)].filter(
        id => typeof id === "string" && chatIds.includes(id)
      )
    : [];

  const savedWorkspace = readStorage(WORKSPACE_KEY, {});
  const workspace =
    savedWorkspace &&
    typeof savedWorkspace === "object" &&
    !Array.isArray(savedWorkspace)
      ? savedWorkspace
      : {};

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
    historyMode,
    theme: readSavedTheme()
  };
}

/* ------------------------------------------------------------------ */
/* GENERAL HELPERS                                                     */
/* ------------------------------------------------------------------ */

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

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
/* SAFE MARKDOWN (no HTML is ever rendered)                            */
/* ------------------------------------------------------------------ */

function renderInline(text, keyPrefix) {
  const parts = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let index = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));

    const token = match[0];
    const key = `${keyPrefix}-${index++}`;

    if (token.startsWith("`")) {
      parts.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**")) {
      parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={key}>{token.slice(1, -1)}</em>);
    }

    last = match.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));

  return parts;
}

function parseBlocks(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  const isBullet = line => /^\s*[-*]\s+/.test(line);
  const isNumbered = line => /^\s*\d+[.)]\s+/.test(line);
  const isHeading = line => /^#{1,4}\s+/.test(line);
  const isFence = line => line.trim().startsWith("```");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isFence(line)) {
      const code = [];
      i++;

      while (i < lines.length && !isFence(lines[i])) {
        code.push(lines[i]);
        i++;
      }

      i++;
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    if (isHeading(line)) {
      blocks.push({ type: "heading", text: line.replace(/^#{1,4}\s+/, "") });
      i++;
      continue;
    }

    if (isBullet(line)) {
      const items = [];

      while (i < lines.length && isBullet(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }

      blocks.push({ type: "ul", items });
      continue;
    }

    if (isNumbered(line)) {
      const items = [];

      while (i < lines.length && isNumbered(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }

      blocks.push({ type: "ol", items });
      continue;
    }

    const paragraph = [];

    while (
      i < lines.length &&
      lines[i].trim() &&
      !isFence(lines[i]) &&
      !isHeading(lines[i]) &&
      !isBullet(lines[i]) &&
      !isNumbered(lines[i])
    ) {
      paragraph.push(lines[i]);
      i++;
    }

    blocks.push({ type: "p", lines: paragraph });
  }

  return blocks;
}

function RichText({ text }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);

  return (
    <div className="rich-text">
      {blocks.map((block, index) => {
        const key = `b${index}`;

        if (block.type === "code") {
          return (
            <pre key={key}>
              <code>{block.text}</code>
            </pre>
          );
        }

        if (block.type === "heading") {
          return (
            <p key={key} className="rich-heading">
              {renderInline(block.text, key)}
            </p>
          );
        }

        if (block.type === "ul" || block.type === "ol") {
          const List = block.type === "ul" ? "ul" : "ol";

          return (
            <List key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>
                  {renderInline(item, `${key}-${itemIndex}`)}
                </li>
              ))}
            </List>
          );
        }

        return (
          <p key={key}>
            {block.lines.map((line, lineIndex) => (
              <Fragment key={`${key}-${lineIndex}`}>
                {lineIndex > 0 && <br />}
                {renderInline(line, `${key}-${lineIndex}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SMALL COMPONENTS (outside App so they never remount)                */
/* ------------------------------------------------------------------ */

function AgentCard({ agent, onOpen, onEdit, onDelete }) {
  const Icon = agent.icon || Bot;

  return (
    <article className="agent-card">
      <div className="agent-top">
        <div className="agent-icon" style={{ "--agent-color": agent.color }}>
          <Icon size={22} />
        </div>
        <span className="agent-status">{agent.status}</span>
      </div>

      <h3>{agent.name}</h3>
      <p className="agent-category">{agent.category}</p>
      <p className="agent-description">{agent.description}</p>

      <div className="agent-card-actions">
        <button
          type="button"
          className="agent-link"
          onClick={() => onOpen(agent)}
        >
          View agent
          <ArrowUpRight size={15} />
        </button>

        {agent.isCustom && (
          <div className="agent-management-actions">
            <button
              type="button"
              onClick={() => onEdit(agent)}
              aria-label={`Edit ${agent.name}`}
            >
              <Pencil size={15} />
            </button>

            <button
              type="button"
              onClick={() => onDelete(agent)}
              aria-label={`Delete ${agent.name}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
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
      <form className="form-stack" onSubmit={submit}>
        <label className="field">
          <span>Conversation name</span>
          <input
            value={value}
            onChange={event => setValue(event.target.value)}
            maxLength={MAX_TITLE}
            autoFocus
          />
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

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
      <form className="form-stack" onSubmit={submit}>
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
          <span>Description</span>
          <textarea
            value={description}
            onChange={event => setDescription(event.target.value)}
            rows={3}
            maxLength={MAX_DESCRIPTION}
          />
        </label>

        <label className="field">
          <span>Instructions</span>
          <textarea
            value={instructions}
            onChange={event => setInstructions(event.target.value)}
            rows={5}
            maxLength={MAX_INSTRUCTIONS}
          />
          <small>Up to {MAX_INSTRUCTIONS} characters.</small>
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

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
  const [theme, setTheme] = useState(initial.theme);

  const [selectedAgent, setSelectedAgent] = useState(initial.selectedAgent);
  const [detailsAgent, setDetailsAgent] = useState(initial.detailsAgent);
  const [activeChatId, setActiveChatId] = useState(initial.activeChatId);
  const [historyMode, setHistoryMode] = useState(initial.historyMode);
  const [settingsMode, setSettingsMode] = useState(false);

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
  const composerRef = useRef(null);
  const importInputRef = useRef(null);
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
        : "Browser storage is full or unavailable. Export a backup so you do not lose your conversations."
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
    saveStorage(SETTINGS_KEY, { theme });
  }, [theme]);

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

  /* ---------------- THEME ---------------- */

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function apply() {
      const resolved =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;

      document.documentElement.dataset.theme = resolved;
    }

    apply();
    media.addEventListener?.("change", apply);

    return () => media.removeEventListener?.("change", apply);
  }, [theme]);

  /* ---------------- SCROLL AND COMPOSER SIZE ---------------- */

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isLoadingHere, activeChatId]);

  useEffect(() => {
    const element = composerRef.current;

    if (element) {
      element.style.height = "auto";
      element.style.height = `${Math.min(element.scrollHeight, 150)}px`;
    }
  }, [message, activeChatId]);

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

  const storageSize = useMemo(() => {
    try {
      return new Blob([JSON.stringify(chats)]).size;
    } catch {
      return 0;
    }
  }, [chats]);

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

  const showStarters =
    Boolean(activeChat) &&
    !chatSearchTerm &&
    !messages.some(item => item.role === "user");

  const recentChats = [...chats]
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 3);

  /* ---------------- NAVIGATION ---------------- */

  function resetChatUi() {
    setMessage("");
    setChatError("");
    setCopiedId(null);
    setEditingId(null);
    setChatSearch("");
    setShowChatSearch(false);
    setMobileMenu(false);
    setSettingsMode(false);
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

  function showSettings() {
    setSelectedAgent(null);
    setDetailsAgent(null);
    setHistoryMode(false);
    setActiveChatId(null);
    resetChatUi();
    setSettingsMode(true);
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
    window.scrollTo({ top: 0 });
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
    window.scrollTo({ top: 0 });
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
      `Delete "${agent.name}" and all its conversations permanently?`
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
      // Otherwise the chat shows a "no reply yet" retry notice later.
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

  function submitQuestion(text) {
    const question = text.trim();

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

  function sendMessage(event) {
    event.preventDefault();
    submitQuestion(message);
  }

  // Enter sends on desktop keyboards. On phones Enter adds a new line.
  function handleComposerKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      window.matchMedia("(pointer: fine)").matches
    ) {
      event.preventDefault();
      submitQuestion(message);
    }
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
      // agent, or show the empty state with a "New chat" button.
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
    setMessage("");
    setChatError("");
    setEditingId(null);
    notify("All conversations deleted.");
  }

  function deleteAllCustomAgents() {
    if (!customAgents.length) return;

    const confirmed = window.confirm(
      `Delete all ${customAgents.length} custom agent(s) and their conversations permanently?`
    );

    if (!confirmed) return;

    const agentIds = customAgents.map(agent => agent.id);

    const removedChatIds = chats
      .filter(chat => agentIds.includes(chat.agentId))
      .map(chat => chat.id);

    setCustomAgents([]);
    setChats(previous =>
      previous.filter(chat => !agentIds.includes(chat.agentId))
    );
    setPinnedChats(previous =>
      previous.filter(id => !removedChatIds.includes(id))
    );

    notify("Custom agents deleted.");
  }

  function resetEverything() {
    const confirmed = window.confirm(
      "Delete all conversations, custom agents and settings from this browser? This cannot be undone."
    );

    if (!confirmed) return;

    setChats([]);
    setCustomAgents([]);
    setPinnedChats([]);
    setTheme("system");
    setShowCustomOnly(false);
    showDashboard();
    notify("Everything was reset.");
  }

  /* ---------------- RENAME ---------------- */

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

  function exportConversationJSON(chat) {
    if (!chat) return;

    const agent = allAgents.find(item => item.id === chat.agentId);

    const data = {
      app: "Vertical AI Platform",
      exportedAt: new Date().toISOString(),
      agent: agent ? { id: agent.id, name: agent.name } : null,
      chat
    };

    downloadFile(
      `vertical-ai-${toFileSlug(chat.title)}.json`,
      JSON.stringify(data, null, 2),
      "application/json;charset=utf-8"
    );
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

  function exportBackup() {
    if (!chats.length && !customAgents.length) {
      notify("Nothing to back up yet.");
      return;
    }

    const backup = {
      app: "Vertical AI Platform",
      version: APP_VERSION,
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

  /* ---------------- IMPORT BACKUP ---------------- */

  function openImportPicker() {
    importInputRef.current?.click();
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (file.size > MAX_IMPORT_BYTES) {
      notify("That file is too large to import.");
      return;
    }

    try {
      const data = JSON.parse(await file.text());

      if (!data || typeof data !== "object" || !Array.isArray(data.chats)) {
        throw new Error("Not a backup file");
      }

      const existingAgentIds = new Set(customAgents.map(agent => agent.id));
      const takenNames = new Set(
        allAgents.map(agent => agent.name.toLowerCase())
      );

      const newAgents = [];

      sanitizeAgents(data.agents).forEach(agent => {
        if (existingAgentIds.has(agent.id)) return;

        let name = agent.name;

        if (takenNames.has(name.toLowerCase())) {
          name = `${name} (imported)`;
        }

        takenNames.add(name.toLowerCase());
        newAgents.push({ ...agent, name });
      });

      const knownAgentIds = [...allAgents, ...newAgents].map(agent => agent.id);
      const existingChatIds = new Set(chats.map(chat => chat.id));
      const newChats = [];

      sanitizeChats(data.chats, knownAgentIds).forEach(chat => {
        if (!existingChatIds.has(chat.id)) newChats.push(chat);
      });

      if (!newChats.length && !newAgents.length) {
        notify("Nothing new to import.");
        return;
      }

      const newChatIds = newChats.map(chat => chat.id);
      const importedPins = Array.isArray(data.pinnedChats)
        ? data.pinnedChats.filter(id => newChatIds.includes(id))
        : [];

      setCustomAgents(previous => [...previous, ...newAgents]);
      setChats(previous => [...previous, ...newChats]);
      setPinnedChats(previous => [...new Set([...previous, ...importedPins])]);

      notify(
        `Imported ${newChats.length} conversation(s) and ${newAgents.length} agent(s).`
      );
    } catch {
      notify("That file is not a valid Vertical AI backup.");
    }
  }

  /* ---------------- RENDER ---------------- */

  const detailInfo = detailsAgent
    ? agentDetails[detailsAgent.id] || genericDetails
    : null;

  const DetailsIcon = detailsAgent?.icon || Bot;
  const SelectedIcon = selectedAgent?.icon || Bot;

  const selectedSafetyNote = selectedAgent
    ? safetyNotes[selectedAgent.category]
    : null;

  const detailsSafetyNote = detailsAgent
    ? safetyNotes[detailsAgent.category]
    : null;

  const pageName = settingsMode
    ? "Settings"
    : historyMode
    ? "Conversations"
    : detailsAgent
    ? detailsAgent.name
    : selectedAgent
    ? selectedAgent.name
    : "Dashboard";

  const onDashboard =
    !selectedAgent && !detailsAgent && !historyMode && !settingsMode;

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
          <div className="brand-mark">V</div>
          <span>Vertical AI</span>

          <button
            type="button"
            className="close-menu"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav aria-label="Main">
          <button
            type="button"
            className={`nav-item ${onDashboard ? "active" : ""}`}
            onClick={showDashboard}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => navigateTo("agents")}
          >
            <Compass size={18} />
            Agents
          </button>

          <button
            type="button"
            className={`nav-item ${historyMode ? "active" : ""}`}
            onClick={showGlobalHistory}
          >
            <MessagesSquare size={18} />
            Conversations
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => navigateTo("create")}
          >
            <Plus size={18} />
            Create agent
          </button>

          <button
            type="button"
            className={`nav-item ${settingsMode ? "active" : ""}`}
            onClick={showSettings}
          >
            <Settings size={18} />
            Settings
          </button>
        </nav>

        {selectedAgent && (
          <div className="history-panel">
            <div className="history-title">
              <span><History size={16} /> Chat history</span>

              <button
                type="button"
                title="New chat"
                aria-label="New chat"
                onClick={() => createNewChat(selectedAgent)}
              >
                <Plus size={17} />
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
                      onClick={() => setRenameTarget(chat)}
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      type="button"
                      className="history-delete"
                      title="Pin or unpin"
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
          <p className="version">
            Vertical AI Platform · v{APP_VERSION}
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">
        <div className="page">
          <header className="topbar">
            <button
              type="button"
              className="menu-button"
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>

            <div className="breadcrumb">{pageName}</div>

            <span className={`mode-chip ${BACKEND_READY ? "live" : ""}`}>
              {BACKEND_READY ? "Live" : "Demo mode"}
            </span>
          </header>

          {storageError && (
            <div className="storage-banner" role="alert">
              {storageError}
            </div>
          )}

          {settingsMode ? (

            /* SETTINGS */

            <section className="settings-page">
              <h1 className="page-title">Settings</h1>
              <p className="page-intro">
                Everything here is stored in this browser only.
              </p>

              <h2 className="settings-heading">Appearance</h2>
              <div className="settings-group">
                <div className="settings-row">
                  <div>
                    <h3>Theme</h3>
                    <p>Match your device, or choose light or dark.</p>
                  </div>

                  <div className="segmented" role="group" aria-label="Theme">
                    {["system", "light", "dark"].map(option => (
                      <button
                        type="button"
                        key={option}
                        aria-pressed={theme === option}
                        onClick={() => setTheme(option)}
                      >
                        {option === "system"
                          ? "System"
                          : option === "light"
                          ? "Light"
                          : "Dark"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <h2 className="settings-heading">Your data</h2>
              <div className="settings-group">
                <div className="settings-row">
                  <div>
                    <h3>Saved on this device</h3>
                    <p>
                      {chats.length} conversation(s), {totalMessages} message(s),{" "}
                      {customAgents.length} custom agent(s),
                      about {formatBytes(storageSize)}.
                    </p>
                  </div>
                </div>

                <div className="settings-row">
                  <div>
                    <h3>Back up</h3>
                    <p>Download all conversations and custom agents as one JSON file.</p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={exportBackup}
                  >
                    <Download size={16} />
                    Download backup
                  </button>
                </div>

                <div className="settings-row">
                  <div>
                    <h3>Restore</h3>
                    <p>
                      Add conversations from a backup file. Existing data is kept.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={openImportPicker}
                  >
                    <Upload size={16} />
                    Import backup
                  </button>
                </div>

                <div className="settings-row">
                  <div>
                    <h3>Export as text</h3>
                    <p>A readable copy of every conversation.</p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={exportAllChats}
                    disabled={!chats.length}
                  >
                    <Download size={16} />
                    Export TXT
                  </button>
                </div>
              </div>

              <h2 className="settings-heading">Delete data</h2>
              <div className="settings-group">
                <div className="settings-row">
                  <div>
                    <h3>All conversations</h3>
                    <p>Removes every conversation. Agents are kept.</p>
                  </div>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={clearAllChats}
                    disabled={!chats.length}
                  >
                    Delete conversations
                  </button>
                </div>

                <div className="settings-row">
                  <div>
                    <h3>Custom agents</h3>
                    <p>Removes the agents you created and their conversations.</p>
                  </div>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={deleteAllCustomAgents}
                    disabled={!customAgents.length}
                  >
                    Delete agents
                  </button>
                </div>

                <div className="settings-row">
                  <div>
                    <h3>Reset everything</h3>
                    <p>Clears conversations, custom agents and settings.</p>
                  </div>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={resetEverything}
                  >
                    Reset all
                  </button>
                </div>
              </div>

              <h2 className="settings-heading">About</h2>
              <div className="settings-group">
                <div className="settings-row">
                  <div>
                    <h3>Version</h3>
                    <p>Vertical AI Platform v{APP_VERSION}</p>
                  </div>
                </div>

                <div className="settings-row">
                  <div>
                    <h3>AI replies</h3>
                    <p>
                      {BACKEND_READY
                        ? "Connected to the backend set in VITE_API_BASE_URL."
                        : "Demo mode. Replies are placeholders until a backend URL is set in VITE_API_BASE_URL."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

          ) : detailsAgent ? (

            /* AGENT DETAILS */

            <section className="agent-details-page">
              <button
                type="button"
                className="back-button"
                onClick={showDashboard}
              >
                <ArrowLeft size={18} />
                <span>All agents</span>
              </button>

              <header className="details-hero">
                <div
                  className="details-agent-icon"
                  style={{ "--agent-color": detailsAgent.color }}
                >
                  <DetailsIcon size={32} />
                </div>

                <div className="details-hero-text">
                  <p className="details-category">{detailsAgent.category}</p>
                  <h1>{detailsAgent.name}</h1>
                  <p className="details-description">
                    {detailsAgent.description}
                  </p>

                  <div className="details-actions">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => createNewChat(detailsAgent)}
                    >
                      Start a conversation
                    </button>

                    {detailsAgent.isCustom && (
                      <>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => handleEditCustomAgent(detailsAgent)}
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleDeleteCustomAgent(detailsAgent)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </header>

              {detailsSafetyNote && (
                <p className="safety-note">
                  <Info size={16} />
                  <span>{detailsSafetyNote}</span>
                </p>
              )}

              <div className="details-columns">
                <div>
                  <h2>What it covers</h2>

                  <ul className="check-list">
                    {detailInfo.features.map(feature => (
                      <li key={feature}>
                        <Check size={17} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2>Good for</h2>

                  <ul className="check-list">
                    {detailInfo.uses.map(use => (
                      <li key={use}>
                        <Check size={17} />
                        {use}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {detailsAgent.isCustom && (
                <div className="info-block">
                  <h2>Your instructions</h2>
                  <p>{detailsAgent.instructions}</p>
                </div>
              )}

              {!BACKEND_READY && (
                <p className="fineprint">
                  This agent gives demo replies until the backend is connected.
                </p>
              )}
            </section>

          ) : selectedAgent ? (

            /* CHAT WORKSPACE */

            <section className="chat-page">
              <div className="chat-nav">
                <button
                  type="button"
                  className="back-button"
                  onClick={showDashboard}
                >
                  <ArrowLeft size={18} />
                  <span>Back</span>
                </button>

                <div className="chat-nav-actions">
                  <button
                    type="button"
                    className="tool-button"
                    onClick={() => createNewChat(selectedAgent)}
                    aria-label="New chat"
                  >
                    <MessageSquarePlus size={17} />
                    <span className="btn-label">New chat</span>
                  </button>

                  {activeChat && (
                    <>
                      <button
                        type="button"
                        className="tool-button"
                        onClick={() => setRenameTarget(activeChat)}
                        aria-label="Rename conversation"
                      >
                        <Pencil size={16} />
                        <span className="btn-label">Rename</span>
                      </button>

                      <button
                        type="button"
                        className={`tool-button ${showChatSearch ? "on" : ""}`}
                        onClick={() => setShowChatSearch(!showChatSearch)}
                        aria-label="Search messages"
                        aria-pressed={showChatSearch}
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
                  style={{ "--agent-color": selectedAgent.color }}
                >
                  <SelectedIcon size={24} />
                </div>

                <div className="agent-heading-info">
                  <h1>{selectedAgent.name}</h1>
                  <p>
                    {activeChat
                      ? activeChat.title
                      : `${selectedAgent.category} assistant`}
                  </p>
                </div>

                <div className="agent-select-wrapper">
                  <label className="visually-hidden" htmlFor="agent-switch">
                    Switch agent
                  </label>

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

              {selectedSafetyNote && (
                <p className="safety-note">
                  <Info size={16} />
                  <span>{selectedSafetyNote}</span>
                </p>
              )}

              {showChatSearch && (
                <div className="search-box">
                  <Search size={18} />

                  <input
                    placeholder="Search messages in this conversation"
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

              {activeChat ? (
                <>
                  {/* MESSAGES */}

                  <div
                    className="chat-messages"
                    ref={messagesContainerRef}
                    aria-live="polite"
                    style={{ "--agent-color": selectedAgent.color }}
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
                          {item.role === "assistant" && (
                            <div className="message-avatar">
                              <SelectedIcon size={16} />
                            </div>
                          )}

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
                              ) : item.role === "assistant" ? (
                                <RichText text={item.text} />
                              ) : (
                                <p className="plain-text">{item.text}</p>
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

                    {showStarters && (
                      <div className="starters">
                        <p>Try asking</p>

                        <div className="starter-list">
                          {getStarters(selectedAgent).map(question => (
                            <button
                              type="button"
                              key={question}
                              className="starter"
                              onClick={() => submitQuestion(question)}
                              disabled={isBusy}
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {isLoadingHere && (
                      <div className="loading-message" role="status">
                        <RefreshCw size={16} />
                        Thinking...
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
                    <textarea
                      ref={composerRef}
                      rows={1}
                      value={message}
                      onChange={event => setMessage(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      placeholder={
                        isBusy && !isLoadingHere
                          ? "Another reply is in progress..."
                          : `Message ${selectedAgent.name}`
                      }
                      aria-label="Type your message"
                    />

                    <button
                      type="submit"
                      disabled={!message.trim() || isBusy}
                      aria-label="Send message"
                    >
                      <ArrowUp size={19} />
                    </button>
                  </form>

                  <div className="workspace-bottom-actions">
                    <button
                      type="button"
                      onClick={regenerateResponse}
                      disabled={
                        isBusy ||
                        !messages.some(item => item.role === "user")
                      }
                    >
                      <RefreshCw size={15} />
                      Regenerate
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePin(activeChat.id)}
                    >
                      {pinnedChats.includes(activeChat.id)
                        ? <PinOff size={15} />
                        : <Pin size={15} />}
                      {pinnedChats.includes(activeChat.id) ? "Unpin" : "Pin"}
                    </button>

                    <button
                      type="button"
                      onClick={() => exportConversation(activeChat)}
                    >
                      <Download size={15} />
                      TXT
                    </button>

                    <button
                      type="button"
                      onClick={() => exportConversationJSON(activeChat)}
                    >
                      <Download size={15} />
                      JSON
                    </button>

                    <button
                      type="button"
                      className="danger-text"
                      onClick={clearCurrentChat}
                      disabled={isLoadingHere}
                    >
                      <Trash2 size={15} />
                      Clear chat
                    </button>
                  </div>

                  <p className="chat-footer">
                    Conversations are saved in this browser only.
                  </p>
                </>
              ) : (
                <div className="empty-message">
                  <MessageSquarePlus size={32} />
                  <h3>No conversation open</h3>

                  <p>
                    Start a new conversation with {selectedAgent.name}
                    {agentChats.length > 0
                      ? ", or pick one from Chat history."
                      : "."}
                  </p>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => createNewChat(selectedAgent)}
                  >
                    <MessageSquarePlus size={17} />
                    New chat
                  </button>
                </div>
              )}
            </section>

          ) : historyMode ? (

            /* GLOBAL HISTORY */

            <section className="history-page">
              <div className="section-heading">
                <div>
                  <h1 className="page-title">Conversations</h1>
                  <p className="page-intro">
                    Every conversation with every agent, saved in this browser.
                  </p>
                </div>

                <div className="button-row">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={exportBackup}
                    disabled={!chats.length && !customAgents.length}
                  >
                    <Download size={16} />
                    Backup
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={openImportPicker}
                  >
                    <Upload size={16} />
                    Import
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={exportAllChats}
                    disabled={!chats.length}
                  >
                    <Download size={16} />
                    TXT
                  </button>
                </div>
              </div>

              <div className="search-box">
                <Search size={18} />

                <input
                  placeholder="Search conversations, agents or messages"
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

              <p className="result-count">
                {globalHistory.length} conversation(s)
                {pinnedChats.length > 0 && ` · ${pinnedChats.length} pinned`}
              </p>

              {globalHistory.length === 0 ? (
                <div className="empty-message">
                  <MessagesSquare size={32} />
                  <h3>No conversations found</h3>
                  <p>Start a conversation with any agent and it will show up here.</p>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => navigateTo("agents")}
                  >
                    Browse agents
                  </button>
                </div>
              ) : (
                <div className="list-panel">
                  {globalHistory.map(chat => {
                    const agent = allAgents.find(
                      item => item.id === chat.agentId
                    );

                    const Icon = agent?.icon || Bot;
                    const last = chat.messages[chat.messages.length - 1];

                    return (
                      <div className="global-history-card" key={chat.id}>
                        <div
                          className="row-icon"
                          style={{ "--agent-color": agent?.color || "#64748b" }}
                        >
                          <Icon size={20} />
                        </div>

                        <div className="global-history-info">
                          <div className="global-history-heading">
                            <h3>{chat.title}</h3>
                            {pinnedChats.includes(chat.id) && <Pin size={13} />}
                          </div>

                          <p>
                            {agent?.name || "Unknown agent"} ·{" "}
                            {formatDateTime(chat.updatedAt || chat.createdAt)}
                          </p>

                          <span>{last?.text?.slice(0, 110) || "No messages"}</span>
                        </div>

                        <div className="global-history-actions">
                          <button
                            type="button"
                            title="Open conversation"
                            aria-label="Open conversation"
                            onClick={() => openExistingChat(chat)}
                          >
                            <ExternalLink size={16} />
                          </button>

                          <button
                            type="button"
                            title="Pin or unpin"
                            aria-label="Pin or unpin conversation"
                            onClick={() => togglePin(chat.id)}
                          >
                            {pinnedChats.includes(chat.id)
                              ? <PinOff size={16} />
                              : <Pin size={16} />}
                          </button>

                          <button
                            type="button"
                            title="Rename"
                            aria-label="Rename conversation"
                            onClick={() => setRenameTarget(chat)}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            title="Export as text"
                            aria-label="Export conversation as text"
                            onClick={() => exportConversation(chat)}
                          >
                            <Download size={16} />
                          </button>

                          <button
                            type="button"
                            title="Delete"
                            aria-label="Delete conversation"
                            onClick={() => deleteChat(chat.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {chats.length > 0 && (
                <div className="workspace-bottom-actions">
                  <button
                    type="button"
                    className="danger-text"
                    onClick={clearAllChats}
                  >
                    <Trash2 size={15} />
                    Delete all conversations
                  </button>
                </div>
              )}
            </section>

          ) : (

            /* DASHBOARD */

            <>
              <section className="welcome-section" id="dashboard">
                <div className="welcome-text">
                  <h1>AI assistants built for the work your industry does</h1>

                  <p className="welcome-description">
                    Pick an agent for healthcare, farming, finance, retail,
                    manufacturing or education. Ask questions, keep your
                    conversations, or create an agent with your own instructions.
                  </p>

                  <div className="hero-actions">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => navigateTo("agents")}
                    >
                      Browse agents
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => navigateTo("create")}
                    >
                      Create an agent
                    </button>
                  </div>
                </div>

                <figure className="example-card" aria-label="Example conversation">
                  <figcaption>
                    <span
                      className="example-dot"
                      style={{ "--agent-color": categoryColors.Finance }}
                    ></span>
                    Finance Advisor
                    <em>Example</em>
                  </figcaption>

                  <div className="example-body">
                    <p className="example-user">
                      How should I split a monthly income of ₹60,000?
                    </p>

                    <p className="example-reply">
                      A common starting point is the 50/30/20 rule: about
                      ₹30,000 for needs, ₹18,000 for wants and ₹12,000 for
                      savings. Adjust it for rent, loans and your goals.
                    </p>
                  </div>
                </figure>
              </section>

              <section className="overview" aria-label="Overview">
                <div>
                  <strong>{allAgents.length}</strong>
                  <span>agents</span>
                </div>

                <div>
                  <strong>{chats.length}</strong>
                  <span>conversations</span>
                </div>

                <div>
                  <strong>{totalMessages}</strong>
                  <span>messages</span>
                </div>
              </section>

              {recentChats.length > 0 && (
                <section className="block">
                  <div className="section-heading">
                    <div>
                      <h2>Continue where you left off</h2>
                    </div>

                    <button
                      type="button"
                      className="text-button"
                      onClick={showGlobalHistory}
                    >
                      View all
                      <ArrowUpRight size={15} />
                    </button>
                  </div>

                  <div className="list-panel">
                    {recentChats.map(chat => {
                      const agent = allAgents.find(
                        item => item.id === chat.agentId
                      );

                      const Icon = agent?.icon || Bot;

                      return (
                        <button
                          type="button"
                          className="recent-row"
                          key={chat.id}
                          onClick={() => openExistingChat(chat)}
                        >
                          <span
                            className="row-icon"
                            style={{ "--agent-color": agent?.color || "#64748b" }}
                          >
                            <Icon size={20} />
                          </span>

                          <span className="recent-text">
                            <strong>{chat.title}</strong>
                            <small>
                              {agent?.name || "Unknown agent"} ·{" "}
                              {formatDateTime(chat.updatedAt || chat.createdAt)}
                            </small>
                          </span>

                          <ArrowUpRight size={16} />
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* AGENTS */}

              <section className="block" id="agents">
                <div className="section-heading">
                  <div>
                    <h2>Agents</h2>
                    <p className="section-sub">
                      Choose the assistant that fits your work.
                    </p>
                  </div>
                </div>

                <div className="search-box">
                  <Search size={18} />

                  <input
                    placeholder="Search agents or industries"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    aria-label="Search agents"
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
                    aria-pressed={showCustomOnly}
                  >
                    My agents only
                  </button>

                  <span>{filteredAgents.length} agent(s)</span>
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
                      No agents match your search. Try another word or filter.
                    </p>
                  )}
                </div>
              </section>

              {/* CREATE AGENT */}

              <section className="block create-block" id="create">
                <div className="create-copy">
                  <h2>Create your own agent</h2>

                  <p>
                    Give it a name, an industry and instructions that describe
                    how it should answer. It appears next to the built-in
                    agents and keeps its own conversations.
                  </p>
                </div>

                <form onSubmit={handleCreateAgent} className="form-stack">
                  <label className="field">
                    <span>Agent name</span>
                    <input
                      value={agentName}
                      onChange={event => setAgentName(event.target.value)}
                      placeholder="For example: Shop Helper"
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
                    <span>Description</span>
                    <textarea
                      value={agentDescription}
                      onChange={event => setAgentDescription(event.target.value)}
                      placeholder="What should this agent help with?"
                      rows={3}
                      maxLength={MAX_DESCRIPTION}
                    />
                  </label>

                  <label className="field">
                    <span>Instructions</span>
                    <textarea
                      value={agentInstructions}
                      onChange={event => setAgentInstructions(event.target.value)}
                      placeholder="How should it behave and answer?"
                      rows={5}
                      maxLength={MAX_INSTRUCTIONS}
                    />
                    <small>Up to {MAX_INSTRUCTIONS} characters.</small>
                  </label>

                  {createError && (
                    <p className="form-error" role="alert">{createError}</p>
                  )}

                  <button type="submit" className="primary-button">
                    <Plus size={17} />
                    Create agent
                  </button>
                </form>
              </section>

              <footer className="site-footer">
                <p>© 2026 Vertical AI Platform</p>
              </footer>
            </>
          )}
        </div>
      </main>

      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportFile}
        hidden
      />

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
