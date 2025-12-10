"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Matches your Prisma Schema
export type Vehicle = {
  id: string
  make: string
  model: string
  regNumber: string
  createdAt: string
}

export const columns: ColumnDef<Vehicle>[] = [
  {
    accessorKey: "make",
    header: "Make",
  },
  {
    accessorKey: "model",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Model
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "regNumber",
    header: "Registration Number",
    cell: ({ row }) => <div className="font-mono">{row.getValue("regNumber")}</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Added On",
    cell: ({ row }) => {
        return new Date(row.getValue("createdAt")).toLocaleDateString()
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const vehicle = row.original
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
                <Link href={`/dashboard/upload?vehicleId=${vehicle.id}`}>Upload Invoice</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]