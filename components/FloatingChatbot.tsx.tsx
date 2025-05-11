"use client";

import { useState, useRef, useEffect } from "react";
import { faqData } from "@/data/faq";
import { Bot, X, Send } from "lucide-react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [botThinking, setBotThinking] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage = { sender: "user" as const, text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setBotThinking(true);

    setTimeout(() => {
      const foundFaq = faqData.find(
        (faq) =>
          faq.question.toLowerCase().includes(text.toLowerCase()) ||
          faq.answer.toLowerCase().includes(text.toLowerCase())
      );

      const botResponse = {
        sender: "bot" as const,
        text: foundFaq
          ? foundFaq.answer
          : "Désolé, je n'ai pas trouvé de réponse à votre question.",
      };

      setMessages((prev) => [...prev, botResponse]);
      setBotThinking(false);
    }, 1000);
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, botThinking]);

  // 🔍 Suggestions en direct
  const filteredSuggestions = input.trim()
    ? faqData.filter((faq) =>
        faq.question.toLowerCase().includes(input.toLowerCase())
      )
    : [];

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-[#5aa4f3] text-white p-4 rounded-full shadow-lg hover:bg-[#5aa4f3] transition-all flex items-center justify-center z-50"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </button>

      {/* Fenêtre du chatbot */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white shadow-2xl rounded-lg flex flex-col overflow-hidden z-50">
          {/* En-tête */}
          <div className="bg-[#5aa4f3] text-white p-3 font-semibold flex items-center gap-2">
            <Bot size={20} />
            Assistant LMCS
          </div>

          {/* Messages */}
          <div
            ref={chatRef}
            className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 custom-scrollbar"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-2 rounded-lg max-w-xs ${
                    msg.sender === "user" ? "bg-[#5aa4f3] text-white" : "bg-gray-200 text-black"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {botThinking && (
              <div className="flex justify-start">
                <div className="p-2 rounded-lg max-w-xs bg-gray-200 text-black animate-pulse">
                  En train d’écrire...
                </div>
              </div>
            )}

            {/* Suggestions par défaut quand aucune saisie */}
            {!botThinking && messages.length === 0 && (
              <div className="flex flex-col gap-2 mt-4">
                <div className="text-gray-500 text-sm mb-2">Questions suggérées :</div>
                {faqData.slice(0, 3).map((faq, idx) => (
                  <button
                    key={`suggestion-${idx}`}
                    onClick={() => handleSend(faq.question)}
                    className="bg-gray-100 hover:bg-gray-200 text-left p-2 rounded text-sm"
                  >
                    {faq.question}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Zone de saisie */}
          <div className="p-2 border-t flex flex-col gap-2">
            <div className="flex">
              <input
                type="text"
                placeholder="Écrivez votre question..."
                className="flex-1 p-2 text-sm border rounded-l focus:outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend(input);
                }}
              />
              <button
                onClick={() => handleSend(input)}
                className="bg-[#5aa4f3] hover:bg-[#77e4ff] p-2 rounded-r text-white"
              >
                <Send size={18} />
              </button>
            </div>

            {/* Suggestions dynamiques */}
            {filteredSuggestions.length > 0 && (
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto custom-scrollbar">
                {filteredSuggestions.slice(0, 5).map((faq, idx) => (
                  <button
                    key={`dynamic-suggestion-${idx}`}
                    onClick={() => handleSend(faq.question)}
                    className="bg-gray-100 hover:bg-gray-200 text-left p-2 rounded text-sm"
                  >
                    {faq.question}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
