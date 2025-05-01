// app/test/publications/page.tsx
import { db } from '@/db/client';
import { publications } from '@/db/schema';
import { publicationTypeEnum } from '@/db/schema';

export default async function PublicationsTestPage() {
  // Fetch first 10 publications with all fields
  const publicationsData = await db
    .select()
    .from(publications)
    .limit(10);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Latest 10 Publications</h1>
      
      {publicationsData.length > 0 ? (
        <div className="space-y-6">
          {publicationsData.map((pub) => (
            <div key={pub.id} className="border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-2">{pub.title}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Details</h3>
                  <ul className="mt-2 space-y-1">
                    <li><span className="font-medium">Type:</span> {pub.publicationType}</li>
                    <li><span className="font-medium">Status:</span> {pub.status}</li>
                    <li><span className="font-medium">Published:</span> {pub.publicationDate ? new Date(pub.publicationDate).toLocaleDateString() : 'N/A'}</li>
                    <li><span className="font-medium">Publisher:</span> {pub.publisher || 'N/A'}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Identifiers</h3>
                  <ul className="mt-2 space-y-1">
                    {pub.doi && <li><span className="font-medium">DOI:</span> {pub.doi}</li>}
                    {pub.arxivId && <li><span className="font-medium">arXiv ID:</span> {pub.arxivId}</li>}
                    {pub.isbn && <li><span className="font-medium">ISBN:</span> {pub.isbn}</li>}
                    {pub.issn && <li><span className="font-medium">ISSN:</span> {pub.issn}</li>}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Metrics</h3>
                  <ul className="mt-2 space-y-1">
                    <li><span className="font-medium">Citations:</span> {pub.citationCount || 0}</li>
                    <li><span className="font-medium">Pages:</span> {pub.pageCount || 'N/A'}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Links</h3>
                  <ul className="mt-2 space-y-1">
                    {pub.url && (
                      <li>
                        <a href={pub.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Publication
                        </a>
                      </li>
                    )}
                    {pub.pdfUrl && (
                      <li>
                        <a href={pub.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Download PDF
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {pub.keywords && pub.keywords.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">Keywords</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {pub.keywords.map((keyword, index) => (
                      <span key={index} className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {pub.abstract && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">Abstract</h3>
                  <p className="mt-2 text-gray-700 line-clamp-3">{pub.abstract}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No publications found in the database.</p>
      )}
    </div>
  );
}