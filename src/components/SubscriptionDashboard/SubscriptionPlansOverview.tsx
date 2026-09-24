import React from "react";
import { CheckCircle2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  activeSubscriptions: number;
  tag: string;
  tagColor?: string;
}

interface SubscriptionPlansOverviewProps {
  plans: Plan[];
}

const SubscriptionPlansOverview: React.FC<SubscriptionPlansOverviewProps> = ({ plans }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {plans.map((plan) => (
        <div key={plan.id} className="border border-slate-200 rounded-xl p-5 relative bg-white hover:border-blue-300 transition-colors shadow-sm flex flex-col h-full">
          {plan.tag && (
            <div className="absolute top-4 right-4">
              <span className={`text-[10px] font-bold px-2 py-1 rounded bg-${plan.tagColor || 'blue'}-50 text-${plan.tagColor || 'blue'}-600 uppercase tracking-wider`}>
                {plan.tag}
              </span>
            </div>
          )}
          
          <h3 className={`text-lg font-bold mb-2 ${
            plan.name === 'Basic Plan' ? 'text-emerald-500' :
            plan.name === 'Elite Plan' ? 'text-blue-500' :
            plan.name === 'Premium Plan' ? 'text-purple-500' :
            'text-amber-500'
          }`}>{plan.name}</h3>
          
          <div className="flex items-end gap-1 mb-6">
            <span className="text-2xl font-bold text-slate-800">₹{plan.price}</span>
            <span className="text-slate-500 text-sm font-medium mb-1">/ {plan.duration}</span>
          </div>

          <div className="space-y-3 flex-grow mb-8">
            {plan.features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${
                  plan.name === 'Basic Plan' ? 'text-emerald-500' :
                  plan.name === 'Elite Plan' ? 'text-blue-500' :
                  plan.name === 'Premium Plan' ? 'text-purple-500' :
                  'text-amber-500'
                }`} />
                <span className="text-sm text-slate-600 leading-tight">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">{plan.activeSubscriptions} <span className="font-normal text-slate-500">Active Subscriptions</span></span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubscriptionPlansOverview;
