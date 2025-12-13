'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { 
  Send, Bot, User, Loader2, FileText, ExternalLink, 
  PanelRightClose, PanelRight, ChevronLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedQuestions: string[];
}

export default function InvoiceChatPage() {
  const params = useParams();
  const invoiceId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [input, setInput] = useState('');
  
  const [fetchingHistory, setFetchingHistory] = useState(true); 
  const [aiThinking, setAiThinking] = useState(false);
  const [isPdfVisible, setIsPdfVisible] = useState(true); // Desktop: Right panel visibility
  const [mobileView, setMobileView] = useState<'chat' | 'pdf'>('chat'); // Mobile: Toggle view
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Load History AND Invoice URL
  useEffect(() => {
    if (!invoiceId) return;

    const initPage = async () => {
      try {
        const [msgRes, invRes] = await Promise.all([
            axios.get(`/api/invoices/${invoiceId}/messages`),
            axios.get(`/api/invoices/${invoiceId}`)
        ]);
        
        setMessages(msgRes.data);
        setInvoiceUrl(invRes.data.fileUrl);
      } catch (err) {
        console.error("Failed to load page data", err);
      } finally {
        setFetchingHistory(false);
      }
    };

    initPage();
  }, [invoiceId]);

  // Scroll to bottom logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiThinking]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || aiThinking) return;

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
      const aiMsg: Message = res.data;
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat failed", error);
    } finally {
      setAiThinking(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      
      {/* LEFT PANEL: Chat Interface 
         - Mobile: Hidden if view is 'pdf'
         - Desktop: Always visible, width adjusts based on PDF panel
      */}
      <div className={`
        flex flex-col h-full transition-all duration-300 ease-in-out
        ${mobileView === 'pdf' ? 'hidden md:flex' : 'flex w-full'} 
        ${isPdfVisible ? 'md:w-1/2' : 'md:w-full'}
      `}>
        
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-background shadow-sm z-10 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Audit Assistant
            </h1>
            <p className="text-xs text-muted-foreground">Analyze costs, warranties, and labor rates.</p>
          </div>

          {/* Desktop: Show PDF Button */}
          <div className="hidden md:block">
            {!isPdfVisible && invoiceUrl && (
                <Button variant="outline" size="sm" onClick={() => setIsPdfVisible(true)} className="gap-2">
                <PanelRight size={16} /> Show Invoice
                </Button>
            )}
          </div>

          {/* Mobile: View PDF Button */}
          <div className="md:hidden">
             {invoiceUrl && (
                <Button variant="outline" size="sm" onClick={() => setMobileView('pdf')}>
                   View Invoice
                </Button>
             )}
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
          {fetchingHistory && (
             <div className="space-y-4 pt-10">
                <div className="flex justify-end"><Skeleton className="h-12 w-3/4 rounded-2xl rounded-tr-none" /></div>
                <div className="flex justify-start"><Skeleton className="h-20 w-3/4 rounded-2xl rounded-tl-none" /></div>
             </div>
          )}

          {!fetchingHistory && messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
               <Bot className="w-16 h-16 mb-4 stroke-1" />
               <p>Ask me anything about this invoice.</p>
             </div>
          )}

          {!fetchingHistory && messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={16} className="text-primary" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-2`}>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-card border border-border text-card-foreground rounded-tl-none'
                  }`}>
                  <ReactMarkdown components={{
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                  }}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {msg.role === 'assistant' && msg.suggestedQuestions?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(q)}
                        disabled={aiThinking}
                        className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border transition-all text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                  <User size={16} className="text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          
          {aiThinking && (
            <div className="flex items-center gap-3 ml-1">
               <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-primary" />
               </div>
               <div className="flex items-center gap-2 text-muted-foreground text-sm bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="animate-pulse">Analyzing invoice data...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-background">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 p-3 pl-4 pr-12 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              disabled={aiThinking}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || aiThinking}
              className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg"
            >
              {aiThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </div>

      {/* RIGHT PANEL: Document Viewer 
         - Mobile: Visible only if view is 'pdf', takes full width
         - Desktop: Visible if isPdfVisible is true, takes 50% width
      */}
      <div className={`
         border-l border-border bg-muted/20 flex-col transition-all duration-300 ease-in-out
         ${mobileView === 'pdf' ? 'flex w-full' : 'hidden'}
         ${isPdfVisible ? 'md:flex md:w-1/2' : 'md:w-0 md:border-none'}
      `}>
        
        {/* PDF Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-background/50 backdrop-blur">
            <div className="flex items-center gap-2">
                {/* Mobile Back Button */}
                <div className="md:hidden">
                    <Button variant="ghost" size="icon" onClick={() => setMobileView('chat')}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </div>
                <h2 className="font-semibold flex items-center gap-2 text-foreground">
                    <FileText className="w-4 h-4 text-primary" />
                    Original Invoice
                </h2>
            </div>
            
            <div className="flex items-center gap-1">
                {invoiceUrl && (
                    <Button variant="ghost" size="icon" asChild title="Open in new tab">
                        <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </Button>
                )}
                {/* Desktop Collapse Button */}
                <div className="hidden md:block">
                    <Button variant="ghost" size="icon" onClick={() => setIsPdfVisible(false)} title="Minimize PDF">
                        <PanelRightClose className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 p-4 overflow-hidden relative">
            {fetchingHistory ? (
                <Skeleton className="w-full h-full rounded-xl" />
            ) : invoiceUrl ? (
                <iframe 
                    src={invoiceUrl} 
                    className="w-full h-full rounded-xl border border-border shadow-sm bg-white"
                    title="Invoice PDF"
                />
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    Document not available
                </div>
            )}
        </div>
      </div>

    </div>
  );
}

// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { useParams } from 'next/navigation';
// import ReactMarkdown from 'react-markdown';
// import axios from 'axios';
// import { 
//   Send, Bot, User, Loader2, FileText, ExternalLink, 
//   PanelRightClose, PanelRight 
// } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Skeleton } from '@/components/ui/skeleton';

// interface Message {
//   id: string;
//   role: 'user' | 'assistant';
//   content: string;
//   suggestedQuestions: string[];
// }

// export default function InvoiceChatPage() {
//   const params = useParams();
//   const invoiceId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
//   const [input, setInput] = useState('');
  
//   const [fetchingHistory, setFetchingHistory] = useState(true); 
//   const [aiThinking, setAiThinking] = useState(false);
//   const [isPdfVisible, setIsPdfVisible] = useState(true); // Default: Open
  
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   // 1. Load History AND Invoice URL
//   useEffect(() => {
//     if (!invoiceId) return;

//     const initPage = async () => {
//       try {
//         const [msgRes, invRes] = await Promise.all([
//             axios.get(`/api/invoices/${invoiceId}/messages`),
//             axios.get(`/api/invoices/${invoiceId}`)
//         ]);
        
//         setMessages(msgRes.data);
//         setInvoiceUrl(invRes.data.fileUrl);
//       } catch (err) {
//         console.error("Failed to load page data", err);
//       } finally {
//         setFetchingHistory(false);
//       }
//     };

//     initPage();
//   }, [invoiceId]);

//   // Scroll to bottom logic
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages, aiThinking]);

