import { useState, useEffect, useRef } from "react";

const FAQ_DATA = [
  { q: "What is your return policy?", a: "You can return any item within 30 days of purchase for a full refund. Items must be unused and in original packaging. Simply visit our Returns portal or contact support." },
  { q: "How do I track my order?", a: "Once your order ships, you'll receive a tracking email with a link. You can also log into your account and visit 'My Orders' to see real-time updates." },
  { q: "Do you offer free shipping?", a: "Yes! Orders over $50 qualify for free standard shipping (5–7 business days). Expedited options are available at checkout for an additional fee." },
  { q: "How do I reset my password?", a: "Click 'Forgot Password' on the login page, enter your email, and we'll send a reset link within a few minutes. Check your spam folder if it doesn't arrive." },
  { q: "Can I change or cancel my order?", a: "Orders can be modified or cancelled within 1 hour of placement. After that, the order enters fulfillment. Contact our support team immediately for urgent changes." },
  { q: "What payment methods do you accept?", a: "We accept Visa, Mastercard, American Express, PayPal, Apple Pay, and Google Pay. All transactions are secured with 256-bit SSL encryption." },
  { q: "How long does delivery take?", a: "Standard shipping takes 5–7 business days. Express shipping is 2–3 days, and overnight is available for most locations. International orders take 10–14 days." },
  { q: "Is my personal information safe?", a: "Absolutely. We use industry-standard encryption and never sell your data to third parties. You can review our full Privacy Policy in the footer." },
  { q: "Do you ship internationally?", a: "Yes, we ship to over 50 countries. International shipping rates and delivery estimates are calculated at checkout based on your destination." },
  { q: "How do I contact customer support?", a: "Our support team is available 24/7 via live chat, email at support@shop.com, or by calling 1-800-SHOP-NOW. Average response time is under 2 hours." },
  { q: "What is your warranty policy?", a: "All products come with a 1-year manufacturer warranty covering defects. Extended warranties are available for purchase for up to 3 years." },
  { q: "Can I exchange a product?", a: "Yes! Exchanges are accepted within 30 days. Start an exchange request through your account or contact support. We'll ship the new item once we receive the return." },
  { q: "Do you have a loyalty program?", a: "Yes — join ShopRewards to earn 1 point per dollar spent. Redeem points for discounts, early access to sales, and exclusive member perks." },
  { q: "Are your products eco-friendly?", a: "We're committed to sustainability. Over 70% of our products use recycled materials, and all packaging is 100% recyclable. We're carbon-neutral by 2026." },
  { q: "How do I apply a discount code?", a: "Enter your promo code in the 'Discount Code' field on the checkout page before completing payment. Only one code can be used per order." },
];

// ─── NLP UTILITIES ───────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  "a","an","the","is","it","in","on","at","to","for","of","and","or","but",
  "with","this","that","these","those","i","you","we","they","he","she","my",
  "your","our","their","do","does","did","can","could","will","would","should",
  "have","has","had","be","been","being","am","are","was","were","how","what",
  "when","where","why","which","who","whom","its","me","him","her","us","them"
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

function buildTF(tokens) {
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const len = tokens.length || 1;
  Object.keys(tf).forEach(k => { tf[k] /= len; });
  return tf;
}

