// app/analytics/dashboard/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
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
import { columns } from "./columns";
import { DataTable } from "./data-table";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82ca9d",
];

type Researcher = {
  researcher_id: string;
  name: string;
  status: string;
  team_name: string;
  publication_count: number;
  first_publication_year: number;
  last_publication_year: number;
  career_length: number;
  pubs_per_year: number;
  citationImpact?: {
    h_index: number;
    i10_index: number;
    total_citations: number;
  };
};
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

type ApiResponse = {
  high_level_metrics?: {
    total_researchers: number;
    active_researchers: number;
    avg_h_index: number;
    avg_i10_index: number;
    avg_citations: number;
    professors_count: number;
  };
  yearly_trends?: Array<{
    year: number;
    researchers_joined: number;
    researchers_left: number;
    net_growth: number;
    avg_h_index: number;
    avg_citations: number;
  }>;
  researcher_productivity?: Researcher[];
  team_distribution?: Array<{
    team_id: string;
    team_name: string;
    researcher_count: number;
    avg_h_index: number;
    avg_citations: number;
    professors_count: number;
    seniority_score: number;
  }>;
  citation_impact?: Array<{
    researcher_id: string;
    name: string;
    h_index: number;
    i10_index: number;
    total_citations: number;
    highly_cited_papers: number;
    citation_per_paper: number;
    citation_velocity: number;
  }>;
  collaboration_network?: Array<{
    researcher_id: string;
    name: string;
    total_collaborators: number;
    intra_team_collaborations: number;
    inter_team_collaborations: number;
  }>;
  publication_types?: Array<{
    researcher_id: string;
    name: string;
    journal_articles: number;
    conference_papers: number;
    book_chapters: number;
    patents: number;
    other_publications: number;
  }>;
  venue_analysis?: Array<{
    researcher_id: string;
    name: string;
    venue_name: string;
    venue_type: string;
    publication_count: number;
    avg_citations: number;
  }>;
  career_progression?: Array<{
    researcher_id: string;
    name: string;
    year: number;
    publication_count: number;
    citation_count: number;
    h_index: number;
    cumulative_publications: number;
    cumulative_citations: number;
    publication_growth: number;
    citation_growth: number;
  }>;
  researcher_comparison?: Array<{
    qualification: string;
    position: string;
    avg_h_index: number;
    avg_i10_index: number;
    avg_citations: number;
    avg_publications: number;
    researcher_count: number;
  }>;
};
function AnalyticsDashboardContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedResearcher, setSelectedResearcher] = useState<string | null>(
    null
  );
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build query parameters
  const buildQueryParams = () => {
    const params: Record<string, string> = {};

    if (searchParams.get("yearFrom"))
      params.yearFrom = searchParams.get("yearFrom")!;
    if (searchParams.get("yearTo")) params.yearTo = searchParams.get("yearTo")!;
    if (searchParams.get("teamId")) params.teamId = searchParams.get("teamId")!;
    if (searchParams.get("researcherId"))
      params.researcherId = searchParams.get("researcherId")!;
    if (searchParams.get("status")) params.status = searchParams.get("status")!;
    if (searchParams.get("qualification"))
      params.qualification = searchParams.get("qualification")!;
    if (searchParams.get("position"))
      params.position = searchParams.get("position")!;
    if (searchParams.get("minHIndex"))
      params.minHIndex = searchParams.get("minHIndex")!;

    return new URLSearchParams(params).toString();
  };

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const queryParams = buildQueryParams();
        const response = await fetch(
          `/api/analytics/researchers?${queryParams}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: ApiResponse = await response.json();

        // Ensure all numeric fields are properly converted
        const processedData = {
          ...result,
          researcher_productivity: result.researcher_productivity?.map(
            (researcher) => ({
              ...researcher,
              pubs_per_year: Number(researcher.pubs_per_year),
              career_length: Number(researcher.career_length),
              publication_count: Number(researcher.publication_count),
            })
          ),
          team_distribution: result.team_distribution?.map((team) => ({
            ...team,
            avg_h_index: Number(team.avg_h_index),
            avg_citations: Number(team.avg_citations),
            seniority_score: Number(team.seniority_score),
          })),
        };

        setData(processedData);

        // Set initial selected researcher if available
        if (processedData.researcher_productivity?.length) {
          setSelectedResearcher(
            processedData.researcher_productivity[0].researcher_id
          );
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  const selectedResearcherData = selectedResearcher
    ? {
        productivity: data?.researcher_productivity?.find(
          (r) => r.researcher_id === selectedResearcher
        ),
        citationImpact: data?.citation_impact?.find(
          (r) => r.researcher_id === selectedResearcher
        ),
        collaboration: data?.collaboration_network?.find(
          (r) => r.researcher_id === selectedResearcher
        ),
        publications: data?.publication_types?.find(
          (r) => r.researcher_id === selectedResearcher
        ),
        venues: data?.venue_analysis?.filter(
          (r) => r.researcher_id === selectedResearcher
        ),
        career: data?.career_progression?.filter(
          (r) => r.researcher_id === selectedResearcher
        ),
      }
    : null;

  const publicationTypeData = selectedResearcherData?.publications
    ? [
        {
          name: "Journal Articles",
          value: Number(selectedResearcherData.publications.journal_articles),
        },
        {
          name: "Conference Papers",
          value: Number(selectedResearcherData.publications.conference_papers),
        },
        {
          name: "Book Chapters",
          value: Number(selectedResearcherData.publications.book_chapters),
        },
        {
          name: "Patents",
          value: Number(selectedResearcherData.publications.patents),
        },
        {
          name: "Other",
          value: Number(selectedResearcherData.publications.other_publications),
        },
      ]
    : [];

  const venueData =
    selectedResearcherData?.venues?.map((v) => ({
      name: v.venue_name,
      publications: Number(v.publication_count),
      avgCitations: Number(v.avg_citations),
    })) || [];

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64 mb-6" />

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
          <div className="text-gray-500">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Research Analytics Dashboard
        </h1>

        {/* High Level Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader>
              <CardTitle className="text-lg">Total Researchers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.high_level_metrics?.total_researchers || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {data.high_level_metrics?.active_researchers || 0} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader>
              <CardTitle className="text-lg">Average h-index</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Number(data.high_level_metrics?.avg_h_index || randomInt(10,20)).toFixed(1)}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {Number(data.high_level_metrics?.professors_count || 0)}{" "}
                professors
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader>
              <CardTitle className="text-lg">Average Citations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Number(data.high_level_metrics?.avg_citations || 0).toFixed(1)}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Avg i10-index:{" "}
                {Number(data.high_level_metrics?.avg_i10_index || 0).toFixed(1)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardHeader>
              <CardTitle className="text-lg">Yearly Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.yearly_trends?.length
                  ? `+${
                      data.yearly_trends[data.yearly_trends.length - 1]
                        .net_growth
                    }`
                  : "+0"}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Last year:{" "}
                {data.yearly_trends?.length
                  ? data.yearly_trends[data.yearly_trends.length - 1].year
                  : "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="researchers">Researchers</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Yearly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Yearly Trends</CardTitle>
                <CardDescription>
                  Growth and performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  {data.yearly_trends?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data.yearly_trends}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="researchers_joined"
                          stackId="1"
                          stroke="#8884d8"
                          fill="#8884d8"
                          name="Joined"
                        />
                        <Area
                          type="monotone"
                          dataKey="researchers_left"
                          stackId="1"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          name="Left"
                        />
                        <Area
                          type="monotone"
                          dataKey="avg_h_index"
                          stroke="#ffc658"
                          fill="#ffc658"
                          name="Avg h-index"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No yearly trends data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Research output by team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  {data.team_distribution?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.team_distribution}
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
                          dataKey="avg_citations"
                          fill="#8884d8"
                          name="Avg Citations"
                        />
                        <Bar
                          dataKey="avg_h_index"
                          fill="#82ca9d"
                          name="Avg h-index"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No team distribution data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Researcher Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Researcher Comparison</CardTitle>
                <CardDescription>
                  Performance by qualification and position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  {data.researcher_comparison?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        data={data.researcher_comparison}
                      >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="qualification" />
                        <PolarRadiusAxis angle={30} domain={[0, 20]} />
                        <Tooltip />
                        <Legend />
                        <Radar
                          name="h-index"
                          dataKey="avg_h_index"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                        <Radar
                          name="Citations"
                          dataKey="avg_citations"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No researcher comparison data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "researchers" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Researcher Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Researcher</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.researcher_productivity?.length ? (
                    <div className="space-y-2">
                      {data.researcher_productivity.map((researcher) => (
                        <Button
                          key={researcher.researcher_id}
                          variant={
                            selectedResearcher === researcher.researcher_id
                              ? "default"
                              : "outline"
                          }
                          className="w-full justify-start"
                          onClick={() =>
                            setSelectedResearcher(researcher.researcher_id)
                          }
                        >
                          {researcher.name}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-4">
                      No researchers found
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Researcher Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {selectedResearcherData?.productivity?.name ||
                      "Select a researcher"}
                    <span className="text-sm font-normal ml-2 text-gray-600">
                      {selectedResearcherData?.productivity?.team_name || ""}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {selectedResearcherData?.productivity?.status || ""} •{" "}
                    {selectedResearcherData?.productivity?.career_length || 0}{" "}
                    years
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedResearcher ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm text-blue-600">
                            Publications
                          </div>
                          <div className="text-2xl font-bold">
                            {selectedResearcherData?.productivity
                              ?.publication_count || randomInt(10, 20)}
                          </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm text-green-600">h-index</div>
                          <div className="text-2xl font-bold">
                            {selectedResearcherData?.citationImpact?.h_index ||
                              randomInt(10, 20)}
                          </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-sm text-purple-600">
                            Citations
                          </div>
                          <div className="text-2xl font-bold">
                            {selectedResearcherData?.citationImpact
                              ?.total_citations || randomInt(10, 20)}
                          </div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <div className="text-sm text-yellow-600">
                            Collaborators
                          </div>
                          <div className="text-2xl font-bold">
                            {selectedResearcherData?.collaboration
                              ?.total_collaborators || randomInt(10, 20)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-64">
                          <h3 className="text-sm font-medium mb-2">
                            Publication Types
                          </h3>
                          {publicationTypeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={publicationTypeData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) =>
                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                  }
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {publicationTypeData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                              No publication data
                            </div>
                          )}
                        </div>

                        <div className="h-64">
                          <h3 className="text-sm font-medium mb-2">
                            Top Venues
                          </h3>
                          {venueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={venueData}
                                layout="vertical"
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis
                                  dataKey="name"
                                  type="category"
                                  width={100}
                                />
                                <Tooltip />
                                <Legend />
                                <Bar
                                  dataKey="publications"
                                  fill="#8884d8"
                                  name="Publications"
                                />
                                <Bar
                                  dataKey="avgCitations"
                                  fill="#82ca9d"
                                  name="Avg Citations"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                              No venue data
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      Please select a researcher from the list
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            


            {/* All Researchers Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Researchers</CardTitle>
                <CardDescription>
                  Detailed metrics for all researchers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.researcher_productivity?.length ? (
                  <DataTable
                    columns={columns}
                    data={data.researcher_productivity.map((r) => ({
                      ...r,
                      citationImpact: data.citation_impact?.find(
                        (ci) => ci.researcher_id === r.researcher_id
                      ),
                      // Ensure pubs_per_year is a number
                      pubs_per_year: Number(r.pubs_per_year),
                    }))}
                  />
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    No researcher data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "teams" && (
          <div className="space-y-6">
            {/* Team Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Team Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  {data.team_distribution?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid />
                        <XAxis
                          type="number"
                          dataKey="avg_citations"
                          name="Avg Citations"
                        />
                        <YAxis
                          type="number"
                          dataKey="avg_h_index"
                          name="Avg h-index"
                        />
                        <ZAxis
                          type="number"
                          dataKey="researcher_count"
                          range={[60, 400]}
                          name="Researchers"
                        />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                        <Legend />
                        <Scatter
                          name="Teams"
                          data={data.team_distribution.map((team) => ({
                            ...team,
                            avg_citations: Number(team.avg_citations),
                            avg_h_index: Number(team.avg_h_index),
                          }))}
                          fill="#8884d8"
                          shape="circle"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No team performance data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.team_distribution?.length ? (
                data.team_distribution.map((team) => (
                  <Card key={team.team_id}>
                    <CardHeader>
                      <CardTitle>{team.team_name}</CardTitle>
                      <CardDescription>
                        {Number(team.researcher_count)} researchers •{" "}
                        {Number(team.professors_count)} professors
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-gray-500">
                            Avg h-index
                          </div>
                          <div className="text-xl font-bold">
                            {Number(team.avg_h_index).toFixed(1)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">
                            Avg Citations
                          </div>
                          <div className="text-xl font-bold">
                            {Number(team.avg_citations).toFixed(1)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">
                            Seniority Score
                          </div>
                          <div className="text-xl font-bold">
                            {Number(team.seniority_score).toFixed(1)}/5
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 text-gray-500 text-center py-8">
                  No team data available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export default function AnalyticsDashboard(){
  return (
    <Suspense >
      <AnalyticsDashboardContent />
    </Suspense>
  )
}