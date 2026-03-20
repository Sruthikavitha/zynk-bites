import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const history = [
  { id: "s1", plan: "Signature", date: "Jan 12, 2026", status: "Active" },
  { id: "s2", plan: "Lite", date: "Nov 10, 2025", status: "Paused" },
];

const Profile = () => {
  return (
    <Layout>
      <section className="container px-4 py-12">
        <h1 className="section-title">Profile</h1>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Card className="card-base p-6">
            <h3 className="text-lg font-semibold text-slate-900">Your details</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Name: Sruthi</p>
              <p>Email: sruthi@example.com</p>
              <p>Role: Customer</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button>Update password</Button>
              <Button variant="outline">Update address</Button>
            </div>
          </Card>
          <Card className="card-base p-6">
            <h3 className="text-lg font-semibold text-slate-900">Subscription history</h3>
            <div className="mt-4 space-y-3">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{item.plan}</p>
                    <p className="text-xs text-slate-500">Started {item.date}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700">{item.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Profile;
