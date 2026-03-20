import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";

const orders = [
  { id: "o1", meal: "Paneer Bowl", status: "Preparing" },
  { id: "o2", meal: "Keto Salad", status: "Out for delivery" },
  { id: "o3", meal: "Masala Dosa", status: "Scheduled" },
];

const ChefDashboard = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Layout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50/70 via-white to-white" />
        <div className="container px-4 py-12">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="section-title">Chef Dashboard</h1>
              <p className="mt-2 text-sm text-slate-500">Plan menus and monitor incoming orders.</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
              Menu window open
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="card-base p-6">
            <h3 className="text-lg font-semibold text-slate-900">Publish weekly menu</h3>
            <p className="text-sm text-slate-500">Select dates and upload dish visuals.</p>
            <div className="mt-4">
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-xl border" />
            </div>
            <div className="mt-4 grid gap-3">
              <Input placeholder="Dish name" />
              <Input placeholder="Calories" />
              <Input type="file" />
              <Button className="w-full">Publish menu</Button>
            </div>
            </Card>

            <Card className="card-base p-6">
              <h3 className="text-lg font-semibold text-slate-900">Orders</h3>
              <div className="mt-4 space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{order.meal}</p>
                      <p className="text-xs text-slate-500">Order #{order.id}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ChefDashboard;
