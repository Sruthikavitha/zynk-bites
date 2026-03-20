import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddressSelector } from "@/components/zynk/AddressSelector";
import { Calendar } from "@/components/ui/calendar";

const steps = [
  "Select plan",
  "Enter address",
  "Choose start date",
  "Payment",
];

const Checkout = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [address, setAddress] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Layout>
      <section className="container px-4 py-12">
        <h1 className="section-title">Checkout</h1>
        <p className="mt-2 text-sm text-slate-500">Complete your subscription in four steps.</p>

        <div className="mt-8 rounded-2xl border border-emerald-100 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                  index === activeStep
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <span className="text-xs font-semibold">{index + 1}</span>
                {step}
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              {activeStep === 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                  {["Lite", "Signature", "Complete"].map((plan, index) => (
                    <Card key={plan} className="card-base p-4">
                      <p className="text-sm text-slate-500">{plan}</p>
                      <p className="mt-2 text-2xl font-semibold text-emerald-700">
                        ?{[2999, 4499, 5999][index]}
                      </p>
                      <Button className="mt-4 w-full" onClick={() => setActiveStep(1)}>
                        Select plan
                      </Button>
                    </Card>
                  ))}
                </div>
              )}

              {activeStep === 1 && (
                <div className="card-base p-6">
                  <h3 className="text-lg font-semibold text-slate-900">Delivery address</h3>
                  <p className="text-sm text-slate-500">Pick your preferred drop location.</p>
                  <div className="mt-4">
                    <AddressSelector value={address} onChange={setAddress} />
                  </div>
                  <Button className="mt-6" onClick={() => setActiveStep(2)}>
                    Continue
                  </Button>
                </div>
              )}

              {activeStep === 2 && (
                <div className="card-base p-6">
                  <h3 className="text-lg font-semibold text-slate-900">Start date</h3>
                  <p className="text-sm text-slate-500">Choose when your subscription begins.</p>
                  <div className="mt-4">
                    <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-xl border" />
                  </div>
                  <Button className="mt-6" onClick={() => setActiveStep(3)}>
                    Continue to payment
                  </Button>
                </div>
              )}

              {activeStep === 3 && (
                <div className="card-base p-6">
                  <h3 className="text-lg font-semibold text-slate-900">Payment</h3>
                  <p className="text-sm text-slate-500">Secure checkout powered by Razorpay.</p>
                  <Button
                    className="mt-6 h-12 w-full rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => setConfirmed(true)}
                  >
                    Pay with Razorpay
                  </Button>
                </div>
              )}
            </div>

            <div className="card-base p-6">
              <h3 className="text-lg font-semibold text-slate-900">Order summary</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Plan</span>
                  <span>Signature</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Start date</span>
                  <span>{date?.toDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Address</span>
                  <span className="max-w-[160px] text-right">{address || "Select address"}</span>
                </div>
                <div className="border-t pt-3 text-base font-semibold text-slate-900 flex items-center justify-between">
                  <span>Total</span>
                  <span>?4,499</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {confirmed && (
          <div className="relative mt-10 overflow-hidden rounded-3xl bg-emerald-600 px-6 py-10 text-center text-white">
            <h2 className="text-3xl font-semibold">Subscription confirmed!</h2>
            <p className="mt-2 text-sm text-emerald-100">Your chef begins prep immediately.</p>
            <div className="mt-6 flex justify-center">
              <Button variant="secondary" onClick={() => setConfirmed(false)}>
                Back to dashboard
              </Button>
            </div>
            <div className="pointer-events-none absolute inset-0">
              {[...Array(16)].map((_, i) => (
                <span
                  key={i}
                  className="confetti-piece absolute"
                  style={{
                    left: `${(i * 6) % 100}%`,
                    top: `${(i * 10) % 30}%`,
                    backgroundColor: i % 2 === 0 ? "#2ecc71" : "#27ae60",
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Checkout;
