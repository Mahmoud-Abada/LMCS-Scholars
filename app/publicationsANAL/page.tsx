// app/analytics/publications/page.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { toast } from "sonner";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82ca9d",
];

type PublicationData = {
  high_level_metrics: {
    total_publications: number;
    total_citations: number;
    avg_citations: number;
    max_citations: number;
    h_index: number;
    i10_index: number;
  };
  yearly_trends: Array<{
    year: string;
    publication_count: number;
    citation_count: number;
    avg_citations: number;
    citation_velocity: number;
  }>;
  publication_types: Array<{
    publication_type: string;
    count: number;
    percentage: number;
    avg_citations: number;
  }>;
  researcher_contributions: Array<{
    researcher_id: string;
    name: string;
    team_name: string;
    publication_count: number;
    first_author_count: number;
    citation_count: number;
    avg_citations: number;
  }>;
  team_contributions: Array<{
    team_id: string;
    team_name: string;
    publication_count: number;
    citation_count: number;
    avg_citations: number;
    researcher_count: number;
    publications_per_researcher: number;
  }>;
  venue_analysis: Array<{
    venue_id: string;
    venue_name: string;
    venue_type: string;
    publication_count: number;
    citation_count: number;
    avg_citations: number;
    first_publication_year: number;
    last_publication_year: number;
  }>;
  classification_analysis: Array<{
    system_id: string;
    system_name: string;
    category: string;
    publication_count: number;
    citation_count: number;
    avg_citations: number;
  }>;
  top_cited_publications: Array<{
    id: string;
    title: string;
    publication_type: string;
    publication_date: string;
    citation_count: number;
    authors: string[];
    venues: string[];
  }>;
  citation_impact: Array<{
    bucket: string;
    count: number;
    total_citations: number;
    percentage: number;
    citation_percentage: number;
  }>;
  collaboration_patterns: Array<{
    author_count: string;
    publication_count: number;
    citation_count: number;
    avg_citations: number;
  }>;
  publication_velocity: Array<{
    year: string;
    publication_count: string;
    growth: string;
    growth_rate: number;
    moving_avg_3yr: number;
  }>;
  author_network: Array<{
    researcher1_id: string;
    researcher1_name: string;
    researcher2_id: string;
    researcher2_name: string;
    collaboration_count: number;
    researcher1_team: string;
    researcher2_team: string;
    collaboration_type: string;
  }>;
};

 function PublicationAnalyticsDashboardContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<PublicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    yearFrom: "",
    yearTo: "",
    teamId: "",
    researcherId: "",
    venueId: "",
    classificationId: "",
    publicationType: "",
    minCitations: "",
    limit: "10",
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query params from URL and local state
        const params = new URLSearchParams();
        if (filters.yearFrom) params.set("yearFrom", filters.yearFrom);
        if (filters.yearTo) params.set("yearTo", filters.yearTo);
        if (filters.teamId) params.set("teamId", filters.teamId);
        if (filters.researcherId)
          params.set("researcherId", filters.researcherId);
        if (filters.venueId) params.set("venueId", filters.venueId);
        if (filters.classificationId)
          params.set("classificationId", filters.classificationId);
        if (filters.publicationType)
          params.set("publicationType", filters.publicationType);
        if (filters.minCitations)
          params.set("minCitations", filters.minCitations);
        if (filters.limit) params.set("limit", filters.limit);

        const response = await fetch(
          `/api/analytics/publications?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch publication analytics data");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching publication analytics data:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        toast.error("Failed to load publication analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64 mb-6" />

          {/* Loading skeleton for metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading skeleton for tabs */}
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-gray-500">No publication data available</div>
        </div>
      </div>
    );
  }

  // Format data for charts
  const citationImpactData = data.citation_impact.map((item) => ({
    ...item,
    count: Number(item.count),
    total_citations: Number(item.total_citations),
  }));

  const publicationVelocityData = data.publication_velocity.map((item) => ({
    ...item,
    publication_count: Number(item.publication_count),
    growth: Number(item.growth),
  }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Publication Analytics Dashboard
        </h1>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  From Year
                </label>
                <Input
                  type="number"
                  placeholder="1990"
                  value={filters.yearFrom}
                  onChange={(e) =>
                    handleFilterChange("yearFrom", e.target.value)
                  }
                  min="1990"
                  max={new Date().getFullYear()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  To Year
                </label>
                <Input
                  type="number"
                  placeholder={new Date().getFullYear().toString()}
                  value={filters.yearTo}
                  onChange={(e) => handleFilterChange("yearTo", e.target.value)}
                  min="1990"
                  max={new Date().getFullYear()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Min Citations
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minCitations}
                  onChange={(e) =>
                    handleFilterChange("minCitations", e.target.value)
                  }
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Publication Type
                </label>
                <Select
                  value={filters.publicationType}
                  onValueChange={(value) =>
                    handleFilterChange("publicationType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">All Types</SelectItem>
                    <SelectItem value="journal_article">
                      Journal Article
                    </SelectItem>
                    <SelectItem value="conference_paper">
                      Conference Paper
                    </SelectItem>
                    <SelectItem value="book_chapter">Book Chapter</SelectItem>
                    <SelectItem value="patent">Patent</SelectItem>
                    <SelectItem value="technical_report">
                      Technical Report
                    </SelectItem>
                    <SelectItem value="thesis">Thesis</SelectItem>
                    <SelectItem value="preprint">Preprint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* High Level Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader>
              <CardTitle className="text-lg">Total Publications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.high_level_metrics.total_publications}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {data.high_level_metrics.total_citations.toLocaleString()} total
                citations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader>
              <CardTitle className="text-lg">Citation Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Number(data.high_level_metrics.avg_citations).toFixed(1)}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Avg citations · Max: {data.high_level_metrics.max_citations}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader>
              <CardTitle className="text-lg">h-index</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.high_level_metrics.h_index}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                i10-index: {data.high_level_metrics.i10_index}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardHeader>
              <CardTitle className="text-lg">Current Year</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.yearly_trends.length
                  ? data.yearly_trends[data.yearly_trends.length - 1]
                      .publication_count
                  : 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {data.yearly_trends.length
                  ? data.yearly_trends[data.yearly_trends.length - 1].year
                  : "N/A"}{" "}
                publications
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="impact">Impact</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Yearly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Yearly Publication Trends</CardTitle>
                <CardDescription>
                  Growth and performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={data.yearly_trends}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="publication_count"
                        fill="#8884d8"
                        name="Publications"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="citation_count"
                        stroke="#ff7300"
                        name="Citations"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avg_citations"
                        stroke="#82ca9d"
                        name="Avg Citations"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Publication Types */}
            <Card>
              <CardHeader>
                <CardTitle>Publication Type Distribution</CardTitle>
                <CardDescription>Breakdown by publication type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.publication_types}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="publication_type"
                        type="category"
                        width={120}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Count" />
                      <Bar
                        dataKey="avg_citations"
                        fill="#82ca9d"
                        name="Avg Citations"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Publication Velocity */}
            <Card>
              <CardHeader>
                <CardTitle>Publication Velocity</CardTitle>
                <CardDescription>
                  Growth rate and moving averages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={publicationVelocityData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="growth_rate"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        name="Growth Rate %"
                      />
                      <Area
                        type="monotone"
                        dataKey="moving_avg_3yr"
                        stackId="2"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        name="3-Yr Moving Avg"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "contributions" && (
          <div className="space-y-6">
            {/* Team Contributions */}
            <Card>
              <CardHeader>
                <CardTitle>Team Contributions</CardTitle>
                <CardDescription>
                  Publication output by research team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  {data.team_contributions.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.team_contributions}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="team_name"
                          type="category"
                          width={150}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="publication_count"
                          fill="#8884d8"
                          name="Publications"
                        />
                        <Bar
                          dataKey="citation_count"
                          fill="#82ca9d"
                          name="Citations"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No team contribution data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Researcher Contributions */}
            <Card>
              <CardHeader>
                <CardTitle>Researcher Contributions</CardTitle>
                <CardDescription>
                  Top contributors by publication count
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  {data.researcher_contributions.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          dataKey="publication_count"
                          name="Publications"
                          label={{
                            value: "Publication Count",
                            position: "bottom",
                          }}
                        />
                        <YAxis
                          type="number"
                          dataKey="avg_citations"
                          name="Avg Citations"
                          label={{
                            value: "Avg Citations",
                            angle: -90,
                            position: "left",
                          }}
                        />
                        <ZAxis
                          type="number"
                          dataKey="citation_count"
                          range={[60, 400]}
                          name="Total Citations"
                        />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                        <Legend />
                        <Scatter
                          name="Researchers"
                          data={data.researcher_contributions}
                          fill="#8884d8"
                          shape="circle"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No researcher contribution data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Venue Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Venue Analysis</CardTitle>
                <CardDescription>
                  Where research is being published
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  {data.venue_analysis.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.venue_analysis.slice(0, 10)}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="venue_name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="publication_count"
                          fill="#8884d8"
                          name="Publications"
                        />
                        <Bar
                          dataKey="avg_citations"
                          fill="#82ca9d"
                          name="Avg Citations"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No venue data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "impact" && (
          <div className="space-y-6">
            {/* Citation Impact */}
            <Card>
              <CardHeader>
                <CardTitle>Citation Impact</CardTitle>
                <CardDescription>
                  Distribution of citations across publications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={citationImpactData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bucket" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#8884d8"
                        name="Publication Count"
                      />
                      <Bar
                        dataKey="citation_percentage"
                        fill="#82ca9d"
                        name="Citation %"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Cited Publications */}
            <Card>
              <CardHeader>
                <CardTitle>Top Cited Publications</CardTitle>
                <CardDescription>Most influential works</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  {data.top_cited_publications.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.top_cited_publications}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="title"
                          type="category"
                          width={300}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="citation_count"
                          fill="#8884d8"
                          name="Citations"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No top cited publications data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Collaboration Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>Collaboration Patterns</CardTitle>
                <CardDescription>How researchers work together</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  {data.collaboration_patterns.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        data={data.collaboration_patterns.map((item) => ({
                          ...item,
                          author_count: `${item.author_count} authors`,
                        }))}
                      >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="author_count" />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, "dataMax + 100"]}
                        />
                        <Tooltip />
                        <Legend />
                        <Radar
                          name="Publications"
                          dataKey="publication_count"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                        <Radar
                          name="Avg Citations"
                          dataKey="avg_citations"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No collaboration data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}


export default function PublicationAnalyticsDashboard(){
  return(
    <Suspense>
      <PublicationAnalyticsDashboardContent />
    </Suspense>
  )
}
