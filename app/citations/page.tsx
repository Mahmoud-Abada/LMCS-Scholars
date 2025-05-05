// app/test/analytics/citations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { publicationTypeEnum } from '@/db/schema';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function CitationsAnalyticsPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    yearFrom: searchParams.get('yearFrom') || '',
    yearTo: searchParams.get('yearTo') || new Date().getFullYear().toString(),
    teamId: searchParams.get('teamId') || '',
    researcherId: searchParams.get('researcherId') || '',
    venueId: searchParams.get('venueId') || '',
    classificationId: searchParams.get('classificationId') || '',
    publicationType: searchParams.get('publicationType') || '',
    limit: searchParams.get('limit') || '10',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.yearFrom) params.set('yearFrom', filters.yearFrom);
      if (filters.yearTo) params.set('yearTo', filters.yearTo);
      if (filters.teamId) params.set('teamId', filters.teamId);
      if (filters.researcherId) params.set('researcherId', filters.researcherId);
      if (filters.venueId) params.set('venueId', filters.venueId);
      if (filters.classificationId) params.set('classificationId', filters.classificationId);
      if (filters.publicationType) params.set('publicationType', filters.publicationType);
      if (filters.limit) params.set('limit', filters.limit);

      const response = await fetch(`/api/analytics/citations?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching citation analytics:', err);
      setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  if (!data) return <div className="container mx-auto p-4">No data available</div>;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Analyse des citations</h1>
      
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="De l'année"
              value={filters.yearFrom}
              onChange={(e) => setFilters({...filters, yearFrom: e.target.value})}
              min="1990"
              max={new Date().getFullYear()}
            />
            <Input
              type="number"
              placeholder="À l'année"
              value={filters.yearTo}
              onChange={(e) => setFilters({...filters, yearTo: e.target.value})}
              min="1990"
              max={new Date().getFullYear()}
            />
          </div>
          <Input
            placeholder="ID de l'équipe"
            value={filters.teamId}
            onChange={(e) => setFilters({...filters, teamId: e.target.value})}
          />
          <Input
            placeholder="ID du chercheur"
            value={filters.researcherId}
            onChange={(e) => setFilters({...filters, researcherId: e.target.value})}
          />
          <Input
            placeholder="ID du lieu"
            value={filters.venueId}
            onChange={(e) => setFilters({...filters, venueId: e.target.value})}
          />
          <Input
            placeholder="ID de classification"
            value={filters.classificationId}
            onChange={(e) => setFilters({...filters, classificationId: e.target.value})}
          />
          <select
            className="border rounded p-2"
            value={filters.publicationType}
            onChange={(e) => setFilters({...filters, publicationType: e.target.value})}
          >
            <option value="">Tous les types</option>
            {publicationTypeEnum.enumValues.map((type) => (
              <option key={type} value={type}>
                {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>
          <Input
            type="number"
            placeholder="Limite"
            value={filters.limit}
            onChange={(e) => setFilters({...filters, limit: e.target.value})}
            min="1"
            max="100"
          />
        </CardContent>
      </Card>

      <Button onClick={fetchData} disabled={loading}>
        {loading ? 'Chargement...' : 'Appliquer les filtres'}
      </Button>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Citations totales" value={data.high_level_metrics.total_citations} />
        <MetricCard title="Publications totales" value={data.high_level_metrics.total_publications} />
        <MetricCard title="Moyenne des citations" value={data.high_level_metrics.avg_citations} />
        <MetricCard title="Citations maximales" value={data.high_level_metrics.max_citations} />
      </div>

      {/* Yearly Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tendances des citations</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.yearly_trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="total_citations" stroke="#8884d8" />
              <Line yAxisId="right" type="monotone" dataKey="new_citations" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Researchers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Meilleurs chercheurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Chercheur</th>
                  <th className="text-left p-2">Citations</th>
                  <th className="text-left p-2">Articles</th>
                  <th className="text-left p-2">H-Index</th>
                </tr>
              </thead>
              <tbody>
                {data.researcher_metrics.map((researcher: any) => (
                  <tr key={researcher.researcher_id} className="border-t">
                    <td className="p-2">{researcher.name}</td>
                    <td className="p-2">{researcher.total_citations}</td>
                    <td className="p-2">{researcher.publication_count}</td>
                    <td className="p-2">{researcher.h_index}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance des équipes</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.team_metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_citations" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Publications */}
      <Card>
        <CardHeader>
          <CardTitle>Meilleures publications</CardTitle>
        </CardHeader>
        <CardContent>
          {data.top_publications.map((pub: any) => (
            <div key={pub.id} className="border-b py-4">
              <h3 className="font-medium">{pub.title}</h3>
              <div className="text-sm text-gray-600">
                <div>Auteurs : {pub.authors?.join(', ') || 'N/A'}</div>
                <div>Citations : {pub.citation_count}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Collaboration Metrics */}

      <Card>
  <CardHeader>
    <CardTitle>Types de collaboration</CardTitle>
  </CardHeader>
  <CardContent className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={[
          { name: 'Individuel', value: data.collaboration_metrics.find(m => m.collaboration_type === 'single-author')?.total_citations || 0 },
          { name: 'Équipe', value: data.collaboration_metrics.find(m => m.collaboration_type === 'intra-team')?.total_citations || 0 },
          { name: 'Croisée', value: data.collaboration_metrics.find(m => m.collaboration_type === 'inter-team')?.total_citations || 0 },
        ]}
        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Bar dataKey="value">
          <Cell fill="#3b82f6" /> {/* Single - Blue */}
          <Cell fill="#10b981" /> {/* Team - Green */}
          <Cell fill="#f59e0b" /> {/* Cross - Orange */}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>

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

      <Skeleton className="h-96" />
      <Skeleton className="h-64" />
      <Skeleton className="h-96" />
      <Skeleton className="h-64" />
      <Skeleton className="h-96" />
    </div>
  );
}