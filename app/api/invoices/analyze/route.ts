import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import {PDFParse} from 'pdf-parse'; // Import the parser
import { checkUser } from '@/lib/checkUser';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    // const { userId: clerkUserId } = await auth();
    // if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // const user = await prisma.user.findUnique({
    //     where: { clerkId: clerkUserId },
    //     select: { id: true },
    // });
    // if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const user = await checkUser(); 

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const internalUserId = user.id;

    const body = await req.json();
    const { fileUrl, vehicleId } = body;

    if (!vehicleId) return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });

    console.log("Analyzing File:", fileUrl);

    const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
    let aiResponseContent = "";

    if (isPdf) {
        console.log("Detected PDF. Extracting text...");
        const res = await fetch(fileUrl);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const pdfData = new PDFParse({url: fileUrl})
        const extractedText = await pdfData.getText()

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an expert vehicle service invoice auditor. Extract valid JSON from the provided invoice text.
                    JSON Structure:
                    {
                      "serviceDate": "ISO Date String",
                      "serviceCenter": "Name of the shop",
                      "totalCost": Number,
                      "lineItems": [
                        { "description": "Item Name", "quantity": Number, "unitPrice": Number, "totalPrice": Number, "category": "Part" or "Labor" }
                      ]
                    }`
                },
                { role: "user", content: extractedText.text }
            ],
            response_format: { type: "json_object" }
        });
        aiResponseContent = response.choices[0].message.content || "";
    } 
    
    else {
        console.log("Detected Image. Using GPT-4o Vision...");
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { 
                            type: "text", 
                            text: `Extract valid JSON from this invoice image.
                            Structure:
                            {
                              "serviceDate": "ISO Date String",
                              "serviceCenter": "Name of the shop",
                              "totalCost": Number,
                              "lineItems": [
                                { "description": "Item Name", "quantity": Number, "unitPrice": Number, "totalPrice": Number, "category": "Part" or "Labor" }
                              ]
                            }` 
                        },
                        { type: "image_url", image_url: { url: fileUrl } }
                    ],
                },
            ],
            response_format: { type: "json_object" },
        });
        aiResponseContent = response.choices[0].message.content || "";
    }

    if (!aiResponseContent) throw new Error("No content from OpenAI");

    // save to db
    const extractedData = JSON.parse(aiResponseContent);
    
    const invoice = await prisma.invoice.create({
      data: {
        userId: internalUserId,
        vehicleId,
        fileUrl,
        serviceDate: new Date(extractedData.serviceDate || new Date()),
        serviceCenter: extractedData.serviceCenter || "Unknown Center",
        totalCost: extractedData.totalCost || 0,
        lineItems: {
          create: extractedData.lineItems.map((item: any) => ({
             description: item.description,
             quantity: item.quantity || 1,
             unitPrice: item.unitPrice || 0,
             totalPrice: item.totalPrice || 0,
             category: item.category || "Part"
          }))
        }
      }
    });

    return NextResponse.json({ invoiceId: invoice.id });

  } catch (error) {
    console.error("Analyze Error:", error);
    return NextResponse.json({ error: "Analysis Failed" }, { status: 500 });
  }
}