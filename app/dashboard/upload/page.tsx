'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Using ShadCN button
import { Loader2, UploadCloud, X } from 'lucide-react';
import { UploadDropzone } from "@uploadthing/react"; // 1. Import UploadThing Component
import type { OurFileRouter } from "@/app/api/uploadthing/core"; // 2. Import Types

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');

  const [analyzing, setAnalyzing] = useState(false);

  // 3. Helper function that runs AFTER file is uploaded
  const onUploadComplete = async (fileUrl: string, fileName: string) => {
    if (!vehicleId) {
        toast.error("No vehicle selected. Please go back.");
        return;
    }

    setAnalyzing(true);
    const toastId = toast.loading("File uploaded! Analyzing content...");

    try {
      // 4. Send the REAL URL to your Analyze API
      const res = await axios.post('/api/invoices/analyze', { 
        fileUrl: fileUrl, // <--- REAL URL from UploadThing
        vehicleId: vehicleId 
      });

      toast.success("Analysis Complete!", { id: toastId });
      router.push(`/dashboard/invoices/${res.data.invoiceId}`);
      
    } catch (error: any) {
      console.error(error);
      toast.error("Analysis failed. Please try again.", { id: toastId });
      setAnalyzing(false); 
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {!analyzing ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                {/* 5. The UploadThing Dropzone Component */}
                <UploadDropzone<OurFileRouter, "invoiceUploader">
                    endpoint="invoiceUploader"
                    onClientUploadComplete={(res) => {
                        if (res && res[0]) {
                            const file = res[0];
                            console.log("Upload Completed:", file.ufsUrl);
                            // Trigger the analysis immediately after upload
                            onUploadComplete(file.ufsUrl, file.name);
                        }
                    }}
                    onUploadError={(error: Error) => {
                        toast.error(`Upload failed: ${error.message}`);
                    }}
                    appearance={{
                        button: "bg-blue-600 text-white hover:bg-blue-700",
                        container: "w-full"
                    }}
                />
            </div>
        ) : (
            // 6. Loading State View
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <div className="text-center">
                    <p className="text-lg font-medium">Analyzing Invoice...</p>
                    <p className="text-sm text-muted-foreground">This may take a few seconds.</p>
                </div>
            </div>
        )}

      </CardContent>
    </Card>
  );
}

export default function UploadPage() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <PageHeader title="Upload Service Invoice" />
      <Suspense fallback={<div>Loading...</div>}>
        <UploadContent />
      </Suspense>
    </div>
  );
}