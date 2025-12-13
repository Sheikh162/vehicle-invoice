'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { UploadDropzone } from "@uploadthing/react"; 
import type { OurFileRouter } from "@/app/api/uploadthing/core"; 

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');

  const [analyzing, setAnalyzing] = useState(false);

  const onUploadComplete = async (fileUrl: string, fileName: string) => {
    if (!vehicleId) {
        toast.error("No vehicle selected. Please go back.");
        return;
    }

    setAnalyzing(true);
    const toastId = toast.loading("File uploaded! Analyzing content...");

    try {
      const res = await axios.post('/api/invoices/analyze', { 
        fileUrl: fileUrl, 
        vehicleId: vehicleId,
        fileName: fileName 
      });

      toast.success("Analysis Complete!", { id: toastId });
      router.push(`/dashboard/invoices/${res.data.invoiceId}`);
      
    } catch (error: any) {
      console.error(error);
      
      // 1. Capture the specific error message from the backend
      const errorMessage = error.response?.data?.error || "Analysis failed. Please try again.";
      
      // 2. Show it to the user
      toast.error(errorMessage, { 
        id: toastId,
        duration: 5000 // Keep it visible longer so they can read why it failed
      });
      
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
                <UploadDropzone<OurFileRouter, "invoiceUploader">
                    endpoint="invoiceUploader"
                    onClientUploadComplete={(res) => {
                        if (res && res[0]) {
                            const file = res[0];
                            console.log("Upload Completed:", file.ufsUrl);
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
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <div className="text-center">
                    <p className="text-lg font-medium">Analyzing Invoice...</p>
                    <p className="text-sm text-muted-foreground">Checking prices, parts, and labor...</p>
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