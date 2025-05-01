// app/test/analytics/citations/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { getCitationAnalytics } from './data';

export default function CitationAnalyticsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    citationTrends: Array<{ year: number; totalCitations: number; publicationCount: number }>;
    metrics: {
      totalPublications: number;
      totalCitations: number;
      avgCitationsPerPaper: number;
      maxCitations: number;
      hIndex: number;
      i10Index: number;
    };
  } | null>(null);

  const [filters, setFilters] = useState({
    yearFrom: '',
    yearTo: '',
    teamId: '',
    researcherId: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getCitationAnalytics({
        yearFrom: filters.yearFrom ? parseInt(filters.yearFrom) : undefined,
        yearTo: filters.yearTo ? parseInt(filters.yearTo) : undefined,
        teamId: filters.teamId || undefined,
        researcherId: filters.researcherId || undefined
      });
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error fetching data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Citation Analytics Dashboard</h1>
      
       {/* Filters */}
       <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">From Year</label>
            <Input
              type="number"
              value={filters.yearFrom}
              onChange={(e) => setFilters({...filters, yearFrom: e.target.value})}
              placeholder="2000"
              min="2000"
              max={new Date().getFullYear()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To Year</label>
            <Input
              type="number"
              value={filters.yearTo}
              onChange={(e) => setFilters({...filters, yearTo: e.target.value})}
              placeholder={new Date().getFullYear().toString()}
              min="2000"
              max={new Date().getFullYear()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Team ID</label>
            <Input
              value={filters.teamId}
              onChange={(e) => setFilters({...filters, teamId: e.target.value})}
              placeholder="Team UUID (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Researcher ID</label>
            <Input
              value={filters.researcherId}
              onChange={(e) => setFilters({...filters, researcherId: e.target.value})}
              placeholder="Researcher UUID (optional)"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Apply Filters'}
      </Button>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      ) : data ? (
        <>
          {/* Citation Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Citation Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.citationTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="totalCitations" 
                      stroke="#8884d8" 
                      name="Total Citations"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="publicationCount" 
                      stroke="#82ca9d" 
                      name="Publications"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard 
              title="Total Publications" 
              value={data.metrics.totalPublications} 
            />
            <MetricCard 
              title="Total Citations" 
              value={data.metrics.totalCitations} 
            />
            <MetricCard 
              title="Avg Citations/Paper" 
              value={data.metrics.avgCitationsPerPaper} 
            />
            <MetricCard 
              title="Max Citations" 
              value={data.metrics.maxCitations} 
            />
            <MetricCard 
              title="H-Index" 
              value={data.metrics.hIndex} 
            />
            <MetricCard 
              title="i10-Index" 
              value={data.metrics.i10Index} 
            />
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Apply filters to view citation analytics</p>
        </div>
      )
    }
  </div>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}