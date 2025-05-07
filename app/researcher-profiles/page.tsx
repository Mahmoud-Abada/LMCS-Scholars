// app/analytics/dashboard/page.tsx
'use client'

import { useState } from 'react';
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
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  Treemap,
  Sankey
} from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DataTable } from './data-table';
import { columns } from './columns';

// Mock data based on the provided structure
const mockData = {
  high_level_metrics: {
    total_researchers: 42,
    active_researchers: 35,
    avg_h_index: 12.5,
    avg_i10_index: 24.3,
    avg_citations: 856.7,
    professors_count: 8
  },
  yearly_trends: [
    { year: 2018, researchers_joined: 5, researchers_left: 1, net_growth: 4, avg_h_index: 10.2, avg_citations: 720.5 },
    { year: 2019, researchers_joined: 7, researchers_left: 2, net_growth: 5, avg_h_index: 11.1, avg_citations: 785.3 },
    { year: 2020, researchers_joined: 6, researchers_left: 1, net_growth: 5, avg_h_index: 12.3, avg_citations: 845.6 },
    { year: 2021, researchers_joined: 8, researchers_left: 3, net_growth: 5, avg_h_index: 12.8, avg_citations: 890.2 },
    { year: 2022, researchers_joined: 6, researchers_left: 2, net_growth: 4, avg_h_index: 13.2, avg_citations: 920.7 },
    { year: 2023, researchers_joined: 5, researchers_left: 1, net_growth: 4, avg_h_index: 13.5, avg_citations: 950.3 }
  ],
  researcher_productivity: [
    {
      researcher_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Smith",
      status: "active",
      team_name: "AI Research",
      publication_count: 78,
      first_publication_year: 2005,
      last_publication_year: 2023,
      career_length: 18,
      pubs_per_year: 4.33
    },
    {
      researcher_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      name: "Jane Doe",
      status: "active",
      team_name: "Quantum Computing",
      publication_count: 65,
      first_publication_year: 2008,
      last_publication_year: 2023,
      career_length: 15,
      pubs_per_year: 4.33
    },
    {
      researcher_id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Robert Johnson",
      status: "active",
      team_name: "Biotech",
      publication_count: 92,
      first_publication_year: 2002,
      last_publication_year: 2023,
      career_length: 21,
      pubs_per_year: 4.38
    }
  ],
  team_distribution: [
    {
      team_id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      team_name: "AI Research",
      researcher_count: 12,
      avg_h_index: 15.2,
      avg_citations: 1200.5,
      professors_count: 3,
      seniority_score: 3.8
    },
    {
      team_id: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
      team_name: "Quantum Computing",
      researcher_count: 8,
      avg_h_index: 13.7,
      avg_citations: 980.3,
      professors_count: 2,
      seniority_score: 3.2
    },
    {
      team_id: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
      team_name: "Biotech",
      researcher_count: 10,
      avg_h_index: 14.5,
      avg_citations: 1100.8,
      professors_count: 3,
      seniority_score: 3.5
    }
  ],
  citation_impact: [
    {
      researcher_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Smith",
      h_index: 24,
      i10_index: 45,
      total_citations: 4200,
      highly_cited_papers: 12,
      citation_per_paper: 53.85,
      citation_velocity: 233.33
    },
    {
      researcher_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      name: "Jane Doe",
      h_index: 19,
      i10_index: 38,
      total_citations: 3200,
      highly_cited_papers: 8,
      citation_per_paper: 49.23,
      citation_velocity: 213.33
    },
    {
      researcher_id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Robert Johnson",
      h_index: 27,
      i10_index: 52,
      total_citations: 4800,
      highly_cited_papers: 15,
      citation_per_paper: 52.17,
      citation_velocity: 250.0
    }
  ],
  collaboration_network: [
    {
      researcher_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Smith",
      total_collaborators: 28,
      intra_team_collaborations: 12,
      inter_team_collaborations: 16
    },
    {
      researcher_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      name: "Jane Doe",
      total_collaborators: 24,
      intra_team_collaborations: 10,
      inter_team_collaborations: 14
    },
    {
      researcher_id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Robert Johnson",
      total_collaborators: 32,
      intra_team_collaborations: 14,
      inter_team_collaborations: 18
    }
  ],
  publication_types: [
    {
      researcher_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Smith",
      journal_articles: 45,
      conference_papers: 20,
      book_chapters: 5,
      patents: 3,
      other_publications: 5
    },
    {
      researcher_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      name: "Jane Doe",
      journal_articles: 40,
      conference_papers: 18,
      book_chapters: 4,
      patents: 2,
      other_publications: 1
    },
    {
      researcher_id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Robert Johnson",
      journal_articles: 50,
      conference_papers: 25,
      book_chapters: 8,
      patents: 5,
      other_publications: 4
    }
  ],
  venue_analysis: [
    {
      researcher_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Smith",
      venue_name: "Nature",
      venue_type: "journal",
      publication_count: 8,
      avg_citations: 125.5
    },
    {
      researcher_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Smith",
      venue_name: "NeurIPS",
      venue_type: "conference",
      publication_count: 12,
      avg_citations: 85.3
    },
    {
      researcher_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Smith",
      venue_name: "Science",
      venue_type: "journal",
      publication_count: 5,
      avg_citations: 110.2
    },
    {
      researcher_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      name: "Jane Doe",
      venue_name: "Nature",
      venue_type: "journal",
      publication_count: 6,
      avg_citations: 120.8
    },
    {
      researcher_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      name: "Jane Doe",
      venue_name: "ICML",
      venue_type: "conference",
      publication_count: 10,
      avg_citations: 78.5
    },
    {
      researcher_id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Robert Johnson",
      venue_name: "Cell",
      venue_type: "journal",
      publication_count: 7,
      avg_citations: 135.7
    },
    {
      researcher_id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Robert Johnson",
      venue_name: "AAAI",
      venue_type: "conference",
      publication_count: 15,
      avg_citations: 92.3
    }
  ],
  career_progression: [
    {
      researcher_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Smith",
      year: 2018,
      publication_count: 5,
      citation_count: 120,
      h_index: 18,
      cumulative_publications: 65,
      cumulative_citations: 3200,
      publication_growth: 1,
      citation_growth: 150
    },
    {
      researcher_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Smith",
      year: 2019,
      publication_count: 6,
      citation_count: 180,
      h_index: 20,
      cumulative_publications: 71,
      cumulative_citations: 3380,
      publication_growth: 1,
      citation_growth: 180
    },
    {
      researcher_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Smith",
      year: 2020,
      publication_count: 7,
      citation_count: 210,
      h_index: 22,
      cumulative_publications: 78,
      cumulative_citations: 3590,
      publication_growth: 1,
      citation_growth: 210
    },
    {
      researcher_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Smith",
      year: 2021,
      publication_count: 6,
      citation_count: 230,
      h_index: 23,
      cumulative_publications: 84,
      cumulative_citations: 3820,
      publication_growth: 0,
      citation_growth: 230
    },
    {
      researcher_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Smith",
      year: 2022,
      publication_count: 5,
      citation_count: 250,
      h_index: 24,
      cumulative_publications: 89,
      cumulative_citations: 4070,
      publication_growth: -1,
      citation_growth: 250
    },
    {
      researcher_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Smith",
      year: 2023,
      publication_count: 4,
      citation_count: 130,
      h_index: 24,
      cumulative_publications: 93,
      cumulative_citations: 4200,
      publication_growth: -1,
      citation_growth: 130
    }
  ],
  researcher_comparison: [
    {
      qualification: "professor",
      position: "principal_investigator",
      avg_h_index: 18.5,
      avg_i10_index: 35.2,
      avg_citations: 1500.3,
      avg_publications: 65.7,
      researcher_count: 8
    },
    {
      qualification: "associate_professor",
      position: "senior_researcher",
      avg_h_index: 14.2,
      avg_i10_index: 28.6,
      avg_citations: 980.5,
      avg_publications: 45.3,
      researcher_count: 12
    },
    {
      qualification: "assistant_professor",
      position: "researcher",
      avg_h_index: 10.8,
      avg_i10_index: 22.4,
      avg_citations: 650.7,
      avg_publications: 32.1,
      researcher_count: 15
    },
    {
      qualification: "postdoc",
      position: "researcher",
      avg_h_index: 8.3,
      avg_i10_index: 18.2,
      avg_citations: 420.5,
      avg_publications: 25.6,
      researcher_count: 7
    }
  ]
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedResearcher, setSelectedResearcher] = useState(mockData.researcher_productivity[0].researcher_id);

  const selectedResearcherData = {
    productivity: mockData.researcher_productivity.find(r => r.researcher_id === selectedResearcher),
    citationImpact: mockData.citation_impact.find(r => r.researcher_id === selectedResearcher),
    collaboration: mockData.collaboration_network.find(r => r.researcher_id === selectedResearcher),
    publications: mockData.publication_types.find(r => r.researcher_id === selectedResearcher),
    venues: mockData.venue_analysis.filter(r => r.researcher_id === selectedResearcher),
    career: mockData.career_progression.filter(r => r.researcher_id === selectedResearcher)
  };

  const publicationTypeData = selectedResearcherData.publications ? [
    { name: 'Journal Articles', value: selectedResearcherData.publications.journal_articles },
    { name: 'Conference Papers', value: selectedResearcherData.publications.conference_papers },
    { name: 'Book Chapters', value: selectedResearcherData.publications.book_chapters },
    { name: 'Patents', value: selectedResearcherData.publications.patents },
    { name: 'Other', value: selectedResearcherData.publications.other_publications }
  ] : [];

  const venueData = selectedResearcherData.venues.map(v => ({
    name: v.venue_name,
    publications: v.publication_count,
    avgCitations: v.avg_citations
  }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Research Analytics Dashboard</h1>
        
        {/* High Level Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader>
              <CardTitle className="text-lg">Total Researchers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockData.high_level_metrics.total_researchers}</div>
              <p className="text-sm text-gray-600 mt-1">
                {mockData.high_level_metrics.active_researchers} active
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader>
              <CardTitle className="text-lg">Average h-index</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockData.high_level_metrics.avg_h_index.toFixed(1)}</div>
              <p className="text-sm text-gray-600 mt-1">
                {mockData.high_level_metrics.professors_count} professors
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader>
              <CardTitle className="text-lg">Average Citations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockData.high_level_metrics.avg_citations.toFixed(1)}</div>
              <p className="text-sm text-gray-600 mt-1">
                Avg i10-index: {mockData.high_level_metrics.avg_i10_index.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardHeader>
              <CardTitle className="text-lg">Yearly Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                +{mockData.yearly_trends[mockData.yearly_trends.length - 1].net_growth}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Last year: {mockData.yearly_trends[mockData.yearly_trends.length - 1].year}
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

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Yearly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Yearly Trends</CardTitle>
                <CardDescription>Growth and performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={mockData.yearly_trends}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="researchers_joined" stackId="1" stroke="#8884d8" fill="#8884d8" name="Joined" />
                      <Area type="monotone" dataKey="researchers_left" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Left" />
                      <Area type="monotone" dataKey="avg_h_index" stroke="#ffc658" fill="#ffc658" name="Avg h-index" />
                    </AreaChart>
                  </ResponsiveContainer>
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
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mockData.team_distribution}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="team_name" type="category" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avg_citations" fill="#8884d8" name="Avg Citations" />
                      <Bar dataKey="avg_h_index" fill="#82ca9d" name="Avg h-index" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Researcher Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Researcher Comparison</CardTitle>
                <CardDescription>Performance by qualification and position</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockData.researcher_comparison}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="qualification" />
                      <PolarRadiusAxis angle={30} domain={[0, 20]} />
                      <Tooltip />
                      <Legend />
                      <Radar name="h-index" dataKey="avg_h_index" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Radar name="Citations" dataKey="avg_citations" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'researchers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Researcher Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Researcher</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockData.researcher_productivity.map(researcher => (
                      <Button
                        key={researcher.researcher_id}
                        variant={selectedResearcher === researcher.researcher_id ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setSelectedResearcher(researcher.researcher_id)}
                      >
                        {researcher.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Researcher Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {selectedResearcherData.productivity?.name}
                    <span className="text-sm font-normal ml-2 text-gray-600">
                      {selectedResearcherData.productivity?.team_name}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {selectedResearcherData.productivity?.status} • {selectedResearcherData.productivity?.career_length} years
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-blue-600">Publications</div>
                      <div className="text-2xl font-bold">{selectedResearcherData.productivity?.publication_count}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm text-green-600">h-index</div>
                      <div className="text-2xl font-bold">{selectedResearcherData.citationImpact?.h_index}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-sm text-purple-600">Citations</div>
                      <div className="text-2xl font-bold">{selectedResearcherData.citationImpact?.total_citations}</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="text-sm text-yellow-600">Collaborators</div>
                      <div className="text-2xl font-bold">{selectedResearcherData.collaboration?.total_collaborators}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64">
                      <h3 className="text-sm font-medium mb-2">Publication Types</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={publicationTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {publicationTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-64">
                      <h3 className="text-sm font-medium mb-2">Top Venues</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={venueData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="publications" fill="#8884d8" name="Publications" />
                          <Bar dataKey="avgCitations" fill="#82ca9d" name="Avg Citations" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Career Progression */}
            <Card>
              <CardHeader>
                <CardTitle>Career Progression</CardTitle>
                <CardDescription>Publication and citation growth over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={selectedResearcherData.career}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="publication_count" stroke="#8884d8" name="Publications" />
                      <Line yAxisId="right" type="monotone" dataKey="citation_count" stroke="#82ca9d" name="Citations" />
                      <Line yAxisId="left" type="monotone" dataKey="h_index" stroke="#ffc658" name="h-index" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* All Researchers Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Researchers</CardTitle>
                <CardDescription>Detailed metrics for all researchers</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={mockData.researcher_productivity.map(r => ({
                    ...r,
                    citationImpact: mockData.citation_impact.find(ci => ci.researcher_id === r.researcher_id)
                  }))}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-6">
            {/* Team Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Team Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid />
                      <XAxis type="number" dataKey="avg_citations" name="Avg Citations" />
                      <YAxis type="number" dataKey="avg_h_index" name="Avg h-index" />
                      <ZAxis type="number" dataKey="researcher_count" range={[60, 400]} name="Researchers" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Legend />
                      <Scatter
                        name="Teams"
                        data={mockData.team_distribution}
                        fill="#8884d8"
                        shape="circle"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Team Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockData.team_distribution.map(team => (
                <Card key={team.team_id}>
                  <CardHeader>
                    <CardTitle>{team.team_name}</CardTitle>
                    <CardDescription>
                      {team.researcher_count} researchers • {team.professors_count} professors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-500">Avg h-index</div>
                        <div className="text-xl font-bold">{team.avg_h_index.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Avg Citations</div>
                        <div className="text-xl font-bold">{team.avg_citations.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Seniority Score</div>
                        <div className="text-xl font-bold">{team.seniority_score.toFixed(1)}/5</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}