//   const handleSend = async (textOverride?: string) => {
//     const textToSend = textOverride || input;
//     if (!textToSend.trim() || aiThinking) return;

//     const tempId = Date.now().toString();
//     const optimisticMsg: Message = {
//       id: tempId,
//       role: 'user',
//       content: textToSend,
//       suggestedQuestions: []
//     };

//     setMessages((prev) => [...prev, optimisticMsg]);
//     setInput('');
//     setAiThinking(true);

//     try {
//       const res = await axios.post('/api/chat', {
//         invoiceId,
//         message: textToSend
//       });
//       const aiMsg: Message = res.data;
//       setMessages((prev) => [...prev, aiMsg]);
//     } catch (error) {
//       console.error("Chat failed", error);
//     } finally {
//       setAiThinking(false);
//     }
//   };

//   return (
//     <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      
//       {/* 1. LEFT PANEL: Chat Interface */}
//       <div className={`flex flex-col h-full transition-all duration-300 ease-in-out ${isPdfVisible ? 'w-full md:w-1/2' : 'w-full'}`}>
        
//         {/* Chat Header */}
//         <div className="p-4 border-b border-border bg-background shadow-sm z-10 flex justify-between items-center">
//           <div>
//             <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
//               <Bot className="w-5 h-5 text-primary" />
//               Audit Assistant
//             </h1>
//             <p className="text-xs text-muted-foreground">Analyze costs, warranties, and labor rates.</p>
//           </div>

//           {/* Show PDF Button (Visible only when hidden) */}
//           {!isPdfVisible && invoiceUrl && (
//             <Button 
//               variant="outline" 
//               size="sm" 
//               onClick={() => setIsPdfVisible(true)}
//               className="gap-2 text-muted-foreground hover:text-foreground"
//             >
//               <PanelRight size={16} />
//               Show Invoice
//             </Button>
//           )}
//         </div>

