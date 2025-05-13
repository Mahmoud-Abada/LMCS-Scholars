"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

interface Researcher {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
}

export default function ClientPage({ researchers }: { researchers: Researcher[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleCheckboxChange = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one researcher");
      return;
    }

    try {
      const response = await fetch("/api/publications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update publications");
      }

      toast.success("Updating the database was successful");
      router.push("/dashboard");
    } catch (error) {
      console.error("Update error:", error);
      toast.error(
        `Failed to update publications: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Update the database</h1>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Select Researchers to Update
          </h2>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Researcher personal page</TableHead>
                <TableHead className="text-center w-[80px]">Select</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {researchers.map((researcher) => (
                <TableRow key={researcher.id}>
                  <TableCell>
                    {researcher.firstName} {researcher.lastName}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        researcher.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {researcher.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/researcher/${researcher.id}`}>
                      View Profile
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      name="researcherIds"
                      value={researcher.id}
                      id={`researcher-${researcher.id}`}
                      checked={selectedIds.includes(researcher.id)}
                      onCheckedChange={() => handleCheckboxChange(researcher.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Update Publications
          </Button>
        </div>
      </div>
    </div>
  );
}
