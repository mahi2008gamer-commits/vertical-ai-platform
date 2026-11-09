import { useState } from "react";
import {
  Search,
  LayoutDashboard,
  Compass,
  Bot,
  Plus,
  ArrowUpRight,
  Sparkles,
  Menu,
  X,
  Zap,
  HeartPulse,
  Sprout,
  Landmark,
  ShoppingBag,
  Factory,
  GraduationCap
} from "lucide-react";

const agents = [
  {
    name: "Medical Assistant",
    category: "Healthcare",
    description: "AI assistant for medical information and patient support.",
    icon: HeartPulse,
    color: "#22c55e",
    status: "Popular"
  },
  {
    name: "Agri Expert AI",
    category: "Agriculture",
    description: "Get farming guidance, crop insights and smart suggestions.",
    icon: Sprout,
    color: "#84cc16",
    status: "Featured"
  },
  {
    name: "Finance Advisor",
    category: "Finance",
    description: "Understand financial data and business performance.",
    icon: Landmark,
    color: "#38bdf8",
    status: "Popular"
  },
  {
    name: "Retail Assistant",
    category: "Retail",
    description: "AI support for customers, products and retail operations.",
    icon: ShoppingBag,
    color: "#c084fc",
    status: "New"
  },
  {
    name: "Industry Expert",
    category: "Manufacturing",
    description: "Improve industrial workflows and operational efficiency.",
    icon: Factory,
    color: "#fb923c",
    status: "New"
  },
  {
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

export default function App() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const filteredAgents = agents.filter((agent) => {
    const matchesCategory =
      activeCategory === "All" ||
      agent.category === activeCategory;

    const matchesSearch =
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.category.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="app">

      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Bot size={25} />
          </div>
          <span>Vertical<span className="brand-light">AI</span></span>
          <button
            className="close-menu"
            onClick={() => setMobileMenu(false)}
          >
            <X />
          </button>
        </div>

        <p className="nav-label">MENU</p>

        <nav>
          <a className="nav-item active" href="#dashboard">
            <LayoutDashboard size={19} />
            Dashboard
          </a>

          <a className="nav-item" href="#agents">
            <Compass size={19} />
            Explore Agents
          </a>

          <a className="nav-item" href="#create">
            <Plus size={19} />
            Create AI Agent
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <Sparkles size={23} />
            <h3>Build with AI</h3>
            <p>Create intelligent agents for your business.</p>
            <a href="#create">Get Started <ArrowUpRight size={15} /></a>
          </div>
          <p className="version">VERTICAL AI PLATFORM · V1.0</p>
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
            Platform <span>/</span> Dashboard
          </div>

          <div className="top-actions">
            <span className="online-dot"></span>
            <span className="online-text">System Online</span>
            <div className="avatar">V</div>
          </div>
        </header>

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
              type="text"
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
                <article className="agent-card" key={agent.name}>
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

                  <a href="#create" className="agent-link">
                    Explore Agent <ArrowUpRight size={16} />
                  </a>
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
              Design an intelligent assistant tailored to your
              business needs.
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

      </main>
    </div>
  );
}
