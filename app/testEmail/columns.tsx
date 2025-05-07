// app/analytics/researchers/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";

export type ResearcherMetric = {
  id: string;
  firstName: string;
  lastName: string;
  teamName: string;
  status: string;
  qualification: string;
  position: string;
  hIndex: number;
  i10Index: number;
  citations: number;
  publicationCount: number;
  citationPerYear: number;
  lastPublication: string;
};

export const columns: ColumnDef<ResearcherMetric>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link href={`/researchers/${row.original.id}`} className="text-blue-600 hover:underline">
        {row.original.firstName} {row.original.lastName}
      </Link>
    ),
  },
  {
    accessorKey: "teamName",
    header: "Team",
  },
  {
    accessorKey: "qualification",
    header: "Qualification",
  },
  {
    accessorKey: "citations",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Citations
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "hIndex",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          h-index
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "publicationCount",
    header: "Publications",
  },
  {
    accessorKey: "citationPerYear",
    header: "Citations/Year",
    cell: ({ row }) => row.original.citationPerYear.toFixed(1),
  },
  {
    accessorKey: "lastPublication",
    header: "Last Publication",
    cell: ({ row }) => row.original.lastPublication ? new Date(row.original.lastPublication).getFullYear() : 'N/A',
  },
];