//         {/* Messages List */}
//         <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
//           {fetchingHistory && (
//              <div className="space-y-4 pt-10">
//                 <div className="flex justify-end"><Skeleton className="h-12 w-3/4 rounded-2xl rounded-tr-none" /></div>
//                 <div className="flex justify-start"><Skeleton className="h-20 w-3/4 rounded-2xl rounded-tl-none" /></div>
//              </div>
//           )}

//           {!fetchingHistory && messages.length === 0 && (
//              <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
//                <Bot className="w-16 h-16 mb-4 stroke-1" />
//                <p>Ask me anything about this invoice.</p>
//              </div>
//           )}

//           {!fetchingHistory && messages.map((msg) => (
//             <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
//               {msg.role === 'assistant' && (
//                 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
//                   <Bot size={16} className="text-primary" />
//                 </div>
//               )}

//               <div className={`max-w-[85%] space-y-2`}>
//                 <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
//                     msg.role === 'user'
//                       ? 'bg-primary text-primary-foreground rounded-tr-none'
//                       : 'bg-card border border-border text-card-foreground rounded-tl-none'
//                   }`}>
//                   <ReactMarkdown components={{
//                       ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
//                       ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
//                       p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
//                       strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
//                   }}>
//                     {msg.content}
//                   </ReactMarkdown>
//                 </div>

//                 {msg.role === 'assistant' && msg.suggestedQuestions?.length > 0 && (
//                   <div className="flex flex-wrap gap-2">
//                     {msg.suggestedQuestions.map((q, idx) => (
//                       <button
//                         key={idx}
//                         onClick={() => handleSend(q)}
//                         disabled={aiThinking}
//                         className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border transition-all text-left"
//                       >
//                         {q}
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               {msg.role === 'user' && (
//                 <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
//                   <User size={16} className="text-muted-foreground" />
//                 </div>
//               )}
//             </div>
//           ))}
          
//           {aiThinking && (
//             <div className="flex items-center gap-3 ml-1">
//                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
//                   <Bot size={16} className="text-primary" />
//                </div>
//                <div className="flex items-center gap-2 text-muted-foreground text-sm bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                   <span className="animate-pulse">Analyzing invoice data...</span>
//                </div>
//             </div>
//           )}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Input Area */}
//         <div className="p-4 border-t border-border bg-background">
//           <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 relative">
//             <input
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Type your question..."
//               className="flex-1 p-3 pl-4 pr-12 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
//               disabled={aiThinking}
//             />
//             <Button 
//               type="submit" 
//               size="icon"
//               disabled={!input.trim() || aiThinking}
//               className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg"
//             >
//               {aiThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
//             </Button>
//           </form>
//         </div>
//       </div>

//       {/* 2. RIGHT PANEL: Document Viewer (Collapsible) */}
//       <div className={`${isPdfVisible ? 'w-1/2 border-l' : 'w-0 border-none'} hidden md:flex border-border bg-muted/20 flex-col transition-all duration-300 ease-in-out`}>
        
//         {/* PDF Header */}
//         <div className={`p-4 border-b border-border flex justify-between items-center bg-background/50 backdrop-blur ${!isPdfVisible ? 'hidden' : ''}`}>
//             <h2 className="font-semibold flex items-center gap-2 text-foreground">
//                 <FileText className="w-4 h-4 text-primary" />
//                 Original Invoice
//             </h2>
//             <div className="flex items-center gap-1">
//                 {invoiceUrl && (
//                     <Button variant="ghost" size="icon" asChild title="Open in new tab">
//                         <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">
//                             <ExternalLink className="w-4 h-4" />
//                         </a>
//                     </Button>
//                 )}
//                 <Button variant="ghost" size="icon" onClick={() => setIsPdfVisible(false)} title="Minimize PDF">
//                     <PanelRightClose className="w-4 h-4" />
//                 </Button>
//             </div>
//         </div>

//         {/* PDF Content */}
//         <div className={`flex-1 p-4 overflow-hidden relative ${!isPdfVisible ? 'hidden' : ''}`}>
//             {fetchingHistory ? (
//                 <Skeleton className="w-full h-full rounded-xl" />
//             ) : invoiceUrl ? (
//                 <iframe 
//                     src={invoiceUrl} 
//                     className="w-full h-full rounded-xl border border-border shadow-sm bg-white"
//                     title="Invoice PDF"
//                 />
//             ) : (
//                 <div className="flex items-center justify-center h-full text-muted-foreground">
//                     Document not available
//                 </div>
//             )}
//         </div>
//       </div>

//     </div>
//   );
// }