function cosineSimilarity(vecA, vecB) {
  const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, magA = 0, magB = 0;
  allKeys.forEach(k => {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

// Pre-process FAQ
const processedFAQs = FAQ_DATA.map(faq => ({
  ...faq,
  vec: buildTF(tokenize(faq.q + " " + faq.a)),
  tokens: tokenize(faq.q),
}));

function findBestMatch(userInput) {
  const userTokens = tokenize(userInput);
  const userVec = buildTF(userTokens);
  
  let best = null, bestScore = -1;
  processedFAQs.forEach(faq => {
    const score = cosineSimilarity(userVec, faq.vec);
    if (score > bestScore) { bestScore = score; best = faq; }
  });

  return { faq: best, score: bestScore };
}

// ─── TYPING EFFECT HOOK ───────────────────────────────────────────────────────
function useTypingEffect(text, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return { displayed, done };
}

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────────────────
function BotMessage({ text, score, question, isNew }) {
  const { displayed, done } = useTypingEffect(isNew ? text : "", 14);
  const shown = isNew ? displayed : text;
  
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", animation: "slideUp 0.35s ease" }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, #6ee7b7, #3b82f6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, boxShadow: "0 0 12px rgba(110,231,183,0.4)"
      }}>🤖</div>
      <div style={{ maxWidth: "78%" }}>
        {question && (
          <div style={{
            fontSize: 11, color: "#6ee7b7", fontFamily: "'DM Mono', monospace",
            marginBottom: 4, opacity: 0.85, letterSpacing: "0.04em"
          }}>
            MATCHED: {question}
            <span style={{ marginLeft: 8, opacity: 0.6 }}>
              {Math.round(score * 100)}% confidence
            </span>
          </div>
        )}
        <div style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(110,231,183,0.18)",
          borderRadius: "4px 16px 16px 16px",
          padding: "12px 16px",
          fontSize: 14, lineHeight: 1.65, color: "#e2e8f0",
          fontFamily: "'Lora', serif",
          backdropFilter: "blur(8px)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.2)"
        }}>
          {shown}
          {isNew && !done && <span style={{ animation: "blink 1s infinite", color: "#6ee7b7" }}>▌</span>}
        </div>
      </div>
    </div>
  );
}

function UserMessage({ text }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", animation: "slideUp 0.25s ease" }}>
      <div style={{
        maxWidth: "72%",
        background: "linear-gradient(135deg, #3b82f6, #6366f1)",
        borderRadius: "16px 4px 16px 16px",
        padding: "11px 16px",
        fontSize: 14, lineHeight: 1.6, color: "#fff",
        fontFamily: "'Lora', serif",
        boxShadow: "0 2px 16px rgba(99,102,241,0.35)"
      }}>{text}</div>
    </div>
  );
}

// ─── SUGGESTION CHIPS ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "How do I track my order?",
  "What's the return policy?",
  "Do you offer free shipping?",
  "How can I reset my password?",
];

