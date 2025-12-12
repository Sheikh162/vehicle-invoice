export const maxDuration = 60; 

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkUser } from '@/lib/checkUser';
import OpenAI from 'openai';
import ConvertApi from 'convertapi';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const convertapi = new ConvertApi(process.env.CONVERT_API_SECRET as string);

export async function POST(req: Request) {
  try {
    const user = await checkUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    console.log("RECEIVED BODY:", body); 
    const { fileUrl, vehicleId, fileName } = body;

    if (!vehicleId) return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });

    console.log("Analyzing:", fileName || fileUrl);

    let imageUrlForAI = fileUrl;

    // // 2. DETECT PDF using fileName (Reliable)
    // const nameToCheck = fileName || fileUrl;
    // const isPdf = nameToCheck.toLowerCase().endsWith('.pdf');

    let isPdf = false;

    // 1. Try checking fileName first
    if (fileName && fileName.toLowerCase().endsWith('.pdf')) {
        isPdf = true;
    } 
    // 2. Fallback: Check the Content-Type header of the URL
    else {
        try {
            const headRes = await fetch(fileUrl, { method: 'HEAD' });
            const contentType = headRes.headers.get('content-type');
            if (contentType && contentType.includes('application/pdf')) {
                isPdf = true;
            }
        } catch (e) {
            console.error("Failed to check Content-Type:", e);
        }
    }

    if (isPdf) {
        console.log("PDF detected. Sending to ConvertAPI...");
        
        try {
            const result = await convertapi.convert('png', { 
                File: fileUrl,
                PageRange: '1',
                ScaleImage: 'true',
                ImageHeight: '1500',
            },'pdf');

            imageUrlForAI = (result.response as any).Files[0].Url;
            console.log("Conversion successful. AI Image URL:", imageUrlForAI);

        } catch (convError: any) {
            console.error("ConvertAPI Failed:", convError);
            return NextResponse.json({ 
                error: "PDF Conversion failed. Please try uploading an Image (JPG/PNG) instead." 
            }, { status: 400 });
        }
    } else {
        console.log("Image detected. Skipping conversion.");
    }

    // --- SEND TO OPENAI ---
    console.log("Sending to OpenAI Vision...");

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "user",
                content: [
                    { 
                        type: "text", 
                        text: `You are an expert vehicle service invoice auditor. 
                        Extract the following fields from this invoice image strictly as JSON:
                        {
                          "serviceDate": "ISO Date String (YYYY-MM-DD)",
                          "serviceCenter": "Name of the shop",
                          "totalCost": Number (numeric only, remove currency symbols),
                          "lineItems": [
                            { "description": "Item Name", "quantity": Number, "unitPrice": Number, "totalPrice": Number, "category": "Part" or "Labor" }
                          ]
                        }
                        If a field is missing, use reasonable defaults.
                        Do not return markdown formatting (no \`\`\`json). Just the raw JSON string.` 
                    },
                    { 
                        type: "image_url", 
                        image_url: { 
                            url: imageUrlForAI 
                        } 
                    }
                ],
            },
        ],
    });

    const aiContent = response.choices[0].message.content || "{}";
    const cleanJson = aiContent.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let extractedData;
    try {
        extractedData = JSON.parse(cleanJson);
    } catch (e) {
        console.error("JSON Parse Error:", cleanJson);
        throw new Error("AI returned invalid JSON. Please upload a clearer image.");
    }

    // --- SAVE TO DB ---
    const invoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        vehicleId,
        fileUrl, 
        serviceDate: new Date(extractedData.serviceDate || new Date()),
        serviceCenter: extractedData.serviceCenter || "Unknown Center",
        totalCost: Number(extractedData.totalCost) || 0,
        lineItems: {
          create: (extractedData.lineItems || []).map((item: any) => ({
             description: item.description || "Item",
             quantity: Number(item.quantity) || 1,
             unitPrice: Number(item.unitPrice) || 0,
             totalPrice: Number(item.totalPrice) || 0,
             category: item.category || "Part"
          }))
        }
      }
    });

    return NextResponse.json({ invoiceId: invoice.id });

  } catch (error: any) {
    console.error("Analyze Error:", error);
    return NextResponse.json({ error: error.message || "Analysis Failed" }, { status: 500 });
  }
}