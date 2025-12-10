import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { invoiceId, messages } = await req.json();
    // Convert 'ai' role from frontend to 'assistant' for OpenAI
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role === 'ai' ? 'assistant' : msg.role,
      content: msg.content
    }));
    // 1. Fetch Context
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { lineItems: true }
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    // 2. Construct System Context
    const systemPrompt = `
    You are an AI auditor for vehicle service bills.
    Here is the invoice data you are analyzing:
    - Service Center: ${invoice.serviceCenter}
    - Total Cost: ${invoice.totalCost}
    - Date: ${invoice.serviceDate}
    - Line Items: ${JSON.stringify(invoice.lineItems)}

    Answer the user's questions based on this data. 
    If they ask if a price is fair, compare it to general market knowledge for standard cars.
    Be concise and helpful.
    `;

    // 3. Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...formattedMessages 
      ]
    });

    // Return 'ai' role to frontend to keep your UI consistent
    return NextResponse.json({ 
      role: 'ai', // You can keep sending 'ai' back if your frontend expects it
      content: response.choices[0].message.content 
    });

  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: "Chat Failed" }, { status: 500 });
  }
}