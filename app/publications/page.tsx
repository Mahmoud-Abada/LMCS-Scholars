"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Search, Filter, BookOpenText, LineChart, ChevronLeft, ChevronRight, BarChart2, List, Library, Users, Award } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PublicationsPage() {
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

  // Process data for visualizations
  const processedData = useMemo(() => {
    if (!publications.length) return null;

    // Calculate total citations
    const totalCitations = publications.reduce((sum, pub) => sum + (pub.citation_count || 0), 0);
    const averageCitations = publications.length > 0 
      ? Math.round((totalCitations / publications.length) * 10) / 10 
      : 0;

    // Group by publication type
    const typeCounts = publications.reduce((acc, pub) => {
      const type = pub.publication_type || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Prepare yearly trends
    const yearlyData = publications.reduce((acc, pub) => {
      if (!pub.publication_date) return acc;
      const year = new Date(pub.publication_date).getFullYear();
      const existing = acc.find(item => item.year === year);
      const citations = pub.citation_count || 0;
      
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
      .sort((a, b) => (b.citation_count || 0) - (a.citation_count || 0))
      .slice(0, 5)
      .map(pub => ({
        name: pub.title.length > 30 ? `${pub.title.substring(0, 30)}...` : pub.title,
        citations: pub.citation_count || 0,
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

  const handleYearFromChange = (e) => {
    setFilters({ ...filters, yearFrom: e, page: 1 });
  };

  const handleYearToChange = (e) => {
    setFilters({ ...filters, yearTo: e, page: 1 });
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Research Publications</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleViewMode}>
            {viewMode === "list" ? (
              <>
                <BarChart2 className="h-4 w-4 mr-2" />
                Show Visualizations
              </>
            ) : (
              <>
                <List className="h-4 w-4 mr-2" />
                Show List
              </>
            )}
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* General Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Publications</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{processedData?.totalPublications || 0}</div>
                <p className="text-xs text-muted-foreground">Current filtered results</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Citations</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{processedData?.totalCitations || 0}</div>
                <p className="text-xs text-muted-foreground">Combined citations</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Citations</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{processedData?.averageCitations || 0}</div>
                <p className="text-xs text-muted-foreground">Per publication</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Authors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{processedData?.uniqueAuthors || 0}</div>
                <p className="text-xs text-muted-foreground">Contributing researchers</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Publications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search publications..."
                  className="pl-8"
                  value={filters.search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Publication Type</label>
              <Select
                value={filters.publicationType}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">All Types</SelectItem>
                  <SelectItem value="journal_article">Journal Article</SelectItem>
                  <SelectItem value="conference_paper">Conference Paper</SelectItem>
                  <SelectItem value="book_chapter">Book Chapter</SelectItem>
                  <SelectItem value="patent">Patent</SelectItem>
                  <SelectItem value="technical_report">Technical Report</SelectItem>
                  <SelectItem value="thesis">Thesis</SelectItem>
                  <SelectItem value="preprint">Preprint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">From Year</label>
              <Select
                value={filters.yearFrom}
                onValueChange={handleYearFromChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="any">All years</SelectItem>
                  {generateYearOptions().map((year) => (
                    <SelectItem key={`from-${year}`} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Year</label>
              <Select
                value={filters.yearTo}
                onValueChange={handleYearToChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="any">All years</SelectItem>
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
      </Card>

      {/* Main Content Area */}
      {viewMode === "list" ? (
        <Card>
          <CardHeader>
            <CardTitle>Publications List</CardTitle>
            <CardDescription>
              Showing {publications.length} publications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : publications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No publications found matching your filters</p>
                <Button 
                  variant="outline" 
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
                <div className="space-y-4">
                  {publications.map((pub) => (
                    <Card key={pub.publication_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold">{pub.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {pub.authors?.map(a => a.name).join(", ")}
                            </p>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm">
                              <span className="text-muted-foreground">
                                {pub.publication_date ? new Date(pub.publication_date).toLocaleDateString() : "Unknown date"}
                              </span>
                              <span className="flex items-center">
                                <LineChart className="h-4 w-4 mr-1" />
                                {pub.citation_count || 0} citations
                              </span>
                              <span className="capitalize">
                                {pub.publication_type?.replace("_", " ") || "Unknown type"}
                              </span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing page {filters.page}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={filters.page === 1}
                      onClick={() => handlePageChange(filters.page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Publication Types Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Publication Types Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              {loading || !processedData ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <div className="w-full h-full">
                  <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="flex flex-col justify-center space-y-4">
                      {processedData.publicationTypes.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-2" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm">
                            {item.name}: {item.value} ({Math.round((item.value / processedData.totalPublications) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="relative flex items-center justify-center">
                      <div className="w-40 h-40 rounded-full border-8 border-gray-200 relative">
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
            <CardHeader>
              <CardTitle>Citations Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              {loading || !processedData ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <div className="w-full h-full">
                  <div className="flex h-64 items-end space-x-4">
                    {processedData.yearlyTrends.map((item) => (
                      <div key={item.year} className="flex-1 flex flex-col items-center">
                        <div className="flex items-end space-x-2 h-48">
                          <div 
                            className="w-6 bg-blue-500 rounded-t-sm" 
                            style={{ height: `${(item.citations / Math.max(...processedData.yearlyTrends.map(i => i.citations))) * 100}%` }}
                          />
                          <div 
                            className="w-6 bg-green-500 rounded-t-sm" 
                            style={{ height: `${(item.average / Math.max(...processedData.yearlyTrends.map(i => i.average))) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs mt-2">{item.year}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center space-x-4 mt-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-500 mr-2" />
                      <span className="text-sm">Total Citations</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 mr-2" />
                      <span className="text-sm">Average</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Cited Publications */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top Cited Publications</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              {loading || !processedData ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <div className="w-full h-full overflow-y-auto">
                  {processedData.topCited.map((item, index) => (
                    <div key={index} className="mb-4">
                      <div className="text-sm mb-1">{item.name}</div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-yellow-500 h-4 rounded-full"
                          style={{ 
                            width: `${(item.citations / processedData.topCited[0].citations) * 100}%`,
                            transition: 'width 0.5s ease-in-out'
                          }}
                        />
                      </div>
                      <div className="text-xs text-right mt-1">{item.citations} citations</div>
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