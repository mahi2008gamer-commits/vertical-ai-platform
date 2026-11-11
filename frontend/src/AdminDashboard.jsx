
import { useMemo, useState } from "react";
import {
  LayoutDashboard, Bot, MessagesSquare, MessageSquare,
  Search, Download, ArrowLeft, Activity, ShieldCheck,
  Users, Sparkles, Clock, Database
} from "lucide-react";
import "./AdminDashboard.css";

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString();
}

export default function AdminDashboard({
  chats = [],
  agents = [],
  onBack
}) {
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");

  const safeChats = Array.isArray(chats) ? chats : [];
  const safeAgents = Array.isArray(agents) ? agents : [];

  const totalMessages = safeChats.reduce(
    (total, chat) =>
      total + (Array.isArray(chat.messages) ? chat.messages.length : 0),
    0
  );

  const customAgents = safeAgents.filter(agent => agent.isCustom);

  const filteredAgents = useMemo(() => {
    const q = search.toLowerCase().trim();
    return safeAgents.filter(agent =>
      `${agent.name || ""} ${agent.category || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [safeAgents, search]);

  const filteredChats = useMemo(() => {
    const q = search.toLowerCase().trim();
    return safeChats.filter(chat =>
      `${chat.title || ""} ${chat.agentName || ""} ${chat.agentId || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [safeChats, search]);

  function exportData() {
    const data = {
      exportedAt: new Date().toISOString(),
      summary: {
        totalAgents: safeAgents.length,
        customAgents: customAgents.length,
        totalConversations: safeChats.length,
        totalMessages
      },
      agents: safeAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        category: agent.category,
        description: agent.description,
        isCustom: Boolean(agent.isCustom)
      })),
      conversations: safeChats
    };

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vertical-ai-admin-export.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  const stats = [
    {
      label: "Total Agents",
      value: safeAgents.length,
      icon: Bot,
      color: "purple"
    },
    {
      label: "Conversations",
      value: safeChats.length,
      icon: MessagesSquare,
      color: "blue"
    },
    {
      label: "Total Messages",
      value: totalMessages,
      icon: MessageSquare,
      color: "green"
    },
    {
      label: "Custom Agents",
      value: customAgents.length,
      icon: Sparkles,
      color: "orange"
    }
  ];

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <div>
          <div className="admin-eyebrow">
            <ShieldCheck size={15} /> ADMIN CONTROL CENTER
          </div>
          <h1>Admin Dashboard</h1>
          <p>Manage and monitor your Vertical AI Platform.</p>
        </div>

        <button className="admin-back" onClick={onBack}>
          <ArrowLeft size={17} /> Back to app
        </button>
      </div>

      <div className="admin-notice">
        <Activity size={18} />
        <div>
          <strong>Frontend preview mode</strong>
          <span>
            Showing data saved in this browser. Backend analytics
            will be connected in a later phase.
          </span>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={tab === "overview" ? "selected" : ""}
          onClick={() => {
            setTab("overview");
            setSearch("");
          }}
        >
          <LayoutDashboard size={17} /> Overview
        </button>

        <button
          className={tab === "agents" ? "selected" : ""}
          onClick={() => {
            setTab("agents");
            setSearch("");
          }}
        >
          <Bot size={17} /> Agents
        </button>

        <button
          className={tab === "conversations" ? "selected" : ""}
          onClick={() => {
            setTab("conversations");
            setSearch("");
          }}
        >
          <MessagesSquare size={17} /> Conversations
        </button>
      </div>

      {tab === "overview" && (
        <>
          <div className="admin-stats">
            {stats.map(item => {
              const Icon = item.icon;
              return (
                <article className="admin-stat" key={item.label}>
                  <div className={`admin-stat-icon ${item.color}`}>
                    <Icon size={21} />
                  </div>
                  <div>
                    <span>{item.label}</span>
                    <strong>{item.value.toLocaleString()}</strong>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="admin-grid">
            <article className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <h2>Platform summary</h2>
                  <p>Current browser data overview</p>
                </div>
                <Database size={20} />
              </div>

              <div className="admin-summary-row">
                <span>Built-in agents</span>
                <strong>{safeAgents.length - customAgents.length}</strong>
              </div>
              <div className="admin-summary-row">
                <span>Custom agents</span>
                <strong>{customAgents.length}</strong>
              </div>
              <div className="admin-summary-row">
                <span>Conversations</span>
                <strong>{safeChats.length}</strong>
              </div>
              <div className="admin-summary-row">
                <span>Messages</span>
                <strong>{totalMessages}</strong>
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <h2>Quick actions</h2>
                  <p>Admin utilities</p>
                </div>
                <Activity size={20} />
              </div>

              <button
                className="admin-action"
                onClick={() => setTab("agents")}
              >
                <Bot size={18} />
                <span>View all agents</span>
                <strong>→</strong>
              </button>

              <button
                className="admin-action"
                onClick={() => setTab("conversations")}
              >
                <MessagesSquare size={18} />
                <span>View conversations</span>
                <strong>→</strong>
              </button>

              <button className="admin-action" onClick={exportData}>
                <Download size={18} />
                <span>Export platform data</span>
                <strong>↓</strong>
              </button>
            </article>
          </div>

          <article className="admin-panel admin-recent">
            <div className="admin-panel-title">
              <div>
                <h2>Recent conversations</h2>
                <p>Latest conversations stored on this device</p>
              </div>
              <Clock size={20} />
            </div>

            {safeChats.length === 0 ? (
              <div className="admin-empty">
                No conversations found yet.
              </div>
            ) : (
              safeChats.slice(0, 5).map(chat => (
                <div className="admin-list-row" key={chat.id}>
                  <div className="admin-row-icon">
                    <MessageSquare size={17} />
                  </div>
                  <div className="admin-row-main">
                    <strong>{chat.title || "New conversation"}</strong>
                    <span>
                      {chat.agentName || chat.agentId || "AI Agent"}
                    </span>
                  </div>
                  <span className="admin-row-date">
                    {formatDate(chat.updatedAt || chat.createdAt)}
                  </span>
                </div>
              ))
            )}
          </article>
        </>
      )}

      {tab === "agents" && (
        <article className="admin-panel admin-table-panel">
          <div className="admin-panel-title">
            <div>
              <h2>Agent management</h2>
              <p>{safeAgents.length} agents available in this app</p>
            </div>
            <Bot size={20} />
          </div>

          <div className="admin-search">
            <Search size={18} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search agents..."
            />
          </div>

          {filteredAgents.length === 0 ? (
            <div className="admin-empty">No matching agents found.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Category</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map(agent => (
                    <tr key={agent.id}>
                      <td>
                        <strong>{agent.name}</strong>
                        <span>{agent.description || "AI assistant"}</span>
                      </td>
                      <td>{agent.category || "General"}</td>
                      <td>
                        <span className={`admin-tag ${agent.isCustom ? "custom" : ""}`}>
                          {agent.isCustom ? "Custom" : "Built-in"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      )}

      {tab === "conversations" && (
        <article className="admin-panel admin-table-panel">
          <div className="admin-panel-title">
            <div>
              <h2>Conversation records</h2>
              <p>{safeChats.length} conversations stored locally</p>
            </div>
            <MessagesSquare size={20} />
          </div>

          <div className="admin-search">
            <Search size={18} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search conversations..."
            />
          </div>

          {filteredChats.length === 0 ? (
            <div className="admin-empty">
              No matching conversations found.
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Conversation</th>
                    <th>Agent</th>
                    <th>Messages</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChats.map(chat => (
                    <tr key={chat.id}>
                      <td>
                        <strong>{chat.title || "New conversation"}</strong>
                        <span>{chat.id || "Local record"}</span>
                      </td>
                      <td>{chat.agentName || chat.agentId || "AI Agent"}</td>
                      <td>
                        {Array.isArray(chat.messages)
                          ? chat.messages.length
                          : 0}
                      </td>
                      <td>
                        {formatDate(chat.updatedAt || chat.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      )}

      <div className="admin-footer">
        <Users size={15} />
        User accounts and permissions will appear after backend integration.
      </div>
    </section>
  );
}
