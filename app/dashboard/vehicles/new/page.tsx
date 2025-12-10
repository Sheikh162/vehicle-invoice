'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form/FormField';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 1. Define the Validation Schema
const vehicleFormSchema = z.object({
  make: z.string().min(1, "Make is required (e.g. Toyota)"),
  model: z.string().min(1, "Model is required (e.g. Fortuner)"),
  regNumber: z.string().min(5, "Registration Number is required"),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export default function AddVehiclePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // 2. Setup Form
  const methods = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      make: '',
      model: '',
      regNumber: '',
    },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  // 3. Handle Submission
  const onSubmit = async (data: VehicleFormValues) => {
    setIsLoading(true);
    const toastId = toast.loading("Adding vehicle...");

    try {
      await axios.post('/api/vehicles', data);
      
      toast.success("Vehicle added successfully!", { id: toastId });
      router.push('/dashboard');
      router.refresh(); // Ensure dashboard updates with new data
    } catch (error: any) {
      console.error("Failed to add vehicle:", error);
      toast.error(error.response?.data?.error || "Failed to add vehicle", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <PageHeader title="Add New Vehicle" />
      
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField 
                label="Vehicle Make" 
                name="make" 
                //placeholder="e.g. Toyota, Honda"
                register={register('make')} 
                error={errors.make} 
                required 
              />
              
              <FormField 
                label="Vehicle Model" 
                name="model" 
                //placeholder="e.g. Fortuner, City"
                register={register('model')} 
                error={errors.model} 
                required 
              />
              
              <FormField 
                label="Registration Number" 
                name="regNumber" 
                //placeholder="e.g. MH-02-AZ-1234"
                register={register('regNumber')} 
                error={errors.regNumber} 
                required 
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Add Vehicle'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}