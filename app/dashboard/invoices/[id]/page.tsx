'use client';

import { useState, useEffect, use } from 'react';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function InvoiceChatPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. Unwrap the params properly
  const { id: invoiceId } = use(params);

  const [messages, setMessages] = useState([
    { role: 'ai', content: 'I have analyzed your invoice. Ask me anything about it!' }
  ]);
  const [input, setInput] = useState('');
  
  // 2. New State for the PDF URL
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);

  // 3. Fetch the real Invoice URL on mount
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await axios.get(`/api/invoices/${invoiceId}`);
        setInvoiceUrl(res.data.fileUrl);
      } catch (error) {
        console.error("Failed to fetch invoice PDF:", error);
      } finally {
        setLoadingPdf(false);
      }
    };

    if (invoiceId) fetchInvoice();
  }, [invoiceId]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    try {
      const res = await axios.post('/api/chat', {
        invoiceId: invoiceId, 
        messages: newMessages
      });

      setMessages((prev) => [...prev, res.data]); 
    } catch (error) {
      console.error("Chat failed", error);
    }
  };

  return (
    <div className="container mx-auto py-4 h-[calc(100vh-80px)] flex flex-col">
      <PageHeader title="Invoice Verification" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full pb-4">

        {/* LEFT: Viewer */}
        <Card className="h-full flex flex-col overflow-hidden border-2">
          <CardHeader className="py-3 border-b">
            <CardTitle className="text-md">Original Invoice</CardTitle>
          </CardHeader>
          <div className="flex-1 bg-gray-100 flex items-center justify-center relative overflow-auto p-4">
            
            {loadingPdf && <Loader2 className="h-8 w-8 animate-spin" />}
            
            {!loadingPdf && invoiceUrl && (
              <>
                {/* Simple check: If it ends in .pdf, use iframe. Otherwise, use img */}
                {invoiceUrl.toLowerCase().endsWith('.pdf') ? (
                    <iframe 
                      src={invoiceUrl} 
                      className="w-full h-full border-none"
                      title="Invoice PDF"
                    />
                ) : (
                    <img 
                      src={invoiceUrl} 
                      alt="Invoice" 
                      className="max-w-full max-h-full object-contain shadow-md"
                    />
                )}
              </>
            )}
          </div>
        </Card>

        {/* RIGHT: Chat Interface */}
        <Card className="h-full flex flex-col border-2 shadow-lg">
          <CardHeader className="py-3 border-b">
            <CardTitle className="text-md">AI Assistant</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t flex gap-2">
              <Input 
                placeholder="Ask e.g. 'Is this labor cost fair?'" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button size="icon" onClick={handleSend}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

