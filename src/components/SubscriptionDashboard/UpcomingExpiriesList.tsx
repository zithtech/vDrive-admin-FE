import React from "react";
import { Avatar } from "antd";
import { ArrowRight } from "lucide-react";

interface UpcomingExpiriesListProps {
  data: {
    id: string;
    name: string;
    vehicle: string;
    plan: string;
    daysLeft: number;
  }[];
}

const UpcomingExpiriesList: React.FC<UpcomingExpiriesListProps> = ({ data }) => {
  return (
    <div className="p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800">Upcoming Expiries</h2>
        <a href="#" className="text-blue-600 text-sm font-medium hover:text-blue-700">View All</a>
      </div>

      <div className="flex-grow space-y-4 overflow-y-auto pr-1">
        {data.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.name}`} size={36} className="bg-slate-100" />
              <div>
                <p className="text-sm font-bold text-slate-800 leading-tight">{item.name}</p>
                <p className="text-xs text-slate-500 font-medium">{item.vehicle}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-700 leading-tight">{item.plan}</p>
              <p className="text-xs text-red-500 font-medium mt-0.5">Expires in {item.daysLeft} days</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
        <button className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center justify-center w-full gap-1">
          View All Expiring Subscriptions <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default UpcomingExpiriesList;
