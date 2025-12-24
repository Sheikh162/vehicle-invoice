import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkUser } from '@/lib/checkUser';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const user = await checkUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { invoiceId, message } = await req.json();

    if (!invoiceId || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch Context (Invoice + Previous Messages)
    // We strictly order messages by time to maintain conversation flow
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { 
        lineItems: true,
        messages: { orderBy: { createdAt: 'asc' } } 
      }
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    // 2. Save the NEW User Message to DB immediately
    await prisma.message.create({
      data: {
        role: 'user',
        content: message,
        invoiceId
      }
    });

    // 3. Prepare History for Gemini
    // Google uses 'model' instead of 'assistant' for the AI role.
    const history = invoice.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // 4. Configure Model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // Using your working model
      systemInstruction: `You are an expert vehicle service invoice auditor.
          
      INVOICE CONTEXT:
      - Shop: ${invoice.serviceCenter}
      - Date: ${new Date(invoice.serviceDate).toLocaleDateString()}
      - Total: ${invoice.totalCost}
      - Items: ${JSON.stringify(invoice.lineItems)}

      YOUR TASK:
      Answer the user's question accurately based on the invoice data.
      
      OUTPUT FORMAT:
      Return strictly valid JSON:
      {
        "answer": "Your response here (use Markdown for bolding key numbers)",
        "followUpQuestions": [
           "Short question 1?",
           "Short question 2?",
           "Short question 3?"
        ]
      }

      GUIDELINES:
      - The "answer" should be helpful and direct.
      - "followUpQuestions" should be 3 specific questions relevant to the invoice (e.g., about high-cost items, labor rates, or warranty).
      `,tools: [
      {
        // @ts-ignore - The SDK types might not include fileSearch yet, but the API supports it
        fileSearch: {
          fileSearchStoreNames: ["fileSearchStores/vehicle-manuals-store-zsa3ou88vstt"]
        }
      }
      ],
      generationConfig: {
        //file search incompatible with json output mode  
        //responseMimeType: "application/json" 

      }
    });

    // 5. Start Chat Session with History
    const chatSession = model.startChat({
      history: history, // Pass previous conversation
    });

    // 6. Send the NEW message
    const result = await chatSession.sendMessage(message);
    const responseText = result.response.text();

    // 7. Parse Response
    let aiParsed;
    try {
        // Clean up potential markdown code blocks (common when JSON mode is off)
        const cleanText = responseText.replace(/```json\n?|\n?```/g, '').trim();
        aiParsed = JSON.parse(cleanText);
    } catch (e) {
        // Fallback in rare case JSON is broken
        aiParsed = { 
            answer: responseText, 
            followUpQuestions: [] 
        };
    }

    // 8. Save AI Response to DB
    const savedAiMsg = await prisma.message.create({
      data: {
        role: 'assistant',
        content: aiParsed.answer || "I processed your request.",
        suggestedQuestions: aiParsed.followUpQuestions || [],
        invoiceId
      }
    });

    return NextResponse.json(savedAiMsg);

  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}

// import { NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';
// import { checkUser } from '@/lib/checkUser';
// import OpenAI from 'openai';

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// export async function POST(req: Request) {
//   try {
//     const user = await checkUser();
//     if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const { invoiceId, message } = await req.json();

//     if (!invoiceId || !message) {
//       return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
//     }

//     // 1. Fetch Context (Invoice + Previous Messages)
//     const invoice = await prisma.invoice.findUnique({
//       where: { id: invoiceId },
//       include: { 
//         lineItems: true,
//         messages: { orderBy: { createdAt: 'asc' } } 
//       }
//     });

//     if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

//     // 2. Save User Message to DB
//     await prisma.message.create({
//       data: {
//         role: 'user',
//         content: message,
//         invoiceId
//       }
//     });

//     // 3. Prepare Prompt Context
//     const conversationHistory = invoice.messages.map(msg => ({
//       role: msg.role as "user" | "assistant",
//       content: msg.content
//     }));

//     // Add current message
//     conversationHistory.push({ role: "user", content: message });

//     // 4. Call OpenAI with JSON Mode
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o",
//       response_format: { type: "json_object" }, // <--- Critical for structured output
//       messages: [
//         {
//           role: "system",
//           content: `You are an expert vehicle service invoice auditor.
          
//           INVOICE CONTEXT:
//           - Shop: ${invoice.serviceCenter}
//           - Date: ${invoice.serviceDate}
//           - Total: ${invoice.totalCost}
//           - Items: ${JSON.stringify(invoice.lineItems)}

//           YOUR TASK:
//           Answer the user's question accurately based on the invoice data.
          
//           OUTPUT FORMAT:
//           Return strictly valid JSON:
//           {
//             "answer": "Your response here (use Markdown for bolding key numbers)",
//             "followUpQuestions": [
//                "Short question 1?",
//                "Short question 2?",
//                "Short question 3?"
//             ]
//           }

//           GUIDELINES:
//           - The "answer" should be helpful and direct.
//           - "followUpQuestions" should be 3 specific questions relevant to the invoice (e.g., about high-cost items, labor rates, or warranty).
//           `
//         },
//         ...conversationHistory
//       ]
//     });

//     const aiContentRaw = response.choices[0].message.content || "{}";
//     let aiParsed;
    
//     try {
//         aiParsed = JSON.parse(aiContentRaw);
//     } catch (e) {
//         // Fallback if AI fails JSON (rare with json_object mode)
//         aiParsed = { 
//             answer: aiContentRaw, 
//             followUpQuestions: [] 
//         };
//     }

//     // 5. Save AI Message to DB
//     const savedAiMsg = await prisma.message.create({
//       data: {
//         role: 'assistant',
//         content: aiParsed.answer || "I processed your request.",
//         suggestedQuestions: aiParsed.followUpQuestions || [],
//         invoiceId
//       }
//     });

//     return NextResponse.json(savedAiMsg);

//   } catch (error) {
//     console.error("Chat Error:", error);
//     return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
//   }
// }