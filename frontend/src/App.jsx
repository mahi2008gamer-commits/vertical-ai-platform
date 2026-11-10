import { useEffect, useState } from "react";
import {
  Search, LayoutDashboard, Compass, Bot, Plus,
  ArrowUpRight, Sparkles, Menu, X, Zap,
  HeartPulse, Sprout, Landmark, ShoppingBag,
  Factory, GraduationCap, ArrowLeft, Send, User,
  MessageSquarePlus, History, Trash2, Copy,
  Check, ChevronDown, MoreVertical
} from "lucide-react";

const STORAGE_KEY = "vertical-ai-phase3-chats";

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
  "All", "Healthcare", "Agriculture", "Finance",
  "Retail", "Manufacturing", "Education"
];

function getDemoReply(agent, question) {
  const replies = {
    Healthcare:
      "I am your Medical Assistant demo. I can explain general health information and medical terms. Please consult a qualified healthcare professional for diagnosis or treatment.",
    Agriculture:
      "I am your Agriculture AI demo. I can help with crop planning, soil information, irrigation and farming practices. Tell me your crop, location and farming question.",
    Finance:
      "I am your Finance Advisor demo. I can help explain budgeting, financial concepts and business performance. Share the details you want to understand.",
    Retail:
      "I am your Retail Assistant demo. I can help with product information, customer support ideas and retail operations. Tell me what you need.",
    Manufacturing:
      "I am your Industry Expert demo. I can help explain manufacturing workflows, production planning and operational efficiency. Describe your process.",
    Education:
      "I am your Education Tutor demo. I can explain subjects, help with study plans and create practice questions. Which topic are you studying?"
  };

  return replies[agent.category] ||
    `I received your question: "${question}". This is a frontend demo response.`;
}

function createChat(agent) {
  return {
    id: Date.now().toString(),
    agentId: agent.id,
    title: "New conversation",
    updatedAt: Date.now(),
    messages: [
      {
        id: Date.now().toString() + "-welcome",
        role: "assistant",
        text: `Hello! I am ${agent.name}. Welcome! How can I help you today?`
      }
    ]
  };
}

