import React from 'react';

const events = [
  { time: '10:24 AM', title: 'SOS Request', desc: 'Received poss button', status: 'completed', color: 'bg-red-500' },
  { time: '10:25 AM', title: 'Assigned to Team', desc: 'Team 1 (Ramesh Kumar) assigned', status: 'completed', color: 'bg-orange-500' },
  { time: '10:26 AM', title: 'Contacted Driver', desc: 'Driver responded', status: 'completed', color: 'bg-blue-500' },
  { time: '10:28 AM', title: 'On th Way', desc: 'Team is reaching', status: 'current', color: 'bg-blue-600' },
  { time: '10:28 AM', title: 'Team is reaching', desc: 'location', status: 'upcoming', color: 'border-2 border-blue-500 bg-white' },
];

const SosTimeline: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mt-3">
      <h3 className="font-bold text-slate-800 text-[15px] mb-6">SOS Request History <span className="text-gray-400 font-normal">(This Request)</span></h3>
      
      <div className="relative flex justify-between items-start w-full">
        {/* Connecting Line */}
        <div className="absolute top-1.5 left-2 right-2 h-[2px] bg-gray-200 z-0"></div>
        
        {events.map((event, index) => (
          <div key={index} className="relative z-10 flex flex-col items-start w-1/5 pr-4">
            {/* Dot */}
            <div className={`w-3.5 h-3.5 rounded-full ${event.color} shadow-sm ring-4 ring-white mb-3`}></div>
            
            {/* Content */}
            <span className="text-slate-800 font-semibold text-[13px] whitespace-nowrap mb-1">{event.time}</span>
            <span className="text-slate-800 font-semibold text-[13px] leading-tight mb-1">{event.title}</span>
            <span className="text-gray-500 text-[11px] leading-tight">{event.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SosTimeline;
