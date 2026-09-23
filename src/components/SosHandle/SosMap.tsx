import React from 'react';
import { IoCarSportSharp } from "react-icons/io5";

const SosMap: React.FC = () => {
  return (
    <div className="relative w-full h-full min-h-[300px] bg-[#e5e3df] dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-inner">
      {/* Fake Map Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Fake Roads */}
      <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
        <path d="M0,50 Q150,150 200,400" stroke="#94a3b8" strokeWidth="8" fill="none" />
        <path d="M100,0 Q250,200 500,150" stroke="#94a3b8" strokeWidth="6" fill="none" />
        <path d="M300,400 Q350,250 500,300" stroke="#94a3b8" strokeWidth="12" fill="none" />
        <path d="M0,250 Q250,250 500,400" stroke="#94a3b8" strokeWidth="4" fill="none" />
      </svg>
      
      {/* Map Labels */}
      <span className="absolute top-[30%] left-[20%] text-gray-500 font-semibold text-[13px] opacity-70">Vadapalani</span>
      <span className="absolute top-[50%] left-[45%] text-gray-500 font-semibold text-[13px] opacity-70">Nungambakkam</span>
      <span className="absolute bottom-[20%] left-[35%] text-gray-500 font-semibold text-[13px] opacity-70">Velachery</span>
      <span className="absolute top-[40%] right-[15%] text-gray-500 font-semibold text-[13px] opacity-70">T.Nagar</span>
      <span className="absolute bottom-[35%] right-[25%] text-gray-500 font-semibold text-[13px] opacity-70">Adyar</span>

      {/* Map Controls */}
      <div className="absolute right-4 bottom-4 flex flex-col gap-2">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col">
          <button className="w-8 h-8 flex items-center justify-center font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 border-b border-gray-100 dark:border-slate-700">+</button>
          <button className="w-8 h-8 flex items-center justify-center font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800">-</button>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800">
          <div className="w-4 h-4 border-2 border-gray-500 dark:border-slate-400 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-gray-500 dark:bg-slate-400 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* SOS Marker */}
      <div className="absolute top-[40%] left-[30%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20">
        <div className="absolute w-32 h-32 bg-red-500 rounded-full opacity-20 animate-ping"></div>
        <div className="absolute w-24 h-24 bg-red-500 rounded-full opacity-30 animate-pulse"></div>
        <div className="relative">
          <div className="bg-red-500 rounded-full w-14 h-14 flex items-center justify-center text-white font-bold text-[14px] shadow-lg shadow-red-500/50 z-10 relative">
            SOS
            {/* Pointer triangle */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500"></div>
          </div>
          {/* Small dot underneath */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-700 rounded-full shadow-md z-0"></div>
        </div>
      </div>

      {/* Cars */}
      <div className="absolute top-[25%] left-[45%] -rotate-45 z-10 p-1 bg-white dark:bg-slate-700 rounded-full shadow-md">
        <IoCarSportSharp className="text-gray-700 dark:text-slate-300 text-lg" />
      </div>
      <div className="absolute top-[55%] left-[15%] rotate-45 z-10 p-1 bg-white dark:bg-slate-700 rounded-full shadow-md">
        <IoCarSportSharp className="text-gray-700 dark:text-slate-300 text-lg" />
      </div>
      <div className="absolute bottom-[30%] left-[35%] -rotate-12 z-10 p-1 bg-white dark:bg-slate-700 rounded-full shadow-md">
        <IoCarSportSharp className="text-gray-700 dark:text-slate-300 text-lg" />
      </div>
      <div className="absolute top-[50%] right-[30%] rotate-90 z-10 p-1 bg-white dark:bg-slate-700 rounded-full shadow-md">
        <IoCarSportSharp className="text-gray-700 dark:text-slate-300 text-lg" />
      </div>

    </div>
  );
};

export default SosMap;
