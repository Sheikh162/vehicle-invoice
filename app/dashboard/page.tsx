'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link
import axios from 'axios';
import { DataTable } from '@/components/ui/data-display/DataTable';
import { columns as vehicleColumns, Vehicle } from './columns'; 
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { useReactTable, getCoreRowModel, getPaginationRowModel } from "@tanstack/react-table";
import { MessageSquare, FileText, ArrowRight, Trash2, Loader2, Plus, Car } from 'lucide-react'; // Add Plus, Car
import { Button } from '@/components/ui/button'; // Import Button
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { toast } from 'sonner';

interface Invoice {
  id: string;
  serviceCenter: string;
  serviceDate: string;
  vehicle: {
    make: string;
    model: string;
    regNumber: string;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehRes, invRes] = await Promise.all([
           axios.get('/api/vehicles'),
           axios.get('/api/invoices')
        ]);
        setVehicles(vehRes.data);
        setInvoices(invRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteInvoice = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this invoice and its chat history?")) return;

    setDeletingId(id);
    try {
      await axios.delete(`/api/invoices/${id}`);
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      toast.success("Invoice deleted");
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("Failed to delete invoice");
    } finally {
      setDeletingId(null);
    }
  };

  const vehicleTable = useReactTable({
    data: vehicles,
    columns: vehicleColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="container mx-auto py-8 space-y-12 px-4 md:px-6">
      
      {/* SECTION 1: VEHICLES */}
      <section>
        <PageHeader 
          title="My Fleet"
          actionText="Add Vehicle"
          onActionClick={() => router.push('/dashboard/vehicles/new')}
        />
        {loading ? (
          <div className="border rounded-xl p-6 space-y-4 bg-card/50">
             <div className="flex gap-4 mb-4">
               <Skeleton className="h-8 w-[150px]" />
               <Skeleton className="h-8 w-[150px]" />
             </div>
             <Skeleton className="h-12 w-full" />
             <Skeleton className="h-12 w-full" />
          </div>
        ) : vehicles.length === 0 ? (
           <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/20 hover:bg-muted/30 transition-colors">
             <Car className="w-12 h-12 mb-4 opacity-20" />
             <h3 className="text-lg font-semibold text-foreground mb-1">No vehicles yet</h3>
             <p className="mb-6 text-sm text-muted-foreground">Add a vehicle to start tracking expenses.</p>
             <Button onClick={() => router.push('/dashboard/vehicles/new')}>
                <Plus className="w-4 h-4 mr-2" /> Add Vehicle
             </Button>
           </div>
        ) : (
          <DataTable table={vehicleTable} columns={vehicleColumns} />
        )}
      </section>

      {/* SECTION 2: RECENT INVOICES */}
      <section>
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Recent Invoices</h2>
        </div>

        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-[180px] w-full rounded-xl" />
              <Skeleton className="h-[180px] w-full rounded-xl" />
              <Skeleton className="h-[180px] w-full rounded-xl" />
           </div>
        ) : invoices.length === 0 ? (
           <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/20">
             <FileText className="w-12 h-12 mb-4 opacity-20" />
             <h3 className="text-lg font-semibold text-foreground mb-1">No invoices uploaded</h3>
             <p className="mb-6 text-sm text-muted-foreground">Upload an invoice to analyze costs and chat with AI.</p>
             
             {/* Smart Action Button */}
             {vehicles.length > 0 ? (
                <Link href={`/dashboard/upload?vehicleId=${vehicles[0].id}`}>
                  <Button variant="default">
                    <Plus className="w-4 h-4 mr-2" /> Upload for {vehicles[0].make}
                  </Button>
                </Link>
             ) : (
                <Button variant="secondary" disabled>
                   Add a vehicle first to upload
                </Button>
             )}
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invoices.map((inv) => (
              <div 
                key={inv.id} 
                onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                className="group relative flex flex-col justify-between bg-card border text-card-foreground p-5 rounded-xl cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4 pr-6">
                   <div>
                      <h3 className="font-semibold text-lg leading-tight truncate pr-2">
                        {inv.serviceCenter}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {inv.vehicle?.make} {inv.vehicle?.model}
                      </p>
                      <span className="text-xs text-muted-foreground/80 font-mono bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                        {inv.vehicle?.regNumber}
                      </span>
                   </div>
                   
                   {/* Delete Button */}
                   <button 
                     onClick={(e) => handleDeleteInvoice(e, inv.id)}
                     disabled={deletingId === inv.id}
                     className="absolute top-4 right-4 text-muted-foreground hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors z-10"
                     title="Delete Invoice"
                   >
                     {deletingId === inv.id ? (
                       <Loader2 size={18} className="animate-spin" />
                     ) : (
                       <Trash2 size={18} />
                     )}
                   </button>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                   <span className="text-xs text-muted-foreground font-medium">
                     {new Date(inv.serviceDate).toLocaleDateString(undefined, { 
                       year: 'numeric', month: 'short', day: 'numeric' 
                     })}
                   </span>
                   
                   <div className="flex items-center gap-1.5 text-sm font-medium text-primary group-hover:underline decoration-2 underline-offset-4">
                      <MessageSquare size={16} />
                      <span>Chat</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}