function readSavedChats() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);

  const [chats, setChats] = useState(readSavedChats);
  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (error) {
      console.error("Could not save chat history:", error);
    }
  }, [chats]);

  const activeChat = chats.find(
    (chat) => chat.id === activeChatId
  );

  const messages = activeChat?.messages || [];

  const agentChats = chats
    .filter((chat) => chat.agentId === selectedAgent?.id)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const filteredAgents = agents.filter((agent) => {
    const matchesCategory =
      activeCategory === "All" ||
      agent.category === activeCategory;

    const matchesSearch =
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.category.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  function createNewChat(agent) {
    const newChat = createChat(agent);

    setChats((previous) => [newChat, ...previous]);
    setSelectedAgent(agent);
    setActiveChatId(newChat.id);
    setMessage("");
    setMobileMenu(false);

    window.scrollTo(0, 0);
  }

  function openAgent(agent) {
    createNewChat(agent);
  }

  function openExistingChat(chat) {
    const agent = agents.find(
      (item) => item.id === chat.agentId
    );

    if (!agent) return;

    setSelectedAgent(agent);
    setActiveChatId(chat.id);
    setMessage("");
    setMobileMenu(false);
    window.scrollTo(0, 0);
  }

  function closeAgent() {
    setSelectedAgent(null);
    setActiveChatId(null);
    setMessage("");
    setMobileMenu(false);
    window.scrollTo(0, 0);
  }

  function sendMessage(e) {
    e.preventDefault();

    const question = message.trim();

    if (!question || !selectedAgent || !activeChatId) return;

    const reply = getDemoReply(selectedAgent, question);
    const now = Date.now();

    setChats((previous) =>
      previous.map((chat) => {
        if (chat.id !== activeChatId) return chat;

        const firstUserMessage = chat.messages.every(
          (item) => item.role !== "user"
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
            {
              id: now.toString() + "-user",
              role: "user",
              text: question
            },
            {
              id: now.toString() + "-assistant",
              role: "assistant",
              text: reply
            }
          ]
        };
      })
    );

    setMessage("");
  }

  function deleteMessage(messageId) {
    setChats((previous) =>
      previous.map((chat) => {
        if (chat.id !== activeChatId) return chat;

        return {
          ...chat,
          messages: chat.messages.filter(
            (item) => item.id !== messageId
          ),
          updatedAt: Date.now()
        };
      })
    );
  }

  function clearCurrentChat() {
    if (!activeChatId || !selectedAgent) return;

    const fresh = createChat(selectedAgent);

    setChats((previous) =>
      previous.map((chat) =>
        chat.id === activeChatId
          ? { ...fresh, id: chat.id }
          : chat
      )
    );

    setMessage("");
  }

  function deleteChat(chatId) {
    setChats((previous) =>
      previous.filter((chat) => chat.id !== chatId)
    );

    if (chatId === activeChatId) {
      const remaining = chats.filter(
        (chat) => chat.id !== chatId &&
          chat.agentId === selectedAgent?.id
      );

      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
      } else {
        createNewChat(selectedAgent);
      }
    }
  }

  async function copyMessage(item) {
    try {
      await navigator.clipboard.writeText(item.text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      alert("Copy is not supported in this browser.");
    }
  }

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
          >
            <X />
          </button>
        </div>

        <p className="nav-label">MENU</p>

        <nav>
          <button
            className={`nav-item ${!selectedAgent ? "active" : ""}`}
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

        {selectedAgent && (
          <div className="history-panel">
            <div className="history-title">
              <span>
                <History size={16} /> Chat History
              </span>

              <button
                title="New Chat"
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
                agentChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`history-item ${
                      activeChatId === chat.id ? "selected" : ""
                    }`}
                  >
                    <button
                      className="history-open"
                      onClick={() => openExistingChat(chat)}
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

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <Sparkles size={23} />
            <h3>Build with AI</h3>
            <p>Create intelligent agents for your business.</p>

            <button onClick={() => navigateTo("create")}>
              Get Started <ArrowUpRight size={15} />
            </button>
          </div>

          <p className="version">
            VERTICAL AI PLATFORM · V3.0
          </p>
        </div>
      </aside>

      <main className="main-content">

        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            <Menu />
          </button>

          <div className="breadcrumb">
            Platform <span>/</span>
            {selectedAgent ? selectedAgent.name : "Dashboard"}
          </div>

          <div className="top-actions">
            <span className="online-dot"></span>
            <span className="online-text">System Online</span>
            <div className="avatar">V</div>
          </div>
        </header>

        {selectedAgent ? (
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

            <div className="chat-heading">
              <div
                className="chat-agent-icon"
                style={{ color: selectedAgent.color }}
              >
                <selectedAgent.icon size={30} />
              </div>

              <div className="agent-heading-info">
                <h1>{selectedAgent.name}</h1>
                <p>{selectedAgent.category} AI Assistant</p>
              </div>

              <span className="demo-badge">DEMO</span>
            </div>

            <div className="agent-switcher">
              <label htmlFor="agent-switch">
                <Bot size={16} /> Switch Agent
              </label>

              <div className="agent-select-wrapper">
                <select
                  id="agent-switch"
                  value={selectedAgent.id}
                  onChange={(e) => {
                    const nextAgent = agents.find(
                      (item) => item.id === e.target.value
                    );
                    if (nextAgent) openAgent(nextAgent);
                  }}
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>

                <ChevronDown size={16} />
              </div>
            </div>

            <div className="chat-notice">
              This is a frontend demo. Replies are sample responses,
              not generated by a live AI model.
            </div>

            <div className="chat-messages">
              {messages.map((item) => (
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
                      <button
                        onClick={() => copyMessage(item)}
                        title="Copy message"
                      >
                        {copiedId === item.id
                          ? <Check size={14} />
                          : <Copy size={14} />}
                        {copiedId === item.id ? "Copied" : "Copy"}
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
              ))}
            </div>

            <form
              className="chat-input-area"
              onSubmit={sendMessage}
            >
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Ask ${selectedAgent.name}...`}
              />

              <button
                type="submit"
                disabled={!message.trim()}
                aria-label="Send message"
              >
                <Send size={19} />
              </button>
            </form>

            <div className="workspace-bottom-actions">
              <button onClick={clearCurrentChat}>
                <Trash2 size={15} />
                Clear Current Chat
              </button>
            </div>

            <p className="chat-footer">
              Vertical AI Platform · Agent Workspace V3.0
            </p>
          </section>
        ) : (
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
                    Explore AI Agents <ArrowUpRight size={17} />
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

            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple"><Bot /></div>
                <div>
                  <p>AI AGENTS</p>
                  <h2>06</h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green"><Zap /></div>
                <div>
                  <p>INDUSTRIES</p>
                  <h2>06</h2>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue"><Sparkles /></div>
                <div>
                  <p>PLATFORM STATUS</p>
                  <h2 className="live-status">Active</h2>
                </div>
              </div>
            </section>

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
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="category-list">
                {categories.map((category) => (
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

              <div className="agents-grid">
                {filteredAgents.map((agent) => {
                  const Icon = agent.icon;

                  return (
                    <article
                      className="agent-card"
                      key={agent.id}
                    >
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
                        Explore Agent <ArrowUpRight size={16} />
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
                <Plus size={18} /> Create Agent
              </button>
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
