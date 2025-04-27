'use client';

import { useEffect, useState } from 'react';

export default function TestAllPublicationsPage() {
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublications = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/publications');
        const json = await res.json();

        if (!res.ok) throw new Error(json.error || 'Failed to fetch publications');
        setPublications(json.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPublications();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">All Publications</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {publications.length > 0 ? (
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Year</th>
              <th className="p-2 border">Citations</th>
              <th className="p-2 border">Researcher</th>
            </tr>
          </thead>
          <tbody>
            {publications.map((pub, index) => (
              <tr key={index}>
                <td className="p-2 border">{pub.title || '—'}</td>
                <td className="p-2 border text-center">{pub.year || '—'}</td>
                <td className="p-2 border text-center">{pub.citationCount || 0}</td>
                <td className="p-2 border">{pub.researcherName || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p>No publications found.</p>
      )}
    </div>
  );
}
