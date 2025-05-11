// app/analytics/researchers/page.tsx
'use client'

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

type ResearcherMetric = {
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

type YearlyTrend = {
  year: number;
  publicationCount: number;
  researcherCount: number;
  avgCitations: number;
  avgHIndex: number;
};

type TeamDistribution = {
  teamId: string;
  teamName: string;
  researcherCount: number;
  avgCitations: number;
  avgHIndex: number;
  totalPublications: number;
};

type QualificationStat = {
  qualification: string;
  researcherCount: number;
  avgCitations: number;
  avgHIndex: number;
  totalPublications: number;
};

export default function ResearcherAnalyticsPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<{
    researcherMetrics: ResearcherMetric[];
    yearlyTrends: YearlyTrend[];
    teamDistribution: TeamDistribution[];
    qualificationStats: QualificationStat[];
  } | null>(null);
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
    yearTo: searchParams.get('yearTo') || '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.set(key, value.toString());
        });

        const response = await fetch(`/api/analytics/researchers?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      teamId: '',
      status: '',
      qualification: '',
      position: '',
      hIndexMin: '',
      hIndexMax: '',
      citationMin: '',
      citationMax: '',
      yearFrom: '',
      yearTo: '',
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid gap-6">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Researcher Analytics Dashboard</h1>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="teamId">Team</Label>
              <Input
                id="teamId"
                value={filters.teamId}
                onChange={(e) => handleFilterChange('teamId', e.target.value)}
                placeholder="Team ID"
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="qualification">Qualification</Label>
              <Select
                value={filters.qualification}
                onValueChange={(value) => handleFilterChange('qualification', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select qualification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="associate_professor">Associate Professor</SelectItem>
                  <SelectItem value="assistant_professor">Assistant Professor</SelectItem>
                  <SelectItem value="postdoc">Postdoc</SelectItem>
                  <SelectItem value="phd_candidate">PhD Candidate</SelectItem>
                  <SelectItem value="research_scientist">Research Scientist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button onClick={resetFilters} variant="outline">
                Reset Filters
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div>
              <Label htmlFor="hIndexMin">h-index Min</Label>
              <Input
                id="hIndexMin"
                type="number"
                value={filters.hIndexMin}
                onChange={(e) => handleFilterChange('hIndexMin', e.target.value)}
                placeholder="Minimum h-index"
                min="0"
              />
            </div>
            
            <div>
              <Label htmlFor="hIndexMax">h-index Max</Label>
              <Input
                id="hIndexMax"
                type="number"
                value={filters.hIndexMax}
                onChange={(e) => handleFilterChange('hIndexMax', e.target.value)}
                placeholder="Maximum h-index"
                min="0"
              />
            </div>
            
            <div>
              <Label htmlFor="yearFrom">Year From</Label>
              <Input
                id="yearFrom"
                type="number"
                value={filters.yearFrom}
                onChange={(e) => handleFilterChange('yearFrom', e.target.value)}
                placeholder="From year"
                min="1990"
                max={new Date().getFullYear()}
              />
            </div>
            
            <div>
              <Label htmlFor="yearTo">Year To</Label>
              <Input
                id="yearTo"
                type="number"
                value={filters.yearTo}
                onChange={(e) => handleFilterChange('yearTo', e.target.value)}
                placeholder="To year"
                min="1990"
                max={new Date().getFullYear()}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Top Researchers */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Top Researchers</CardTitle>
          <CardDescription>Based on citation count and other metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <DataTable
              columns={columns}
              data={data.researcherMetrics}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Yearly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Yearly Trends</CardTitle>
            <CardDescription>Publication and citation trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.yearlyTrends}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="publicationCount"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    name="Publications"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgCitations"
                    stroke="#82ca9d"
                    name="Avg Citations"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Team Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Team Distribution</CardTitle>
            <CardDescription>Research output by team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.teamDistribution}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="teamName" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="researcherCount" fill="#8884d8" name="Researchers" />
                  <Bar dataKey="totalPublications" fill="#82ca9d" name="Publications" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Second Row of Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Qualification Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Qualification Statistics</CardTitle>
            <CardDescription>Performance by academic qualification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.qualificationStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="researcherCount"
                    nameKey="qualification"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.qualificationStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Citation vs h-index */}
        <Card>
          <CardHeader>
            <CardTitle>Citation vs h-index</CardTitle>
            <CardDescription>Relationship between citations and h-index</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid />
                  <XAxis type="number" dataKey="citations" name="Citations" />
                  <YAxis type="number" dataKey="hIndex" name="h-index" />
                  <ZAxis type="number" dataKey="publicationCount" range={[60, 400]} name="Publications" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend />
                  <Scatter
                    name="Researchers"
                    data={data.researcherMetrics}
                    fill="#8884d8"
                    shape="circle"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}