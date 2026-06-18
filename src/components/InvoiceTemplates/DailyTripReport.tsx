import React from "react";
import { IoBarChartOutline } from "react-icons/io5";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const DailyTripReport: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="daily-report"
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative p-8 border">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold">VDrive - Daily Trip Report</h1>
          <p className="text-sm text-gray-500">Prepared By: Operations</p>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <IoBarChartOutline className="text-2xl text-indigo-600" />
          <h2 className="text-lg font-medium">Report Date: 03 Nov 2025</h2>
        </div>

        <div className="border-t" />

        {/* Summary Section */}
        <div className="py-4 text-sm space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Trips</span>
            <span className="font-semibold">186</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Active Drivers</span>
            <span className="font-semibold">92</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Gross Fare</span>
            <span className="font-semibold">₹42,650.00</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Platform Commission</span>
            <span className="font-semibold">₹8,530.00</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Driver Payouts</span>
            <span className="font-semibold">₹34,120.00</span>
          </div>
        </div>

        <div className="border-t my-4" />

        {/* Trip Table */}
        <h3 className="text-sm font-semibold mb-3">Trip Details</h3>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between">
            <div>
              <p className="font-medium">Trip ID: VD-001</p>
              <p className="text-gray-500">Ramesh K → Priya S</p>
              <p className="text-gray-500">Koramangala → MG Road</p>
            </div>
            <div className="text-right">
              <p>Fare: ₹210.00</p>
              <p className="text-red-500 text-xs">Commission: ₹42.00</p>
              <p className="font-semibold">Payout: ₹168.00</p>
            </div>
          </div>

          <div className="flex justify-between">
            <div>
              <p className="font-medium">Trip ID: VD-002</p>
              <p className="text-gray-500">Anita L → John D</p>
              <p className="text-gray-500">Indiranagar → Silk Board</p>
            </div>
            <div className="text-right">
              <p>Fare: ₹230.00</p>
              <p className="text-red-500 text-xs">Commission: ₹46.00</p>
              <p className="font-semibold">Payout: ₹184.00</p>
            </div>
          </div>
        </div>

        <div className="border-t mt-6" />

        <p className="text-center text-gray-500 text-sm mt-4 mb-2">End of Daily Report</p>
      </div>
    </div>
  );
};

export default DailyTripReport;
