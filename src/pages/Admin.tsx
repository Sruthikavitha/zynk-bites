import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const rows = [
  { id: "u1", name: "Aditi", role: "Customer", status: "Active" },
  { id: "u2", name: "Chef Rishi", role: "Chef", status: "Pending" },
  { id: "u3", name: "Maya", role: "Customer", status: "Paused" },
];

const Admin = () => {
  return (
    <Layout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50/70 via-white to-white" />
        <div className="container px-4 py-12">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="section-title">Admin Console</h1>
              <p className="mt-2 text-sm text-slate-500">Monitor users, chefs, and subscriptions.</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
              Operational
            </div>
          </div>

          <Card className="card-base mt-6 p-6">
            <div className="flex flex-wrap items-center gap-4">
              <Input placeholder="Search users, chefs, subscriptions" className="h-11 max-w-sm" />
              <Input placeholder="Filter by role" className="h-11 max-w-xs" />
            </div>
            <div className="mt-6 overflow-hidden rounded-xl border border-emerald-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-emerald-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                      <td className="px-4 py-3 text-slate-600">{row.role}</td>
                      <td className="px-4 py-3 text-emerald-700">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Admin;
