// app/analytics/dashboard/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";

export type Researcher = {
  researcher_id: string;
  name: string;
  status: string;
  team_name: string;
  publication_count: number;
  first_publication_year: number;
  last_publication_year: number;
  career_length: number;
  pubs_per_year: number;
  citationImpact?: {
    h_index: number;
    i10_index: number;
    total_citations: number;
  };
};

export const columns: ColumnDef<Researcher>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link href={`/researchers/${row.original.researcher_id}`} className="text-blue-600 hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "team_name",
    header: "Team",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "publication_count",
    header: "Publications",
  },
  {
    accessorKey: "h_index",
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
    cell: ({ row }) => row.original.citationImpact?.h_index || 'N/A',
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
    cell: ({ row }) => row.original.citationImpact?.total_citations || 'N/A',
  },
  {
    accessorKey: "career_length",
    header: "Career (years)",
  },
  {
    accessorKey: "pubs_per_year",
    header: "Pubs/Year",
    cell: ({ row }) => row.original.pubs_per_year.toFixed(2),
  },
];