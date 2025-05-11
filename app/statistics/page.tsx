"use client"

import { useState, useEffect } from "react";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, FileText, Award, BookOpen } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

type PublicationTrend = {
  year: number;
  count: number;
  citations: number;
};

type ResearchTeam = {
  name: string;
  researchers: number;
  publications: number;
};

type PublicationType = {
  name: string;
  value: number;
};

type VenueRanking = {
  name: string;
  value: number;
};

type Researcher = {
  id: string;
  firstName: string;
  lastName: string;
  hIndex: number;
  publications: number;
  citations: number;
  teamName?: string;
};

export default function StatisticsDashboard() {
  const [timeRange, setTimeRange] = useState("5years");
  const [teamFilter, setTeamFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [publicationTrends, setPublicationTrends] = useState<PublicationTrend[]>([]);
  const [researchTeams, setResearchTeams] = useState<ResearchTeam[]>([]);
  const [publicationTypes, setPublicationTypes] = useState<PublicationType[]>([]);
  const [venueRankings, setVenueRankings] = useState<VenueRanking[]>([]);
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [metrics, setMetrics] = useState({
    totalResearchers: 0,
    totalPublications: 0,
    avgHIndex: 0,
    topVenues: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Calculate year range based on selection
        const currentYear = new Date().getFullYear();
        let yearFrom = 2000;
        
        if (timeRange === "1year") yearFrom = currentYear - 1;
        else if (timeRange === "3years") yearFrom = currentYear - 3;
        else if (timeRange === "5years") yearFrom = currentYear - 5;
        
        // Fetch publication trends
        const trendsRes = await fetch(`/api/analytics/productivity?groupBy=year&yearFrom=${yearFrom}`);
        const trendsData = await trendsRes.json();
        setPublicationTrends(trendsData.productivityData.map((item: any) => ({
          year: parseInt(item.group),
          count: item.publicationCount,
          citations: item.citationSum
        })));

        // Fetch research teams data
        const teamsRes = await fetch('/api/analytics/collaborations');
        const teamsData = await teamsRes.json();
        setResearchTeams(teamsData.networkData
          .filter((item: any) => item.type === 'internal')
          .map((item: any) => ({
            name: item.sourceName.split(' ')[0], // Simplified team name
            researchers: Math.floor(Math.random() * 10) + 3, // Mock count
            publications: item.weight
          })));

        // Fetch publication types
        const typesRes = await fetch('/api/analytics/impact');
        const typesData = await typesRes.json();
        setPublicationTypes([
          { name: "Conference", value: typesData.venueImpact.filter((v: any) => v.venueType === 'conference').length },
          { name: "Journal", value: typesData.venueImpact.filter((v: any) => v.venueType === 'journal').length },
          { name: "Workshop", value: typesData.venueImpact.filter((v: any) => v.venueType === 'workshop').length },
          { name: "Other", value: typesData.venueImpact.filter((v: any) => !['conference', 'journal', 'workshop'].includes(v.venueType)).length }
        ]);

        // Fetch venue rankings
        setVenueRankings([
          { name: "CORE A*", value: typesData.venueImpact.filter((v: any) => v.impactFactor && v.impactFactor > 5).length },
          { name: "CORE A", value: typesData.venueImpact.filter((v: any) => v.impactFactor && v.impactFactor > 3).length },
          { name: "CORE B", value: typesData.venueImpact.filter((v: any) => v.impactFactor && v.impactFactor > 1).length },
          { name: "Other", value: typesData.venueImpact.filter((v: any) => !v.impactFactor).length }
        ]);

        // Fetch researchers data
        const researchersRes = await fetch('/api/analytics/citations');
        const researchersData = await researchersRes.json();
        const topResearchers = researchersData.metrics.topPerformers || [];
        setResearchers(topResearchers.map((r: any) => ({
          id: r.researcherId,
          firstName: r.researcherName.split(' ')[0],
          lastName: r.researcherName.split(' ')[1],
          hIndex: r.hIndex,
          publications: r.publicationCount,
          citations: r.citationSum,
          teamName: r.teamName
        })));

        // Calculate summary metrics
        setMetrics({
          totalResearchers: researchers.length,
          totalPublications: trendsData.productivityData.reduce((sum: number, item: any) => sum + item.publicationCount, 0),
          avgHIndex: researchers.reduce((sum: number, r: any) => sum + r.hIndex, 0) / researchers.length,
          topVenues: typesData.venueImpact.filter((v: any) => v.impactFactor && v.impactFactor > 5).length
        });

        setLoading(false);
      } catch (err) {
        setError("Failed to load data. Please try again later.");
        setLoading(false);
        console.error(err);
      }
    };

    fetchData();
  }, [timeRange, teamFilter]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <SidebarProvider>
          <div className="flex-1 p-8 ml-5">
            <div className="flex justify-between items-center mb-8">
              <Skeleton className="h-8 w-[300px]" />
              <div className="flex gap-4">
                <Skeleton className="h-10 w-[180px]" />
                <Skeleton className="h-10 w-[180px]" />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-[100px] mb-2" />
                    <Skeleton className="h-3 w-[150px]" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-6">
              <Skeleton className="h-10 w-[400px]" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className={i === 0 || i === 3 ? "col-span-2" : ""}>
                    <CardHeader>
                      <Skeleton className="h-6 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-[300px] w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarProvider>
        <div className="flex-1 p-8 ml-5">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Research Analytics Dashboard</h1>
            <div className="flex gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1year">Last Year</SelectItem>
                  <SelectItem value="3years">Last 3 Years</SelectItem>
                  <SelectItem value="5years">Last 5 Years</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Research Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {researchTeams.map(team => (
                    <SelectItem key={team.name} value={team.name}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Researchers</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalResearchers}</div>
                <p className="text-xs text-gray-500">Active researchers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Publications</CardTitle>
                <FileText className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalPublications}</div>
                <p className="text-xs text-gray-500">Last {timeRange === "all" ? "all years" : timeRange}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Average H-Index</CardTitle>
                <Award className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgHIndex.toFixed(1)}</div>
                <p className="text-xs text-gray-500">Researcher impact</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Top Venues</CardTitle>
                <BookOpen className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.topVenues}</div>
                <p className="text-xs text-gray-500">High impact venues</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="researchers">Researchers</TabsTrigger>
              <TabsTrigger value="publications">Publications</TabsTrigger>
              <TabsTrigger value="venues">Venues</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Publication & Citation Trends</CardTitle>
                    <CardDescription>Research output over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={publicationTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" name="Publications" />
                          <Line yAxisId="right" type="monotone" dataKey="citations" stroke="#10b981" name="Citations" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Research Teams</CardTitle>
                    <CardDescription>Productivity by research team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={researchTeams}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="name" />
                          <PolarRadiusAxis />
                          <Radar name="Publications" dataKey="publications" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Publication Types</CardTitle>
                    <CardDescription>Distribution of publication types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={publicationTypes}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {publicationTypes.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Venue Rankings</CardTitle>
                    <CardDescription>Quality distribution of publication venues</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={venueRankings}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="researchers">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Top Researchers</CardTitle>
                    <CardDescription>By publications and citations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        >
                          <CartesianGrid />
                          <XAxis type="number" dataKey="publications" name="Publications" unit="pubs" />
                          <YAxis type="number" dataKey="citations" name="Citations" unit="cites" />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Scatter 
                            name="Researchers" 
                            data={researchers} 
                            fill="#8884d8" 
                            shape={(props) => {
                              const { cx, cy, payload } = props;
                              return (
                                <g>
                                  <circle cx={cx} cy={cy} r={8} fill="#8884d8" />
                                  <text 
                                    x={cx} 
                                    y={cy} 
                                    dy={-15} 
                                    textAnchor="middle" 
                                    fontSize={10}
                                    fill="#333"
                                  >
                                    {payload.firstName[0]}. {payload.lastName}
                                  </text>
                                </g>
                              );
                            }}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>H-Index Distribution</CardTitle>
                    <CardDescription>Researcher impact distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: "0-5", value: researchers.filter(r => r.hIndex <= 5).length },
                          { name: "6-10", value: researchers.filter(r => r.hIndex > 5 && r.hIndex <= 10).length },
                          { name: "11-20", value: researchers.filter(r => r.hIndex > 10 && r.hIndex <= 20).length },
                          { name: "20+", value: researchers.filter(r => r.hIndex > 20).length }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="publications">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Publication Growth</CardTitle>
                    <CardDescription>Cumulative publications over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={publicationTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Publications by Team</CardTitle>
                    <CardDescription>Current year publications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={researchTeams}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="publications"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {researchTeams.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="venues">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Venue Types</CardTitle>
                    <CardDescription>Conference vs Journal publications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={publicationTypes}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {publicationTypes.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Venue Rankings</CardTitle>
                    <CardDescription>Quality distribution of publication venues</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={venueRankings}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarProvider>
    </div>
  );
}