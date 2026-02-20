import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, User, Info, MessageSquare, ChevronRight, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ChefPage() {
  const { profile, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef(null);

  // Initialize chat history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("ff_token");
      const res = await fetch(`http://localhost:8001/chat/history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.length > 0) {
        setMessages(data);
      } else {
        // Initial welcome message from Chef
        setMessages([{
          role: "assistant",
          content: "Greetings! I am Chef Discovery, your metabolic culinary guide. I'm excited to help you craft an extraordinary meal plan. Tell me, how has your energy been today, and are there any specific flavors or ingredients you've been craving lately?"
        }]);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const handleSend = async (e, forcedMsg = null) => {
    if (e) e.preventDefault();
    const msg = forcedMsg || input.trim();
    if (!msg || isLoading) return;

    setInput("");
    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("ff_token");
      const res = await fetch("http://localhost:8001/chat/send", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          message: msg,
          user_id: user?.id,
          profile: profile
        })
      });
      const data = await res.json();
      
      const assistantMsg = { 
        role: "assistant", 
        content: data.reply || "I'm pondering the possibilities... could you try saying that again?", 
        suggestions: data.suggested_actions 
      };
      
      setMessages([...newMessages, assistantMsg]);
      setIsComplete(data.is_complete);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages([...newMessages, { 
        role: "assistant", 
        content: "I've hit a small snag in my kitchen! Please try again in a moment." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (!window.confirm("Clear conversation history?")) return;
    try {
      const token = localStorage.getItem("ff_token");
      await fetch("http://localhost:8001/chat/clear", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setMessages([{
        role: "assistant",
        content: "Resetting... I'm ready for a fresh start. What goals are we focusing on today?"
      }]);
      setIsComplete(false);
    } catch (err) {
      console.error("Clear chat error:", err);
    }
  };

  return (
    <div className="page chat-page">
      <div className="discovery-header">
        <div className="page-eyebrow">Interactive Discovery</div>
        <div className="page-title">Talk to <em>Chef Discovery</em></div>
        <div className="page-sub">
          Share your cravings, energy levels, and kitchen setup. Our Culinary intelligence synthesizes your details into a bespoke plan.
        </div>
        
        {/* Permanent Generate Plan button */}
        <div className="header-actions">
           <button 
             className={`btn ${isComplete ? 'btn-amber pulse-glow' : 'btn-outline'}`} 
             onClick={() => window.location.href='/mealplan'}
           >
             {isComplete ? '✨ Chef is Ready: Generate Plan' : 'Generate My Plan Anytime'}
           </button>
        </div>
      </div>

      <div className="chat-container glass-premium">
        <div className="chat-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble-wrap ${m.role}`}>
              <div className="chat-avatar">
                {m.role === "user" ? <User size={14} /> : <Sparkles size={14} />}
              </div>
              <div className="chat-bubble">
                <div className="chat-content">{m.content}</div>
                {m.suggestions && m.suggestions.length > 0 && !isComplete && (
                  <div className="chat-suggestions">
                    {m.suggestions.map((s, si) => (
                      <button key={si} className="suggestion-pill" onClick={() => handleSend(null, s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-bubble-wrap assistant">
              <div className="chat-avatar"><Sparkles size={14} /></div>
              <div className="chat-bubble loading-bubble">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
        </div>

        <div className="chat-footer">
          {isComplete && (
            <div className="chef-status-badge">
              <Info size={12} />
              <span>Chef says your plan is ready! You can continue chatting or generate now.</span>
            </div>
          )}
          <form className="chat-input-wrap" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Keep talking to Chef..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="send-btn" disabled={!input.trim() || isLoading}>
              <Send size={18} />
            </button>
          </form>
          <button className="clear-chat-btn" onClick={clearChat} title="Clear Session">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <style>{`
        .chat-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
          padding-bottom: 20px;
        }
        .chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          border-radius: var(--r-lg);
          overflow: hidden;
          margin-top: 20px;
          min-height: 400px;
        }
        .chat-messages {
          flex: 1;
          padding: 30px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .chat-bubble-wrap {
          display: flex;
          gap: 12px;
          max-width: 80%;
        }
        .chat-bubble-wrap.user {
          flex-direction: row-reverse;
          align-self: flex-end;
        }
        .chat-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--surface3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-light);
          border: 1px solid var(--border);
          flex-shrink: 0;
        }
        .user .chat-avatar {
          background: var(--accent-dark);
          color: var(--bg);
        }
        .chat-bubble {
          padding: 12px 18px;
          border-radius: 18px;
          font-size: 0.95rem;
          line-height: 1.5;
          position: relative;
        }
        .assistant .chat-bubble {
          background: var(--surface2);
          color: var(--cream);
          border-bottom-left-radius: 4px;
        }
        .user .chat-bubble {
          background: var(--accent-light);
          color: var(--bg);
          border-bottom-right-radius: 4px;
        }
        .chat-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .suggestion-pill {
          background: rgba(197, 216, 157, 0.1);
          border: 1px solid rgba(197, 216, 157, 0.2);
          color: var(--accent-light);
          padding: 4px 12px;
          border-radius: var(--r-pill);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .suggestion-pill:hover {
          background: var(--sage-muted);
          border-color: var(--accent-light);
        }
        .chat-footer {
          padding: 20px 30px;
          border-top: 1px solid var(--border);
          position: relative;
        }
        .chat-input-wrap {
          display: flex;
          gap: 10px;
          background: var(--surface2);
          border-radius: var(--r-pill);
          padding: 5px 5px 5px 20px;
          border: 1px solid var(--border);
          width: 100%;
          box-sizing: border-box;
          max-width: 100%;
        }
        .chat-input-wrap input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 10px 0;
          color: var(--cream);
          min-width: 0;
          outline: none;
        }
        .send-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: var(--accent-light);
          color: var(--bg);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .send-btn:hover {
          transform: scale(1.05);
        }
        .send-btn:disabled {
          background: var(--surface3);
          color: var(--muted);
          cursor: not-allowed;
          transform: none;
        }
        .clear-chat-btn {
          position: absolute;
          top: -15px;
          right: 30px;
          background: var(--surface3);
          border: 1px solid var(--border);
          color: var(--muted);
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .clear-chat-btn:hover {
          color: var(--coral);
          border-color: var(--coral);
        }
        .loading-bubble {
          display: flex;
          gap: 4px;
          padding: 15px 20px;
        }
        .dot {
          width: 6px;
          height: 6px;
          background: var(--accent-light);
          border-radius: 50%;
          animation: dotPulse 1.4s infinite ease-in-out;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
        .header-actions {
          margin-top: 15px;
          display: flex;
          justify-content: center;
        }
        .pulse-glow {
          box-shadow: 0 0 15px var(--amber);
          animation: pulseGlow 2s infinite;
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 5px var(--amber); }
          50% { box-shadow: 0 0 20px var(--amber); }
          100% { box-shadow: 0 0 5px var(--amber); }
        }
        .chef-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(197, 216, 157, 0.1);
          color: var(--accent-light);
          font-size: 0.75rem;
          padding: 6px 12px;
          border-radius: var(--r);
          margin-bottom: 10px;
          border: 1px solid rgba(197, 216, 157, 0.2);
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .btn-outline {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--muted);
        }
        .btn-outline:hover {
          border-color: var(--accent-light);
          color: var(--accent-light);
        }
      `}</style>
    </div>
  );
}
