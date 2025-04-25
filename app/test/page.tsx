"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TestScrapingApi() {
  const [researcherName, setResearcherName] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!researcherName.trim()) {
      setError("Please enter a researcher name");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setData(null);
      
      const response = await fetch(`/api/analytics/citations?name=${encodeURIComponent(researcherName.trim())}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Test Researcher Publications Scraper</h1>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-4">
          <Input
            type="text"
            value={researcherName}
            onChange={(e) => setResearcherName(e.target.value)}
            placeholder="Enter researcher name"
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Scraping..." : "Fetch Publications"}
          </Button>
        </div>
      </form>

      {error && (
        <Card className="bg-red-50 border-red-200 mb-6">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[125px] w-full" />
          <Skeleton className="h-[125px] w-full" />
        </div>
      ) : data ? (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Scraping Results</CardTitle>
              <CardDescription>
                Publications for: {researcherName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(data) && data.length > 0 ? (
                  data.map((pub: any, index: number) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <h3 className="font-medium">{pub.title || 'Untitled'}</h3>
                      <p className="text-sm text-gray-600">
                        {pub.authors?.join(', ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {pub.year} • {pub.citations} citations
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No publications found</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Raw Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto max-h-[300px]">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Enter a researcher name and click "Fetch Publications"</p>
          </CardContent>
        </Card>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>API Request Details</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto max-h-[200px]">
            {JSON.stringify({
              researcherName,
              loading,
              error,
              data: data ? 'Received' : null
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}