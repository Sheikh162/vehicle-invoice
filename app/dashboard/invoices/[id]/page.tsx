'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedQuestions: string[];
}

export default function InvoiceChatPage() {
  const params = useParams();
  const invoiceId = params?.id as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  
  // Two loading states: one for history, one for new messages
  const [fetchingHistory, setFetchingHistory] = useState(true); 
  const [aiThinking, setAiThinking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Load History on Mount
  useEffect(() => {
    const fetchHistory = async () => {
      if (!invoiceId) return;
      try {
        const res = await axios.get(`/api/invoices/${invoiceId}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to load chat history", err);
      } finally {
        setFetchingHistory(false); // Stop loading regardless of success/fail
      }
    };
    fetchHistory();
  }, [invoiceId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiThinking]); // Also scroll when AI starts thinking

  // 2. Handle Sending Message
  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || aiThinking) return;

    // Optimistic UI update
    const tempId = Date.now().toString();
    const optimisticMsg: Message = {
      id: tempId,
      role: 'user',
      content: textToSend,
      suggestedQuestions: []
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInput('');
    setAiThinking(true);

    try {
      const res = await axios.post('/api/chat', {
        invoiceId,
        message: textToSend
      });

      // Add real AI response
      const aiMsg: Message = res.data;
      setMessages((prev) => [...prev, aiMsg]);
      
    } catch (error) {
      console.error("Chat failed", error);
    } finally {
      setAiThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-4 border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground">Invoice Audit Chat</h1>
        <p className="text-sm text-muted-foreground">Ask questions about pricing, parts, or labor.</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4 scrollbar-thin">
        
        {/* STATE 1: LOADING HISTORY */}
        {fetchingHistory && (
           <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
             <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
             <p className="text-sm">Loading chat history...</p>
           </div>
        )}

        {/* STATE 2: EMPTY (No history, finished loading) */}
        {!fetchingHistory && messages.length === 0 && (
           <div className="text-center text-muted-foreground mt-20 fade-in-50">
             <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
             <p>No messages yet. Ask something about your invoice!</p>
           </div>
        )}

        {/* STATE 3: MESSAGES LIST */}
        {!fetchingHistory && messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={18} className="text-primary" />
              </div>
            )}

            <div className={`max-w-[85%] space-y-2`}>
              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-card border border-border text-card-foreground rounded-tl-none'
                }`}
              >
                <ReactMarkdown components={{
                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                    a: ({node, ...props}) => <a className="underline decoration-dotted underline-offset-2" {...props} />
                }}>
                  {msg.content}
                </ReactMarkdown>
              </div>

              {/* Follow-up Buttons */}
              {msg.role === 'assistant' && msg.suggestedQuestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      disabled={aiThinking}
                      className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full border border-border transition-colors duration-200 text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                <User size={18} className="text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        
        {/* STATE 4: AI THINKING INDICATOR */}
        {aiThinking && (
          <div className="flex items-center gap-3 ml-1">
             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot size={18} className="text-primary" />
             </div>
             <div className="flex items-center gap-2 text-muted-foreground text-sm bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-none">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="animate-pulse">Thinking...</span>
             </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this invoice..."
            className="flex-1 p-3 pl-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
            disabled={aiThinking} // Disable input while thinking to prevent spam
          />
          <button
            type="submit"
            disabled={!input.trim() || aiThinking}
            className="bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground p-3 rounded-xl transition-colors shadow-sm flex items-center justify-center min-w-[50px]"
          >
            {aiThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}