// ─── MAIN CHATBOT ─────────────────────────────────────────────────────────────
export default function FAQChatbot() {
  const [messages, setMessages] = useState([
    { id: 0, role: "bot", text: "Hi there! 👋 I'm your FAQ assistant. Ask me anything about orders, shipping, returns, or your account — I'll find the best answer instantly.", score: null, question: null, isNew: false }
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [newMsgId, setNewMsgId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const sendMessage = (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isThinking) return;
    setInput("");

    const userMsg = { id: Date.now(), role: "user", text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    setTimeout(() => {
      const { faq, score } = findBestMatch(trimmed);
      const botId = Date.now() + 1;
      let botText, matchedQ;

      if (score < 0.04 || !faq) {
        botText = "I'm not sure I understood that. Could you rephrase? Try asking about orders, shipping, returns, payments, or account topics.";
        matchedQ = null;
      } else {
        botText = faq.a;
        matchedQ = faq.q;
      }

      setNewMsgId(botId);
      setMessages(prev => [...prev, { id: botId, role: "bot", text: botText, score, question: matchedQ, isNew: true }]);
      setIsThinking(false);
    }, 700 + Math.random() * 400);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,600;1,400&family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #090e1a; }
        @keyframes slideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(110,231,183,0.25); border-radius: 4px; }
        .chip:hover { background: rgba(110,231,183,0.15) !important; transform: translateY(-1px); }
        .send-btn:hover { transform: scale(1.06); box-shadow: 0 0 20px rgba(99,102,241,0.6) !important; }
        .send-btn:active { transform: scale(0.97); }
        textarea:focus { outline: none; }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "#090e1a",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px", fontFamily: "'Lora', serif",
        backgroundImage: "radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(110,231,183,0.06) 0%, transparent 50%)"
      }}>
        <div style={{
          width: "100%", maxWidth: 560,
          background: "rgba(15,21,36,0.95)",
          border: "1px solid rgba(110,231,183,0.12)",
          borderRadius: 24,
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
          display: "flex", flexDirection: "column", overflow: "hidden",
          height: "min(700px, 92vh)"
        }}>

          {/* Header */}
          <div style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            display: "flex", alignItems: "center", gap: 14
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: "50%",
              background: "linear-gradient(135deg, #6ee7b7, #3b82f6, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: "0 0 20px rgba(110,231,183,0.3)",
              flexShrink: 0
            }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18, fontWeight: 900, color: "#f1f5f9",
                letterSpacing: "-0.02em"
              }}>FAQ Assistant</div>
              <div style={{ fontSize: 12, color: "#6ee7b7", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em" }}>
                ● ONLINE · NLP-POWERED · {FAQ_DATA.length} FAQs indexed
              </div>
            </div>
            <div style={{
              fontSize: 11, color: "#475569", fontFamily: "'DM Mono', monospace",
              textAlign: "right", lineHeight: 1.5
            }}>
              cosine<br/>similarity
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "20px 20px 8px",
            display: "flex", flexDirection: "column", gap: 14
          }}>
            {messages.map(msg =>
              msg.role === "user"
                ? <UserMessage key={msg.id} text={msg.text} />
                : <BotMessage key={msg.id} text={msg.text} score={msg.score} question={msg.question} isNew={msg.id === newMsgId} />
            )}

            {isThinking && (
              <div style={{ display: "flex", gap: 10, alignItems: "center", animation: "slideUp 0.25s ease" }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #6ee7b7, #3b82f6)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
                }}>🤖</div>
                <div style={{
                  display: "flex", gap: 5, padding: "12px 16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(110,231,183,0.15)",
                  borderRadius: "4px 16px 16px 16px"
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: "#6ee7b7", opacity: 0.7,
                      animation: `pulse 1.2s ease ${i * 0.2}s infinite`
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips */}
          {messages.length <= 1 && (
            <div style={{ padding: "4px 20px 8px", display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} className="chip" onClick={() => sendMessage(s)} style={{
                  padding: "6px 12px", borderRadius: 20,
                  background: "rgba(110,231,183,0.07)",
                  border: "1px solid rgba(110,231,183,0.22)",
                  color: "#6ee7b7", fontSize: 12,
                  fontFamily: "'DM Mono', monospace",
                  cursor: "pointer", transition: "all 0.18s ease",
                  letterSpacing: "0.02em"
                }}>{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: "14px 20px 20px",
            borderTop: "1px solid rgba(255,255,255,0.05)"
          }}>
            <div style={{
              display: "flex", gap: 10, alignItems: "flex-end",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(110,231,183,0.2)",
              borderRadius: 16, padding: "10px 10px 10px 16px",
              transition: "border-color 0.2s",
              boxShadow: "0 0 0 0px rgba(110,231,183,0.1)"
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me anything..."
                rows={1}
                style={{
                  flex: 1, background: "transparent", border: "none",
                  color: "#e2e8f0", fontSize: 14, resize: "none",
                  fontFamily: "'Lora', serif", lineHeight: 1.6,
                  maxHeight: 100, overflowY: "auto",
                  caretColor: "#6ee7b7"
                }}
              />
              <button
                className="send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isThinking}
                style={{
                  width: 38, height: 38, borderRadius: 12, border: "none",
                  background: input.trim() && !isThinking
                    ? "linear-gradient(135deg, #6366f1, #3b82f6)"
                    : "rgba(255,255,255,0.06)",
                  color: input.trim() && !isThinking ? "#fff" : "#475569",
                  cursor: input.trim() && !isThinking ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                  transition: "all 0.2s ease",
                  boxShadow: input.trim() ? "0 0 12px rgba(99,102,241,0.4)" : "none"
                }}
              >➤</button>
            </div>
            <div style={{
              textAlign: "center", marginTop: 10, fontSize: 11,
              color: "#334155", fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em"
            }}>
              TF-IDF tokenization · cosine similarity matching · NLTK-style stop word removal
            </div>
          </div>
        </div>
      </div>
    </>
  );
}