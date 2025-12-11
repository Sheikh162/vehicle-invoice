export const maxDuration = 60;

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkUser } from '@/lib/checkUser';
import OpenAI from 'openai';
import { pdfToPng } from 'pdf-to-png-converter';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const user = await checkUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { fileUrl, vehicleId } = body;

    if (!vehicleId) return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });

    console.log("Analyzing File:", fileUrl);

    // Fetch the file buffer
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error("Failed to download file");
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let base64Image = "";
    let mimeType = "image/png";

    const isPdfHeader = buffer.toString('utf-8', 0, 4) === '%PDF';
    const isPdfExt = fileUrl.toLowerCase().includes('.pdf');

    if (isPdfHeader || isPdfExt) {
        console.log("PDF detected. Converting to Image (Plan B)...");
        
        try {
            const pngPages = await pdfToPng(buffer as any, { 
                disableFontFace: false, 
                useSystemFonts: false,
                viewportScale: 2.0,    
            });

            if (pngPages.length === 0) {
                throw new Error("PDF conversion returned 0 pages");
            }

            if (!pngPages[0].content) {
                throw new Error("PDF conversion succeeded but returned no image content");
            }

            base64Image = pngPages[0].content.toString('base64');
            
        } catch (convError: any) {
            console.error("PDF Conversion Failed:", convError);
            throw new Error(`Failed to convert PDF: ${convError.message}`);
        }
    } else {
        console.log("Image detected. Using original buffer.");
        base64Image = buffer.toString('base64');
        
        if (fileUrl.toLowerCase().includes('.jpg') || fileUrl.toLowerCase().includes('.jpeg')) {
            mimeType = "image/jpeg";
        } else if (fileUrl.toLowerCase().includes('.webp')) {
            mimeType = "image/webp";
        } else if (fileUrl.toLowerCase().includes('.gif')) {
            mimeType = "image/gif";
        }
    }

    console.log(`Sending to OpenAI (${mimeType}). Base64 Length: ${base64Image.length}`);

    if (!base64Image || base64Image.length < 100) {
        throw new Error("Image data is invalid or empty");
    }

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
                          "totalCost": Number (numeric only),
                          "lineItems": [
                            { "description": "Item Name", "quantity": Number, "unitPrice": Number, "totalPrice": Number, "category": "Part" or "Labor" }
                          ]
                        }
                        Do not return markdown formatting (no \`\`\`json). Just the raw JSON string.` 
                    },
                    { 
                        type: "image_url", 
                        image_url: { 
                            url: `data:${mimeType};base64,${base64Image}` 
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
        throw new Error("AI returned invalid JSON");
    }

    // Save to Database
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
             description: item.description,
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