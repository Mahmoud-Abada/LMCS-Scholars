// app/analytics/researchers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { 
  researcherStatusEnum,
  researcherQualificationEnum,
  researcherPositionEnum
} from '@/db/schema';
import Link from 'next/link';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ResearchersAnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    teamId: searchParams.get('teamId') || '',
    status: searchParams.get('status') || '',
    qualification: searchParams.get('qualification') || '',
    position: searchParams.get('position') || '',
    hIndexMin: searchParams.get('hIndexMin') || '',
    hIndexMax: searchParams.get('hIndexMax') || '',
    citationMin: searchParams.get('citationMin') || '',
    citationMax: searchParams.get('citationMax') || '',
    yearFrom: searchParams.get('yearFrom') || '',
    yearTo: searchParams.get('yearTo') || new Date().getFullYear().toString(),
    limit: searchParams.get('limit') || '20',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const response = await fetch(`/api/analytics/researchers?${params.toString()}`);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching researcher analytics:', err);
      setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const applyFilters = () => {
    router.push(`/analytics/researchers?${new URLSearchParams(filters).toString()}`);
    fetchData();
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  if (!data) return <div className="container mx-auto p-4">No data available</div>;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Analyse des Chercheurs</h1>
      
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Affiner les métriques des chercheurs</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({...filters, status: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {researcherStatusEnum.enumValues.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === 'active' ? 'Actif' : 
                   status === 'on_leave' ? 'En congé' : 
                   status === 'inactive' ? 'Inactif' : 
                   status === 'retired' ? 'Retraité' : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.qualification}
            onValueChange={(value) => setFilters({...filters, qualification: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Qualification" />
            </SelectTrigger>
            <SelectContent>
              {researcherQualificationEnum.enumValues.map((qualification) => (
                <SelectItem key={qualification} value={qualification}>
                  {qualification === 'professor' ? 'Professeur' :
                   qualification === 'associate_professor' ? 'Professeur associé' :
                   qualification === 'assistant_professor' ? 'Professeur assistant' :
                   qualification === 'postdoc' ? 'Post-doctorant' :
                   qualification === 'phd_candidate' ? 'Doctorant' :
                   qualification === 'research_scientist' ? 'Chercheur scientifique' : qualification}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.position}
            onValueChange={(value) => setFilters({...filters, position: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Poste" />
            </SelectTrigger>
            <SelectContent>
              {researcherPositionEnum.enumValues.map((position) => (
                <SelectItem key={position} value={position}>
                  {position === 'director' ? 'Directeur' :
                   position === 'department_head' ? 'Chef de département' :
                   position === 'principal_investigator' ? 'Chercheur principal' :
                   position === 'senior_researcher' ? 'Chercheur senior' :
                   position === 'researcher' ? 'Chercheur' :
                   position === 'assistant' ? 'Assistant' : position}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="H-Index min"
              value={filters.hIndexMin}
              onChange={(e) => setFilters({...filters, hIndexMin: e.target.value})}
              min="0"
              max="100"
            />
            <Input
              type="number"
              placeholder="H-Index max"
              value={filters.hIndexMax}
              onChange={(e) => setFilters({...filters, hIndexMax: e.target.value})}
              min="0"
              max="100"
            />
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Citations min"
              value={filters.citationMin}
              onChange={(e) => setFilters({...filters, citationMin: e.target.value})}
              min="0"
            />
            <Input
              type="number"
              placeholder="Citations max"
              value={filters.citationMax}
              onChange={(e) => setFilters({...filters, citationMax: e.target.value})}
              min="0"
            />
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Année début"
              value={filters.yearFrom}
              onChange={(e) => setFilters({...filters, yearFrom: e.target.value})}
              min="1990"
              max={new Date().getFullYear()}
            />
            <Input
              type="number"
              placeholder="Année fin"
              value={filters.yearTo}
              onChange={(e) => setFilters({...filters, yearTo: e.target.value})}
              min="1990"
              max={new Date().getFullYear()}
            />
          </div>

          <Input
            type="number"
            placeholder="Limite de résultats"
            value={filters.limit}
            onChange={(e) => setFilters({...filters, limit: e.target.value})}
            min="1"
            max="100"
          />
        </CardContent>
      </Card>

      <Button onClick={applyFilters} disabled={loading}>
        {loading ? 'Chargement...' : 'Appliquer les filtres'}
      </Button>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Total des chercheurs" 
          value={data.researcher_metrics.length} 
        />
        <MetricCard 
          title="H-Index moyen" 
          value={data.researcher_metrics.reduce((acc: number, r: any) => acc + r.hIndex, 0) / data.researcher_metrics.length || 0} 
          precision={2}
        />
        <MetricCard 
          title="Citations moyennes" 
          value={data.researcher_metrics.reduce((acc: number, r: any) => acc + r.citations, 0) / data.researcher_metrics.length || 0} 
          precision={0}
        />
        <MetricCard 
          title="Total des publications" 
          value={data.researcher_metrics.reduce((acc: number, r: any) => acc + r.publicationCount, 0)} 
        />
      </div>

      {/* Researcher Performance Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle>Impact des chercheurs</CardTitle>
          <CardDescription>H-Index vs Citations</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid />
              <XAxis type="number" dataKey="hIndex" name="H-Index" />
              <YAxis type="number" dataKey="citations" name="Citations" />
              <ZAxis type="number" dataKey="publicationCount" name="Publications" range={[50, 500]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background p-4 border rounded-lg shadow-lg">
                        <p className="font-bold">{data.name}</p>
                        <p>Team: {data.team || 'N/A'}</p>
                        <p>H-Index: {data.hIndex}</p>
                        <p>Citations: {data.citations.toLocaleString()}</p>
                        <p>Publications: {data.publicationCount}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Scatter 
                name="Researchers" 
                data={data.researcher_metrics} 
                fill="#8884d8"
                onClick={(data) => router.push(`/researchers/${data.id}`)}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Yearly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Tendances annuelles</CardTitle>
          <CardDescription>Métriques des chercheurs au fil du temps</CardDescription>
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
              <Line yAxisId="left" type="monotone" dataKey="researcherCount" stroke="#8884d8" name="Researchers" />
              <Line yAxisId="right" type="monotone" dataKey="avgHIndex" stroke="#82ca9d" name="Avg H-Index" />
              <Line yAxisId="right" type="monotone" dataKey="avgCitations" stroke="#ff7300" name="Avg Citations" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Team Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Performance des équipes</CardTitle>
          <CardDescription>Métriques par équipe de recherche</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.team_distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="teamName" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="researcherCount" fill="#8884d8" name="Researchers" />
              <Bar yAxisId="right" dataKey="avgHIndex" fill="#82ca9d" name="Avg H-Index" />
              <Bar yAxisId="right" dataKey="avgCitations" fill="#ff7300" name="Avg Citations" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Qualification Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Métriques par qualification</CardTitle>
          <CardDescription>Performance par qualification académique</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.qualification_stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="qualification" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="researcherCount" fill="#8884d8" name="Researchers" />
              <Bar yAxisId="right" dataKey="avgHIndex" fill="#82ca9d" name="Avg H-Index" />
              <Bar yAxisId="right" dataKey="avgCitations" fill="#ff7300" name="Avg Citations" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Researchers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Meilleurs chercheurs</CardTitle>
          <CardDescription>Classés par nombre de citations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chercheur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Équipe</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Citations</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">H-Index</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publications</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.researcher_metrics.map((researcher: any) => (
                  <tr 
                    key={researcher.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/researchers/${researcher.id}`)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{researcher.name}</div>
                          <div className="text-sm text-gray-500">{researcher.qualification?.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {researcher.team || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {researcher.citations.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {researcher.hIndex}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {researcher.publicationCount}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        researcher.status === 'active' ? 'bg-green-100 text-green-800' :
                        researcher.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {researcher.status?.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, precision = 0 }: { title: string; value: number; precision?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toFixed(precision) : value}
        </div>
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

      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-96" />
      ))}

      <Skeleton className="h-64" />
    </div>
  );
}