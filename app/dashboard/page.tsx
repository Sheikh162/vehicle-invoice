'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { DataTable } from '@/components/ui/data-display/DataTable';
import { columns, Vehicle } from './columns'; 
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { useReactTable, getCoreRowModel, getPaginationRowModel } from "@tanstack/react-table";

export default function Dashboard() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await axios.get(`/api/vehicles`); 
        setVehicles(res.data);
      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const table = useReactTable({
    data: vehicles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="container mx-auto py-8">
      <PageHeader 
        title="My Vehicles"
        actionText="Add Vehicle"
        onActionClick={() => router.push('/dashboard/vehicles/new')}
      />
      
      {loading ? (
        <div className="text-center py-10">Loading your fleet...</div>
      ) : (
        <DataTable table={table} columns={columns} />
      )}
    </div>
  );
}