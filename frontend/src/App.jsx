import { useEffect, useRef, useState } from "react";
import { getAgentReply } from "./services/agentService";
import {
  Search, LayoutDashboard, Compass, Bot, Plus,
  ArrowUpRight, Sparkles, Menu, X, Zap,
  HeartPulse, Sprout, Landmark, ShoppingBag,
  Factory, GraduationCap, ArrowLeft, Send, User,
  MessageSquarePlus, History, Trash2, Copy,
  Check, ChevronDown, Clock, RefreshCw
} from "lucide-react";

const STORAGE_KEY = "vertical-ai-phase3-chats";

// Generate unique IDs
function generateId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// AI Agents
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

const categories = [
  "All",
  "Healthcare",
  "Agriculture",
  "Finance",
  "Retail",
  "Manufacturing",
  "Education"
];

// Agent details
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

// Create chat
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

// Validate chat
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

// Read saved chats
function readSavedChats() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isValidChat)
      .filter(chat =>
        agents.some(agent => agent.id === chat.agentId)
      );
  } catch (error) {
    console.error("Chat loading error:", error);
    return [];
  }
}

// Copy text
async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();

    const success = document.execCommand("copy");
    document.body.removeChild(textarea);

    return success;
  } catch (error) {
    console.error("Copy error:", error);
    return false;
  }
}

