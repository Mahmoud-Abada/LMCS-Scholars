import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  QuoteIcon,
  FileTextIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"; // or your preferred icon library

interface DashboardItem {
  name: string;
  icon: React.ReactNode;
  href: string;
}

interface DashboardCategory {
  name: string;
  items: DashboardItem[];
}

export default function AnalyticsHub() {
  const categories: DashboardCategory[] = [
    {
      name: "Research Metrics",
      items: [
        { 
          name: "Citations", 
          icon: <QuoteIcon className="w-5 h-5" />, 
          href: "/citations" 
        },
        { 
          name: "Publications", 
          icon: <FileTextIcon className="w-5 h-5" />, 
          href: "/publications" 
        },
      ]
    },
    {
      name: "Productivity",
      items: [
        { 
          name: "Output Trends", 
          icon: <TrendingUpIcon className="w-5 h-5" />, 
          href: "/analytics/productivity" 
        },
        { 
          name: "Collaborations", 
          icon: <UsersIcon className="w-5 h-5" />, 
          href: "/analytics/collaborations" 
        },
      ]
    },
    {
      name: "Statistics",
      items: [
        { 
          name: "Annual Reports", 
          icon: <FileTextIcon className="w-5 h-5" />, 
          href: "/analytics/annual-reports" 
        },
        { 
          name: "Researcher Profiles", 
          icon: <UsersIcon className="w-5 h-5" />, 
          href: "/researcher-profiles" 
        },
      ]
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Research Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive metrics and insights for your research activities
        </p>
      </header>

      <div className="space-y-12">
        {categories.map((category) => (
          <section key={category.name} className="space-y-4">
            <h2 className="text-xl font-semibold">{category.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {category.items.map((item) => (
                <Card 
                  key={item.name}
                  className="hover:shadow-md transition-shadow hover:border-primary/20"
                >
                  <Link href={item.href} className="block h-full">
                    <CardHeader className="h-full">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {item.icon}
                        </div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                      </div>
                    </CardHeader>
                  </Link>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}