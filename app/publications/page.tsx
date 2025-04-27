"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, BookOpen, Calendar, Filter, BarChart2 } from "lucide-react"
import Link from "next/link"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Mock data based on your database schema
const mockPublications = [
  {
    publication_id: "ML-2023-01",
    title: "Advanced Machine Learning Techniques for Image Recognition",
    chercheur_id: "ESI-001",
    researcher_name: "Prof. Nadia Benmansour",
    pages: 12,
    volume: "Vol. 15",
    link: "https://example.com/pub1",
    year: 2023,
    venue: {
      id: "ICML-2023",
      name: "International Conference on Machine Learning",
      type: "conférence",
      theme: "Machine Learning",
      scope: "International",
      location: "Honolulu, Hawaii",
      period: "2023-07-23 to 2023-07-29",
      frequency: "Annuel"
    },
    rankings: [
      { system: "CORE", rank: "A*", link: "https://core.edu.au" },
      { system: "DGRSDT", rank: "A", link: "https://dgrsdt.dz" }
    ]
  },
  {
    publication_id: "SEC-2022-04",
    title: "Novel Cryptographic Protocols for Blockchain Systems",
    chercheur_id: "ESI-002",
    researcher_name: "Dr. Karim Hadj",
    pages: 8,
    volume: "Vol. 8",
    link: "https://example.com/pub2",
    year: 2022,
    venue: {
      id: "IEEE-SP",
      name: "IEEE Symposium on Security and Privacy",
      type: "conférence",
      theme: "Cybersecurity",
      scope: "International",
      location: "San Francisco, CA",
      period: "2022-05-22 to 2022-05-26",
      frequency: "Annuel"
    },
    rankings: [
      { system: "CORE", rank: "A", link: "https://core.edu.au" }
    ]
  },
  // Add more publications...
];

const publicationTypes = ["All", "conférence", "journal", "others"];
const rankingSystems = ["All", "CORE", "Scimago", "DGRSDT", "Qualis"];

export default function PublicationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [rankingFilter, setRankingFilter] = useState("all");
  const [themeFilter, setThemeFilter] = useState("all");

  // Get unique years, themes for filters
  const years = Array.from(new Set(mockPublications.map(pub => pub.year))).sort((a, b) => b - a);
  const themes = Array.from(new Set(mockPublications.map(pub => pub.venue.theme))).sort();

  const filteredPublications = mockPublications.filter(pub => {
    const matchesSearch = pub.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         pub.researcher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pub.venue.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = yearFilter === "all" || pub.year.toString() === yearFilter;
    const matchesType = typeFilter === "all" || pub.venue.type === typeFilter;
    const matchesTheme = themeFilter === "all" || pub.venue.theme === themeFilter;
    
    const matchesRanking = rankingFilter === "all" || 
                         pub.rankings.some(r => r.system === rankingFilter);
    
    return matchesSearch && matchesYear && matchesType && matchesTheme && matchesRanking;
  });

  // Data for publications by year chart
  const chartData = {
    labels: years,
    datasets: [
      {
        label: 'Publications',
        data: years.map(year => 
          mockPublications.filter(pub => pub.year === year).length
        ),
        backgroundColor: 'rgba(99, 102, 241, 0.7)', // More pleasant indigo color
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#111827',
        bodyColor: '#111827',
        borderColor: '#e5e7eb',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        }
      },
      x: {
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        }
      }
    },
  };

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Scientific Publications</h1>
        <p className="text-muted-foreground">
          Track and explore all research publications from LMCS laboratory
        </p>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search publications..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {publicationTypes.filter(t => t !== "All").map(type => (
              <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rankingFilter} onValueChange={setRankingFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Ranking" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rankings</SelectItem>
            {rankingSystems.filter(r => r !== "All").map(system => (
              <SelectItem key={system} value={system}>{system}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Additional filters row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Select value={themeFilter} onValueChange={setThemeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Research Theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Themes</SelectItem>
            {themes.map(theme => (
              <SelectItem key={theme} value={theme}>{theme}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statistics Section - Lightened version */}
      <div className="bg-blue-50/50 p-4 rounded-lg shadow mb-6 border border-blue-100">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-blue-800">Publication Statistics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Publications</h3>
            <p className="text-2xl font-bold text-blue-600">{mockPublications.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Publications This Year</h3>
            <p className="text-2xl font-bold text-blue-600">
              {mockPublications.filter(pub => pub.year === new Date().getFullYear()).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Top Ranking (A*)</h3>
            <p className="text-2xl font-bold text-blue-600">
              {mockPublications.filter(pub => pub.rankings.some(r => r.rank === "A*")).length}
            </p>
          </div>
        </div>
      </div>

      {/* Publications List */}
      <div className="space-y-4 mb-8">
        {filteredPublications.length > 0 ? (
          filteredPublications.map((publication) => (
            <Card key={publication.publication_id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">
                  <Link href={publication.link} target="_blank" className="hover:underline">
                    {publication.title}
                  </Link>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span>{publication.researcher_name}</span>
                  <span>•</span>
                  <span>{publication.year}</span>
                  <span>•</span>
                  <span>{publication.venue.name}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {publication.pages} pages
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {publication.volume}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {publication.year}
                  </Badge>
                  {publication.rankings.map((ranking, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {ranking.system}: {ranking.rank}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Venue Information</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Type: {publication.venue.type}</p>
                      <p>Theme: {publication.venue.theme}</p>
                      <p>Scope: {publication.venue.scope}</p>
                      <p>Location: {publication.venue.location}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Links</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={publication.link} target="_blank">
                          View Publication
                        </Link>
                      </Button>
                      {publication.rankings.map((ranking, index) => (
                        <Button key={index} variant="outline" size="sm" asChild>
                          <Link href={ranking.link} target="_blank">
                            {ranking.system} Ranking
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No publications found</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your filters or search query to find what you're looking for.
            </p>
          </div>
        )}
      </div>

      {/* Publications Chart - Now placed after publications list */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-800">Publications by Year</h2>
        </div>
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  )
}