// Format message time
function formatTime(timestamp) {
  if (!timestamp) return "";

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [detailsAgent, setDetailsAgent] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);

  const [chats, setChats] = useState(readSavedChats);

  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const messagesContainerRef = useRef(null);

  // Save chats automatically
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(chats)
      );
    } catch (error) {
      console.error("Could not save chats:", error);
    }
  }, [chats]);

  // Active chat
  const activeChat = chats.find(
    chat => chat.id === activeChatId
  );

  const messages = activeChat?.messages || [];

  // Automatic scroll
  useEffect(() => {
    const container = messagesContainerRef.current;

    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isLoading]);

  // Agent chat history
  const agentChats = chats
    .filter(chat => chat.agentId === selectedAgent?.id)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  // Agent search
  const filteredAgents = agents.filter(agent => {
    const term = search.toLowerCase().trim();

    const matchesCategory =
      activeCategory === "All" ||
      agent.category === activeCategory;

    const matchesSearch =
      agent.name.toLowerCase().includes(term) ||
      agent.category.toLowerCase().includes(term) ||
      agent.description.toLowerCase().includes(term);

    return matchesCategory && matchesSearch;
  });

  // Create new chat
  function createNewChat(agent) {
    if (!agent) return;

    const newChat = createChat(agent);

    setChats(previous => [
      newChat,
      ...previous
    ]);

    setSelectedAgent(agent);
    setDetailsAgent(null);
    setActiveChatId(newChat.id);

    setMessage("");
    setChatError("");
    setCopiedId(null);
    setMobileMenu(false);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Open agent details
  function openAgent(agent) {
    setDetailsAgent(agent);
    setSelectedAgent(null);
    setActiveChatId(null);

    setMessage("");
    setChatError("");
    setCopiedId(null);
    setMobileMenu(false);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Open existing chat
  function openExistingChat(chat) {
    const agent = agents.find(
      item => item.id === chat.agentId
    );

    if (!agent) return;

    setSelectedAgent(agent);
    setDetailsAgent(null);
    setActiveChatId(chat.id);

    setMessage("");
    setChatError("");
    setCopiedId(null);
    setMobileMenu(false);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Return to dashboard
  function closeAgent() {
    setSelectedAgent(null);
    setDetailsAgent(null);
    setActiveChatId(null);

    setMessage("");
    setChatError("");
    setCopiedId(null);
    setMobileMenu(false);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Send message
  async function sendMessage(e) {
    e.preventDefault();

    const question = message.trim();
    const agent = selectedAgent;
    const chatId = activeChatId;

    if (!question || !agent || !chatId || isLoading) {
      return;
    }

    const now = Date.now();

    const userMessage = {
      id: generateId(),
      role: "user",
      text: question,
      createdAt: now
    };

    // Save user message immediately
    setChats(previous =>
      previous.map(chat => {
        if (chat.id !== chatId) return chat;

        const firstUserMessage = !chat.messages.some(
          item => item.role === "user"
        );

        return {
          ...chat,
          title: firstUserMessage
            ? question.slice(0, 35) +
              (question.length > 35 ? "..." : "")
            : chat.title,
          updatedAt: now,
          messages: [
            ...chat.messages,
            userMessage
          ]
        };
      })
    );

    setMessage("");
    setChatError("");
    setIsLoading(true);

    try {
      const result = await getAgentReply(
        agent.name,
        question
      );

      const reply =
        typeof result === "string"
          ? result
          : String(result?.reply || result?.message || "No response received.");

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
                messages: [
                  ...chat.messages,
                  assistantMessage
                ]
              }
            : chat
        )
      );

    } catch (error) {
      console.error("AI response error:", error);

      setChatError(
        error.message ||
        "Unable to connect to AI. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Delete individual message
  function deleteMessage(messageId) {
    if (!activeChatId) return;

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

  // Clear current chat
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

  // Delete chat
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
      .sort((a, b) => b.updatedAt - a.updatedAt);

    setChats(previous =>
      previous.filter(chat => chat.id !== chatId)
    );

    if (chatId === activeChatId) {
      if (remainingChats.length > 0) {
        openExistingChat(remainingChats[0]);
      } else if (selectedAgent) {
        createNewChat(selectedAgent);
      } else {
        setActiveChatId(null);
      }
    }
  }

  // Copy message
  async function copyMessage(item) {
    const success = await copyText(item.text);

    if (success) {
      setCopiedId(item.id);

      setTimeout(() => {
        setCopiedId(current =>
          current === item.id ? null : current
        );
      }, 1800);
    } else {
      alert("Could not copy this message.");
    }
  }

  // Navigation
  function navigateTo(section) {
    closeAgent();

    setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({
        behavior: "smooth"
      });
    }, 100);
  }

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>

        <div className="brand">
          <div className="brand-icon">
            <Bot size={25} />
          </div>

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
              !selectedAgent && !detailsAgent ? "active" : ""
            }`}
            onClick={closeAgent}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() => navigateTo("agents")}
          >
            <Compass size={19} />
            Explore Agents
          </button>

          <button
            className="nav-item"
            onClick={() => navigateTo("create")}
          >
            <Plus size={19} />
            Create AI Agent
          </button>
        </nav>

        {/* CHAT HISTORY */}
        {selectedAgent && (
          <div className="history-panel">

            <div className="history-title">
              <span>
                <History size={16} />
                Chat History
              </span>

              <button
                title="New Chat"
                aria-label="New Chat"
                onClick={() => createNewChat(selectedAgent)}
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="history-list">

              {agentChats.length === 0 ? (
                <p className="history-empty">
                  No conversations yet.
                </p>
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
                      <MessageSquarePlus size={15} />
                      <span>{chat.title}</span>
                    </button>

                    <button
                      className="history-delete"
                      title="Delete conversation"
                      onClick={() => deleteChat(chat.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}

            </div>
          </div>
        )}

        {/* SIDEBAR BOTTOM */}
        <div className="sidebar-bottom">

          <div className="upgrade-card">
            <Sparkles size={23} />

            <h3>Build with AI</h3>

            <p>
              Create intelligent agents for your business.
            </p>

            <button onClick={() => navigateTo("create")}>
              Get Started <ArrowUpRight size={15} />
            </button>
          </div>

          <p className="version">
            VERTICAL AI PLATFORM · V3.0
          </p>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* TOP BAR */}
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
            {detailsAgent
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

            <button
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
                {(() => {
                  const Icon = detailsAgent.icon;
                  return <Icon size={38} />;
                })()}
              </div>

              <p className="details-category">
                {detailsAgent.category} AI AGENT
              </p>

              <h1>{detailsAgent.name}</h1>

              <p className="details-description">
                {detailsAgent.description}
              </p>

              <button
                className="details-use-button"
                onClick={() => createNewChat(detailsAgent)}
              >
                <Sparkles size={18} />
                Use This Agent
                <ArrowUpRight size={18} />
              </button>

            </div>

            <div className="details-section">
              <h2>Key Features</h2>

              <div className="details-feature-grid">
                {agentDetails[detailsAgent.id].features.map(
                  (feature, index) => (
                    <div className="details-feature-card" key={index}>
                      <Check size={19} />
                      <p>{feature}</p>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="details-section">
              <h2>What Can You Do With This Agent?</h2>

              <div className="details-feature-grid">
                {agentDetails[detailsAgent.id].uses.map(
                  (use, index) => (
                    <div className="details-feature-card" key={index}>
                      <Sparkles size={19} />
                      <p>{use}</p>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="chat-notice">
              Live AI responses and backend integration can be connected
              through the agent service.
            </div>

          </section>

        ) : selectedAgent ? (

          /* CHAT WORKSPACE */
          <section className="chat-page">

            <div className="workspace-toolbar">

              <button
                className="back-button"
                onClick={closeAgent}
              >
                <ArrowLeft size={18} />
                Dashboard
              </button>

              <button
                className="new-chat-button"
                onClick={() => createNewChat(selectedAgent)}
              >
                <MessageSquarePlus size={17} />
                New Chat
              </button>

            </div>

            {/* CHAT HEADING */}
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

            {/* AGENT SWITCHER */}
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
                    const nextAgent = agents.find(
                      item => item.id === e.target.value
                    );

                    if (nextAgent) openAgent(nextAgent);
                  }}
                >
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>

                <ChevronDown size={16} />

              </div>
            </div>

            <div className="chat-notice">
              Your conversations are saved in this browser.
              Backend database integration can be added later.
            </div>

            {/* MESSAGES */}
            <div
              className="chat-messages"
              ref={messagesContainerRef}
              aria-live="polite"
            >

              {messages.length === 0 ? (
                <p className="history-empty">
                  No messages in this conversation. Send a message to start.
                </p>
              ) : (
                messages.map(item => (

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

                        <button
                          onClick={() => copyMessage(item)}
                          title="Copy message"
                        >
                          {copiedId === item.id
                            ? <Check size={14} />
                            : <Copy size={14} />}

                          {copiedId === item.id
                            ? "Copied"
                            : "Copy"}
                        </button>

                        <button
                          onClick={() => deleteMessage(item.id)}
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
                  {chatError}
                </div>
              )}

            </div>

            {/* MESSAGE INPUT */}
            <form
              className="chat-input-area"
              onSubmit={sendMessage}
            >

              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={`Ask ${selectedAgent.name}...`}
                aria-label="Type your message"
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={
                  !message.trim() ||
                  !activeChat ||
                  isLoading
                }
                aria-label="Send message"
              >
                <Send size={19} />
              </button>

            </form>

            {/* CLEAR CHAT */}
            <div className="workspace-bottom-actions">

              <button
                onClick={clearCurrentChat}
                disabled={!activeChat || isLoading}
              >
                <Trash2 size={15} />
                Clear Current Chat
              </button>

            </div>

            <p className="chat-footer">
              Vertical AI Platform · Agent Workspace V3.1
            </p>

          </section>

        ) : (

          /* DASHBOARD */
          <>

            {/* HERO */}
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

                <div className="hero-core">
                  <Bot size={65} />
                </div>

                <div className="floating-icon icon-one">
                  <HeartPulse />
                </div>

                <div className="floating-icon icon-two">
                  <Sprout />
                </div>

                <div className="floating-icon icon-three">
                  <Landmark />
                </div>

              </div>

            </section>

            {/* STATISTICS */}
            <section className="stats-grid">

              <div className="stat-card">
                <div className="stat-icon purple">
                  <Bot />
                </div>

                <div>
                  <p>AI AGENTS</p>
                  <h2>06</h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">
                  <Zap />
                </div>

                <div>
                  <p>INDUSTRIES</p>
                  <h2>06</h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue">
                  <Sparkles />
                </div>

                <div>
                  <p>PLATFORM STATUS</p>
                  <h2 className="live-status">Active</h2>
                </div>
              </div>

            </section>

            {/* AGENT MARKETPLACE */}
            <section className="agents-section" id="agents">

              <div className="section-heading">
                <div>
                  <p className="eyebrow">AI MARKETPLACE</p>
                  <h2>Explore AI Agents</h2>
                  <p>
                    Find the right intelligence for your business.
                  </p>
                </div>
              </div>

              {/* SEARCH */}
              <div className="search-box">
                <Search size={20} />

                <input
                  placeholder="Search AI agents or industries..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Search AI agents"
                />
              </div>

              {/* CATEGORIES */}
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

              {/* AGENT CARDS */}
              <div className="agents-grid">

                {filteredAgents.map(agent => {
                  const Icon = agent.icon;

                  return (
                    <article className="agent-card" key={agent.id}>

                      <div className="agent-top">

                        <div
                          className="agent-icon"
                          style={{ color: agent.color }}
                        >
                          <Icon size={27} />
                        </div>

                        <span className="agent-status">
                          {agent.status}
                        </span>

                      </div>

                      <p className="agent-category">
                        {agent.category}
                      </p>

                      <h3>{agent.name}</h3>

                      <p className="agent-description">
                        {agent.description}
                      </p>

                      <button
                        className="agent-link"
                        onClick={() => openAgent(agent)}
                      >
                        Explore Agent
                        <ArrowUpRight size={16} />
                      </button>

                    </article>
                  );
                })}

                {filteredAgents.length === 0 && (
                  <p className="empty-message">
                    No agents found. Try another search.
                  </p>
                )}

              </div>

            </section>

            {/* CREATE AGENT */}
            <section className="create-section" id="create">

              <div className="create-icon">
                <Sparkles size={30} />
              </div>

              <div>
                <p className="eyebrow">BUILD YOUR OWN</p>

                <h2>Create Your Custom AI Agent</h2>

                <p>
                  Design an intelligent assistant tailored to your business needs.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() =>
                  alert("Custom AI Agent Builder is coming soon!")
                }
              >
                <Plus size={18} />
                Create Agent
              </button>

            </section>

            {/* FOOTER */}
            <footer>
              <p>
                © 2026 Vertical AI Platform. All rights reserved.
              </p>

              <p>
                Built for the future of every industry.
              </p>
            </footer>

          </>
        )}

      </main>
    </div>
  );
}
