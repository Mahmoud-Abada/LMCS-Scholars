// app/test/analytics/statistics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getProjectStatistics } from './data';

export default function StatisticsDashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getProjectStatistics>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getProjectStatistics();
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  if (!data) return <div className="container mx-auto p-4">No data available</div>;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Research Project Statistics</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Researchers" value={data.totalResearchers} />
        <MetricCard title="Publications" value={data.totalPublications} />
        <MetricCard title="Projects" value={data.totalProjects} />
        <MetricCard title="Teams" value={data.totalTeams} />
      </div>

      {/* Publications Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Publications by Type</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.publicationsByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publications Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.publicationsByYear}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="count" stroke="#8884d8" name="Publications" />
                <Line yAxisId="right" type="monotone" dataKey="citations" stroke="#82ca9d" name="Citations" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Publications */}
      <Card>
        <CardHeader>
          <CardTitle>Top Cited Publications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.topCitedPublications.map((pub) => (
              <div key={pub.id} className="flex justify-between items-center border-b pb-2">
                <div className="truncate flex-1 pr-4">{pub.title}</div>
                <div className="font-medium">{pub.citationCount} citations</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Researchers Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Researchers by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.researchersByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ffc658" name="Researchers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Researchers (by H-Index)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topResearchers.map((researcher) => (
                <div key={researcher.id} className="border-b pb-2">
                  <h3 className="font-medium">{researcher.name}</h3>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>H-Index: {researcher.hIndex}</span>
                    <span>Citations: {researcher.citations}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Projects by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.projectsByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ff8042" name="Projects" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects Started by Year</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.projectsByYear}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0088FE" name="Projects" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Venues & Collaborations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Publication Venues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topVenues.map((venue) => (
                <div key={venue.id} className="flex justify-between border-b pb-2">
                  <div className="truncate flex-1 pr-4">{venue.name}</div>
                  <div className="font-medium">{venue.publicationCount} pubs</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collaborations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Internal Collaborations:</span>
                <span className="font-medium">{data.internalCollaborations}</span>
              </div>
              <div className="flex justify-between">
                <span>External Collaborations:</span>
                <span className="font-medium">{data.externalCollaborations}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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

function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <Skeleton className="h-8 w-64" />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-80" />
        ))}
      </div>

      <Skeleton className="h-64" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}