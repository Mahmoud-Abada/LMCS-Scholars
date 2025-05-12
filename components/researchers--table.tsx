"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { researcherStatusEnum, researcherQualificationEnum, researcherPositionEnum } from "@/db/schema";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  SlidersHorizontal,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Link as LinkIcon,
} from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { toggleResearcherStatus } from "@/actions/researchers";
import Link from "next/link"

interface Researcher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: keyof typeof researcherStatusEnum;
  qualification?: keyof typeof researcherQualificationEnum;
  position?: keyof typeof researcherPositionEnum;
  hIndex?: number;
  i10Index?: number;
  citations?: number;
  joinDate?: string;
  leaveDate?: string;
  orcidId?: string;
  createdAt: string;
}

export function ResearchersTable({ researchers, isAdmin }: { researchers: Researcher[], isAdmin: boolean }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [pendingAction, setPendingAction] = useState(false);

  const handleStatusToggle = async (researcherId: string) => {
    setPendingAction(true);
    try {
      const result = await toggleResearcherStatus(researcherId);
      if (result?.success) {
        toast.success(`Researcher ${result.newStatus === "active" ? "activated" : "deactivated"} successfully`);
        router.refresh();
      }
    } catch (error) {
      toast.error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPendingAction(false);
    }
  };

  const columns: ColumnDef<Researcher>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const firstName = row.original.firstName;
        const lastName = row.original.lastName;
        return (
          <Link 
            href={`/researcher/${row.original.id}`}
            className="font-medium capitalize hover:text-blue-600 hover:underline"
          >
            {firstName} {lastName}
          </Link>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-500" />
          <a
            href={`mailto:${row.getValue("email")}`}
            className="text-blue-600 hover:underline"
          >
            {row.getValue("email")}
          </a>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-500" />
          <span>{row.getValue("phone") || 'N/A'}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof researcherStatusEnum;
        return (
          <Badge variant={status === "active" ? "default" : "destructive"}>
            {researcherStatusEnum[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "qualification",
      header: "Qualification",
      cell: ({ row }) => {
        const qualification = row.getValue("qualification") as keyof typeof researcherQualificationEnum;
        return (
          <Badge variant="outline" className="capitalize">
            {qualification ? researcherQualificationEnum[qualification] : 'N/A'}
          </Badge>
        );
      },
    },
    {
      accessorKey: "position",
      header: "Position",
      cell: ({ row }) => {
        const position = row.getValue("position") as keyof typeof researcherPositionEnum;
        return (
          <Badge variant="outline" className="capitalize">
            {position ? researcherPositionEnum[position] : 'N/A'}
          </Badge>
        );
      },
    },
    {
      accessorKey: "hIndex",
      header: "H-Index",
      cell: ({ row }) => <span>{row.getValue("hIndex") || 0}</span>,
    },
    {
      accessorKey: "citations",
      header: "Citations",
      cell: ({ row }) => <span>{row.getValue("citations") || 0}</span>,
    },
    {
      accessorKey: "joinDate",
      header: "Join Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>
            {row.getValue("joinDate") 
              ? new Date(row.getValue("joinDate")).toLocaleDateString() 
              : 'N/A'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "orcidId",
      header: "ORCID",
      cell: ({ row }) => (
        row.getValue("orcidId") ? (
          <Link 
            href={`https://orcid.org/${row.getValue("orcidId")}`} 
            target="_blank"
            className="text-blue-600 hover:underline flex items-center gap-2"
          >
            <LinkIcon className="h-4 w-4" />
            {row.getValue("orcidId")}
          </Link>
        ) : 'N/A'
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </div>
      ),
    },
    ...(isAdmin ? [{
      id: "actions",
      cell: ({ row }) => {
        const researcher = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleStatusToggle(researcher.id)}
                disabled={pendingAction}
              >
                {researcher.status === "active" ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }] : []),
  ];

  const table = useReactTable({
    data: researchers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
      columnVisibility: {
        phone: false,
        hIndex: false,
        citations: false,
        orcidId: false,
        createdAt: false,
      },
    },
  });

  return (
    <div className="w-full space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search researchers..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Select
                value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
                onValueChange={(value) =>
                  table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} researcher(s)
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}