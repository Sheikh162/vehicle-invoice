export const maxDuration = 60;

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkUser } from '@/lib/checkUser';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { UTApi } from "uploadthing/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const utapi = new UTApi();

export async function POST(req: Request) {
  let fileUrl = "";

  try {
    const user = await checkUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { vehicleId, fileUrl: url } = body; 
    fileUrl = url;

    if (!vehicleId) return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });

    const fileRes = await fetch(fileUrl);
    const fileBuffer = await fileRes.arrayBuffer();
    const base64Data = Buffer.from(fileBuffer).toString("base64");
    const mimeType = fileRes.headers.get("content-type") || "application/pdf";

    const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    generationConfig: { responseMimeType: "application/json" }
});

    const prompt = `
      You are an expert vehicle service invoice auditor.
      Analyze this document and extract the following data strictly as JSON.
      
      If the document is NOT a vehicle invoice (e.g. a selfie, landscape, animal), return:
      { "error": "INVALID_DOCUMENT_TYPE" }

      Otherwise, return:
      {
        "serviceDate": "YYYY-MM-DD",
        "serviceCenter": "Name of the shop",
        "totalCost": Number,
        "lineItems": [
          { 
            "description": "Item Name", 
            "quantity": Number, 
            "unitPrice": Number, 
            "totalPrice": Number, 
            "category": "Part" or "Labor" 
          }
        ]
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const aiResponse = result.response.text();
    const extractedData = JSON.parse(aiResponse);

    if (extractedData.error === "INVALID_DOCUMENT_TYPE") {
        await deleteFileFromUploadThing(fileUrl);
        return NextResponse.json({ error: "The uploaded file does not appear to be a service invoice." }, { status: 400 });
    }

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
    if (fileUrl) await deleteFileFromUploadThing(fileUrl);
    
    // Fallback: If 2.5 is not available in your region yet, try "gemini-2.0-flash"
    if (error.message?.includes("404")) {
        return NextResponse.json({ error: "AI Model not available. Try changing model to different model" }, { status: 500 });
    }

    return NextResponse.json({ error: error.message || "Analysis Failed" }, { status: 500 });
  }
}

async function deleteFileFromUploadThing(fileUrl: string) {
    try {
        const fileKey = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
        if (fileKey) await utapi.deleteFiles(fileKey);
    } catch (e) {
        console.error("Failed to delete orphan file", e);
    }
}

// export const maxDuration = 60; 

// import { NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';
// import { checkUser } from '@/lib/checkUser';
// import OpenAI from 'openai';
// import ConvertApi from 'convertapi';
// import { UTApi } from "uploadthing/server"; 

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// const convertapi = new ConvertApi(process.env.CONVERT_API_SECRET as string);
// const utapi = new UTApi(); // 2. Initialize

// export async function POST(req: Request) {
//   // We need to capture fileUrl early to delete it if anything fails
//   let fileUrl = ""; 

//   try {
//     const user = await checkUser();
//     if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const body = await req.json();
//     const { vehicleId,KF, fileName } = body;
//     fileUrl = body.fileUrl; // Capture URL

//     if (!vehicleId) {
//         return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });
//     }

//     let imageUrlForAI = fileUrl;
    
//     // --- PDF Logic ---
//     let isPdf = false;
//     if (fileName && fileName.toLowerCase().endsWith('.pdf')) { isPdf = true; } 
//     else {
//         try {
//             const headRes = await fetch(fileUrl, { method: 'HEAD' });
//             if (headRes.headers.get('content-type')?.includes('application/pdf')) isPdf = true;
//         } catch (e) { console.error("Content-Type check failed", e); }
//     }

//     if (isPdf) {
//         try {
//             const result = await convertapi.convert('png', { 
//                 File: fileUrl, PageRange: '1', ScaleImage: 'true', ImageHeight: '1500',
//             }, 'pdf');
//             imageUrlForAI = (result.response as any).Files[0].Url;
//         } catch (convError: any) {
//             // Cleanup on conversion fail
//             await deleteFileFromUploadThing(fileUrl);
//             return NextResponse.json({ error: "PDF Conversion failed. File format might be corrupt." }, { status: 400 });
//         }
//     }

//     // --- AI EXTRACTION ---
//     const response = await openai.chat.completions.create({
//         model: "gpt-4o",
//         response_format: { type: "json_object" },
//         messages: [
//             {
//                 role: "system",
//                 content: `You are an API that extracts vehicle invoice data.
//                 You must return strictly valid JSON.
//                 If the image is NOT a vehicle service invoice (e.g. a selfie, a landscape, a document about cats), return exactly:
//                 { "error": "INVALID_DOCUMENT_TYPE" }

//                 Otherwise, return this schema:
//                 {
//                   "serviceDate": "YYYY-MM-DD",
//                   "serviceCenter": "Name String",
//                   "totalCost": Number,
//                   "lineItems": [
//                     { "description": "String", "quantity": Number, "unitPrice": Number, "totalPrice": Number, "category": "Part" | "Labor" }
//                   ]
//                 }`
//             },
//             {
//                 role: "user",
//                 content: [
//                     { type: "text", text: "Analyze this image." },
//                     { type: "image_url", image_url: { url: imageUrlForAI } }
//                 ],
//             },
//         ],
//     });

//     const aiContent = response.choices[0].message.content || "{}";
//     let extractedData;
    
//     try {
//         extractedData = JSON.parse(aiContent);
//     } catch (e) {
//         throw new Error("AI response was not valid JSON.");
//     }

//     // --- VALIDATION & CLEANUP CHECK ---
//     if (extractedData.error === "INVALID_DOCUMENT_TYPE") {
//         // 3. Delete the file because it's junk
//         await deleteFileFromUploadThing(fileUrl);
        
//         return NextResponse.json({ 
//             error: "The uploaded file does not appear to be a service invoice. It has been deleted." 
//         }, { status: 400 });
//     }

//     // --- SAVE TO DB ---
//     const invoice = await prisma.invoice.create({
//       data: {
//         userId: user.id,
//         vehicleId,
//         fileUrl, 
//         serviceDate: new Date(extractedData.serviceDate || new Date()),
//         serviceCenter: extractedData.serviceCenter || "Unknown Center",
//         totalCost: Number(extractedData.totalCost) || 0,
//         lineItems: {
//           create: (extractedData.lineItems || []).map((item: any) => ({
//              description: item.description || "Item",
//              quantity: Number(item.quantity) || 1,
//              unitPrice: Number(item.unitPrice) || 0,
//              totalPrice: Number(item.totalPrice) || 0,
//              category: item.category || "Part"
//           }))
//         }
//       }
//     });

//     return NextResponse.json({ invoiceId: invoice.id });

//   } catch (error: any) {
//     console.error("Analyze Error:", error);
    
//     // 4. Global Error Cleanup: If ANYTHING crashes, delete the file so it doesn't get orphaned
//     if (fileUrl) await deleteFileFromUploadThing(fileUrl);

//     return NextResponse.json({ error: error.message || "Analysis Failed" }, { status: 500 });
//   }
// }

// // Helper to extract key and delete
// async function deleteFileFromUploadThing(fileUrl: string) {
//     try {
//         const fileKey = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
//         if (fileKey) await utapi.deleteFiles(fileKey);
//         console.log("Deleted orphan file:", fileKey);
//     } catch (e) {
//         console.error("Failed to delete orphan file:", e);
//     }
// }