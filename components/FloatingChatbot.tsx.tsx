"use client";

import { useState, useRef, useEffect } from "react";
import { faqData } from "@/data/faq";
import { Bot, X, Send } from "lucide-react"; // nice icons

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

    // Simulate bot thinking
    setTimeout(() => {
      const foundFaq = faqData.find((faq) =>
        faq.question.toLowerCase().includes(text.toLowerCase()) ||
        faq.answer.toLowerCase().includes(text.toLowerCase())
      );

      const botResponse = {
        sender: "bot" as const,
        text: foundFaq ? foundFaq.answer : "Sorry, I couldn't find an answer to your question.",
      };

      setMessages((prev) => [...prev, botResponse]);
      setBotThinking(false);
    }, 1000); // 1 second delay
  };

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, botThinking]);

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-[#5aa4f3] text-white p-4 rounded-full shadow-lg hover:bg-[#5aa4f3] transition-all flex items-center justify-center z-50"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </button>

      {/* Chat Box */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white shadow-2xl rounded-lg flex flex-col overflow-hidden z-50">
          {/* Header */}
          <div className="bg-[#5aa4f3] text-white p-3 font-semibold flex items-center gap-2">
            <Bot size={20} />
            LMCS Assistant
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

            {/* Bot thinking animation */}
            {botThinking && (
              <div className="flex justify-start">
                <div className="p-2 rounded-lg max-w-xs bg-gray-200 text-black animate-pulse">
                  Typing...
                </div>
              </div>
            )}

            {/* Suggested Questions */}
            {!botThinking && (
              <div className="flex flex-col gap-2 mt-4">
                <div className="text-gray-500 text-sm mb-2">Suggested questions:</div>
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

          {/* Input Box */}
          <div className="p-2 border-t flex">
            <input
              type="text"
              placeholder="Type a message..."
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
        </div>
      )}
    </>
  );
}



