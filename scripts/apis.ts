// Example using Semantic Scholar API
export async  function  fetchFromSemanticScholar(query: string) {
    const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}`);
    return response.json();
  }
  
  // Example using CrossRef API
  export async function   fetchFromCrossRef(query: string) {
    const response = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(query)}`);
    return response.json();
  }