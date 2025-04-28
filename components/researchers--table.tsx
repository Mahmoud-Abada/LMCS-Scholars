// src/components/admin/ResearchersTable.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Researcher {
  id: string;
  name: string;
  email: string;
  role: string;
  researcherId: string;
  createdAt: string;
}

export function ResearchersTable({ researchers }: { researchers: Researcher[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Researcher ID</TableHead>
          <TableHead>Created At</TableHead>
          {/* <TableHead>is active</TableHead> */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {researchers.map((researcher) => (
          <TableRow key={researcher.id}>
            <TableCell>{researcher.name}</TableCell>
            <TableCell>{researcher.email}</TableCell>
            <TableCell>{researcher.role}</TableCell>
            <TableCell>{researcher.researcherId}</TableCell>
            <TableCell>
              {new Date(researcher.createdAt).toLocaleDateString()}
            </TableCell>
           
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
