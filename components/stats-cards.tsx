import { db } from "@/db/client";
import {  publications, researchers } from "@/db/schema";
import { count, eq } from "drizzle-orm";

async function getStats() {
  // Count active researchers
  const activeResearchers = await db
    .select({ count: count() })
    .from(researchers)
    // .where(eq(researchers.status, "active"));

  // Count all publications
  const totalPublications = await db
    .select({ count: count() })
    .from(publications);

  return {
    researchers: activeResearchers[0]?.count || 0,
    publications: totalPublications[0]?.count || 0,
  };
}

export async function StatsCards() {
  const stats = await getStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Researchers Card */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">ACTIVE RESEARCHERS</span>
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <svg width={20} height={20} fill="currentColor">
              <path d="M9 0v2.013a8.001 8.001 0 1 0 5.905 14.258l1.424 1.422A9.958 9.958 0 0 1 10 19.951c-5.523 0-10-4.478-10-10C0 4.765 3.947.5 9 0Zm10.95 10.95a9.954 9.954 0 0 1-2.207 5.329l-1.423-1.423a7.96 7.96 0 0 0 1.618-3.905h2.013ZM11.002 0c4.724.47 8.48 4.227 8.95 8.95h-2.013a8.004 8.004 0 0 0-6.937-6.937V0Z" />
            </svg>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-gray-800">{stats.researchers}</span>
          {/* You can add growth percentage if you track historical data */}
          {/* <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">+2% vs last year</span> */}
        </div>
      </div>

      {/* Publications Card */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">PUBLICATIONS</span>
          <div className="p-2 rounded-lg bg-green-100 text-green-600">
            <svg width={18} height={19} fill="currentColor">
              <path d="M2 9.5c0 .313.461.858 1.53 1.393C4.914 11.585 6.877 12 9 12c2.123 0 4.086-.415 5.47-1.107C15.538 10.358 16 9.813 16 9.5V7.329C14.35 8.349 11.827 9 9 9s-5.35-.652-7-1.671V9.5Zm14 2.829C14.35 13.349 11.827 14 9 14s-5.35-.652-7-1.671V14.5c0 .313.461.858 1.53 1.393C4.914 16.585 6.877 17 9 17c2.123 0 4.086-.415 5.47-1.107 1.069-.535 1.53-1.08 1.53-1.393v-2.171ZM0 14.5v-10C0 2.015 4.03 0 9 0s9 2.015 9 4.5v10c0 2.485-4.03 4.5-9 4.5s-9-2.015-9-4.5ZM9 7c2.123 0 4.086-.415 5.47-1.107C15.538 5.358 16 4.813 16 4.5c0-.313-.461-.858-1.53-1.393C13.085 2.415 11.123 2 9 2c-2.123 0-4.086.415-5.47 1.107C2.461 3.642 2 4.187 2 4.5c0 .313.461.858 1.53 1.393C4.914 6.585 6.877 7 9 7Z" />
            </svg>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-gray-800">{stats.publications}</span>
          {/* You can add growth percentage if you track historical data */}
          {/* <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">+7% vs last year</span> */}
        </div>
      </div>
    </div>
  );
}