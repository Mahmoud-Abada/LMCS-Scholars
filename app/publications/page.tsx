"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, LineChart, ChevronLeft, ChevronRight, BarChart2, List, Library, Users, Award } from "lucide-react";
import Link from "next/link";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PublicationsPage() {
  const router = useRouter();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    search: "",
    publicationType: "",
    yearFrom: "",
    yearTo: "",
    minCitations: 0,
    sortBy: "publication_date",
    order: "desc",
  });
  const [viewMode, setViewMode] = useState<"list" | "visualizations">("list");
  const [showFilters, setShowFilters] = useState(false);

  // Process data for visualizations
  const processedData = useMemo(() => {
    if (!publications.length) return null;

    // Calculate total citations
    const totalCitations = publications.reduce((sum, pub) => sum + (pub.citationCount || 0), 0);
    const averageCitations = publications.length > 0 
      ? Math.round((totalCitations / publications.length) * 10) / 10 
      : 0;

    // Group by publication type
    const typeCounts = publications.reduce((acc, pub) => {
      const type = pub.publicationType || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Prepare yearly trends
    const yearlyData = publications.reduce((acc, pub) => {
      if (!pub.publicationDate) return acc;
      const year = new Date(pub.publicationDate).getFullYear();
      const existing = acc.find(item => item.year === year);
      const citations = pub.citationCount || 0;
      
      if (existing) {
        existing.citations += citations;
        existing.count += 1;
      } else {
        acc.push({ year, citations, count: 1 });
      }
      return acc;
    }, []);

    // Get top 5 cited publications
    const topCited = [...publications]
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
      .slice(0, 5)
      .map(pub => ({
        name: pub.title.length > 30 ? `${pub.title.substring(0, 30)}...` : pub.title,
        citations: pub.citationCount || 0,
        id: pub.id,
      }));

    // Get unique authors count
    const authors = new Set();
    publications.forEach(pub => {
      pub.authors?.forEach(author => authors.add(author.id));
    });

    return {
      totalPublications: publications.length,
      totalCitations,
      averageCitations,
      uniqueAuthors: authors.size,
      publicationTypes: Object.entries(typeCounts).map(([name, value]) => ({ 
        name: name.replace("_", " "), 
        value 
      })),
      yearlyTrends: yearlyData
        .map(item => ({
          year: item.year,
          citations: item.citations,
          average: Math.round(item.citations / item.count),
        }))
        .sort((a, b) => a.year - b.year),
      topCited,
    };
  }, [publications]);

  const fetchPublications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== "" && value !== 0) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/publications?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch publications");
      }
      const data = await response.json();
      setPublications(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, [filters]);

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleTypeChange = (value) => {
    setFilters({ ...filters, publicationType: value, page: 1 });
  };

  const handleYearFromChange = (value) => {
    setFilters({ ...filters, yearFrom: value, page: 1 });
  };

  const handleYearToChange = (value) => {
    setFilters({ ...filters, yearTo: value, page: 1 });
  };

  const handleMinCitationsChange = (e) => {
    setFilters({ ...filters, minCitations: parseInt(e.target.value) || 0, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "list" ? "visualizations" : "list");
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year);
    }
    return years;
  };

  const handlePublicationClick = (id: string) => {
    router.push(`/publication/${id}`);
  };
  

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Error Loading Publications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <Button 
              className="mt-4" 
              onClick={() => {
                setError(null);
                fetchPublications();
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Research Publications</h1>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleViewMode}>
            {viewMode === "list" ? (
              <>
                <BarChart2 className="h-4 w-4 mr-2" />
                Visualizations
              </>
            ) : (
              <>
                <List className="h-4 w-4 mr-2" />
                List
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Compact Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <Library className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Publications</p>
              {loading ? (
                <Skeleton className="h-5 w-10 mt-1" />
              ) : (
                <p className="font-semibold">459</p>
              )}
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <LineChart className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Citations</p>
              {loading ? (
                <Skeleton className="h-5 w-10 mt-1" />
              ) : (
                <p className="font-semibold">8,448</p>
              )}
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Avg. Citations</p>
              {loading ? (
                <Skeleton className="h-5 w-10 mt-1" />
              ) : (
                <p className="font-semibold">18.6</p>
              )}
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Authors</p>
              {loading ? (
                <Skeleton className="h-5 w-10 mt-1" />
              ) : (
                <p className="font-semibold">1</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Compact Filters */}
      <Card>
        <CardHeader className="p-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Filters</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-8 h-9"
                    value={filters.search}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Select
                  value={filters.publicationType}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">All Types</SelectItem>
                    <SelectItem value="journal_article">Journal Article</SelectItem>
                    <SelectItem value="conference_paper">Conference Paper</SelectItem>
                    <SelectItem value="book_chapter">Book Chapter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Select
                  value={filters.yearFrom}
                  onValueChange={handleYearFromChange}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="From Year" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    <SelectItem value="default">All years</SelectItem>
                    {generateYearOptions().map((year) => (
                      <SelectItem key={`from-${year}`} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Select
                  value={filters.yearTo}
                  onValueChange={handleYearToChange}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="To Year" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    <SelectItem value="default">All years</SelectItem>
                    {generateYearOptions().map((year) => (
                      <SelectItem key={`to-${year}`} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Content Area */}
      {viewMode === "list" ? (
        <Card>
          <CardHeader className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Publications</CardTitle>
                <CardDescription className="text-sm">
                  Showing {publications.length} publications
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : publications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No publications found matching your filters</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-4"
                  onClick={() => setFilters({
                    page: 1,
                    pageSize: 10,
                    search: "",
                    publicationType: "",
                    yearFrom: "",
                    yearTo: "",
                    minCitations: 0,
                    sortBy: "publication_date",
                    order: "desc",
                  })}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {publications.map((pub) => (
                    <div 
                      key={pub.publication_id} 
                      className="p-3 border rounded-lg hover:bg-blue-50 transition-colors cursor-pointer border-blue-100"
                      onClick={() => handlePublicationClick(pub.publication_id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-blue-700">{pub.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {pub.authors?.map(a => `${a.firstName} ${a.lastName}`).join(", ")}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs">
                            <span className="text-muted-foreground">
                              {pub.publicationDate ? new Date(pub.publicationDate).toLocaleDateString() : "Unknown date"}
                            </span>
                            <span className="flex items-center text-blue-600">
                              <LineChart className="h-3 w-3 mr-1" />
                              {pub.citationCount || 0} citations
                            </span>
                            <span className="capitalize text-blue-600">
                              {pub.publicationType?.replace("_", " ") || "Unknown type"}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-blue-500" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {filters.page}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page === 1}
                      onClick={() => handlePageChange(filters.page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={publications.length < filters.pageSize}
                      onClick={() => handlePageChange(filters.page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Publication Types Chart */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Publication Types</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] p-4">
              {loading || !processedData ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <div className="w-full h-full">
                  <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="flex flex-col justify-center space-y-2">
                      {processedData.publicationTypes.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-xs">
                            {item.name}: {item.value} ({Math.round((item.value / processedData.totalPublications) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="relative flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full border-8 border-gray-200 relative">
                        {processedData.publicationTypes.map((item, index) => {
                          const percentage = (item.value / processedData.totalPublications) * 100;
                          const rotation = processedData.publicationTypes.slice(0, index).reduce((sum, d) => {
                            const p = (d.value / processedData.totalPublications) * 360;
                            return sum + p;
                          }, 0);
                          
                          return (
                            <div
                              key={index}
                              className="absolute top-0 left-0 w-full h-full"
                              style={{
                                clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.sin((rotation * Math.PI) / 180) * 50}% ${50 - Math.cos((rotation * Math.PI) / 180) * 50}%, ${50 + Math.sin(((rotation + percentage * 3.6) * Math.PI) / 180) * 50}% ${50 - Math.cos(((rotation + percentage * 3.6) * Math.PI) / 180) * 50}%)`,
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Citations Over Time */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Citations Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] p-4">
              {loading || !processedData ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <div className="w-full h-full">
                  <div className="flex h-40 items-end space-x-2">
                    {processedData.yearlyTrends.map((item) => (
                      <div key={item.year} className="flex-1 flex flex-col items-center">
                        <div className="flex items-end space-x-1 h-32">
                          <div 
                            className="w-3 bg-blue-500 rounded-t-sm" 
                            style={{ height: `${(item.citations / Math.max(...processedData.yearlyTrends.map(i => i.citations))) * 100}%` }}
                          />
                          <div 
                            className="w-3 bg-green-500 rounded-t-sm" 
                            style={{ height: `${(item.average / Math.max(...processedData.yearlyTrends.map(i => i.average))) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs mt-1">{item.year}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center space-x-4 mt-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 mr-1" />
                      <span className="text-xs">Total</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 mr-1" />
                      <span className="text-xs">Average</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Cited Publications */}
          <Card className="lg:col-span-2">
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Top Cited Publications</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] p-4 overflow-y-auto">
              {loading || !processedData ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <div className="w-full">
                  {processedData.topCited.map((item, index) => (
                    <div 
                      key={index} 
                      className="mb-3 p-2 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                      onClick={() => handlePublicationClick(item.publication_id)}
                    >
                      <div className="text-sm mb-1 text-blue-700">{item.name}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full"
                          style={{ 
                            width: `${(item.citations / processedData.topCited[0].citations) * 100}%`,
                            transition: 'width 0.5s ease-in-out'
                          }}
                        />
                      </div>
                      <div className="text-xs text-right mt-1 text-blue-600">{item.citations} citations</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}