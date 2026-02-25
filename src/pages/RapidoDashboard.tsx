import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MapPin, Trophy, Bike, IndianRupee } from 'lucide-react';

interface RideEntry {
  serviceId: string;
  customer: string;
  amount: number;
  location: string;
}

const data: RideEntry[] = [
  { serviceId: "E01", customer: "Amit", amount: 120, location: "Indiranagar" },
  { serviceId: "E02", customer: "Sneha", amount: 450, location: "Whitefield" },
  { serviceId: "E03", customer: "Raj", amount: 80, location: "Koramangala" },
  { serviceId: "E04", customer: "Priya", amount: 310, location: "MG Road" },
  { serviceId: "E05", customer: "Vikram", amount: 150, location: "HSR Layout" },
  { serviceId: "E06", customer: "Anjali", amount: 220, location: "Jayanagar" },
  { serviceId: "E07", customer: "Karan", amount: 500, location: "Airport" },
  { serviceId: "E08", customer: "Sonia", amount: 95, location: "Hebbal" },
  { serviceId: "E09", customer: "Rahul", amount: 380, location: "Electronic City" },
  { serviceId: "E10", customer: "Pooja", amount: 130, location: "Marathahalli" },
];

const getRating = (amount: number) => {
  if (amount >= 400) return "⭐⭐⭐⭐⭐";
  if (amount >= 200) return "⭐⭐⭐⭐";
  return "⭐⭐⭐";
};

const RapidoDashboard = () => {
  const top3 = useMemo(() => [...data].sort((a, b) => b.amount - a.amount).slice(0, 3), []);
  const top3Ids = new Set(top3.map(r => r.serviceId));
  const totalEarned = data.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-6 min-h-screen">
          <h2 className="text-lg font-semibold text-foreground mb-6">Daily Summary</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Rides</p>
              <p className="text-3xl font-bold text-foreground">{data.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <div className="flex items-center gap-1">
                <IndianRupee className="w-6 h-6 text-primary" />
                <p className="text-3xl font-bold text-primary">{totalEarned.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
              <Bike className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Rapido Rider</h1>
              <p className="text-sm text-muted-foreground">Daily Service Logs</p>
            </div>
          </div>

          {/* Mobile Summary */}
          <div className="md:hidden flex gap-4">
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Rides</p>
                <p className="text-2xl font-bold text-foreground">{data.length}</p>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold text-primary">₹{totalEarned.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Top 3 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Pinned: Top 3 Highest Earning Rides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {top3.map((ride, i) => (
                <Card key={ride.serviceId} className={i === 0 ? 'border-primary/40 bg-primary/5' : ''}>
                  <CardHeader className="pb-2">
                    <Badge variant={i === 0 ? 'default' : 'secondary'} className="w-fit">
                      Rank {i + 1}
                    </Badge>
                    <CardTitle className="text-lg">Ride {ride.serviceId}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-2xl font-bold text-foreground">₹{ride.amount}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {ride.location}
                    </p>
                    <p className="text-sm">{getRating(ride.amount)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* All Entries Table */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              📅 All Daily Entries (Total: {data.length})
            </h2>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((ride) => (
                    <TableRow key={ride.serviceId} className={top3Ids.has(ride.serviceId) ? 'bg-muted/50' : ''}>
                      <TableCell className="font-medium">{ride.serviceId}</TableCell>
                      <TableCell>{ride.customer}</TableCell>
                      <TableCell>₹{ride.amount}</TableCell>
                      <TableCell>{ride.location}</TableCell>
                      <TableCell>{getRating(ride.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};

export default RapidoDashboard;
