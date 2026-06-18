import React from "react";
import {
  IoPersonOutline,
  IoLocationOutline,
  IoTimerOutline,
  // IoCarOutline,
} from "react-icons/io5";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  trip?: any;
};

const DriverInvoice: React.FC<Props> = ({ isOpen, onClose, trip }) => {
  if (!isOpen || !trip) return null;

  const commission = trip.total_fare * 0.2; // 20% platform fee
  const payout = trip.total_fare - commission;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-4 text-gray-400 hover:text-gray-700 text-xl"
        >
          ✕
        </button>

        {/* Header */}
        <h1 className="text-2xl font-bold text-center mb-1">Driver Payout</h1>
        <p className="text-gray-500 text-center text-sm mb-6">Ride Earnings Summary</p>

        {/* Customer Info */}
        <div className="mb-5">
          <h2 className="font-semibold mb-2 text-gray-700">Customer</h2>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border">
            <IoPersonOutline size={40} className="text-gray-600" />
            <div className="text-sm">
              <p className="font-semibold">{trip.user_name}</p>
              <p className="text-gray-500 text-sm">{trip.user_phone}</p>
            </div>
          </div>
        </div>

        {/* Ride Details */}
        <div className="mb-5">
          <h2 className="font-semibold mb-2 text-gray-700">Ride Details</h2>
          <div className="bg-gray-50 p-4 rounded-xl space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <IoLocationOutline size={20} className="text-green-500" />
              <p>{trip.pickup_address}</p>
            </div>
            <div className="flex items-center gap-3">
              <IoLocationOutline size={20} className="text-red-500 rotate-180" />
              <p>{trip.drop_address}</p>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <IoTimerOutline /> {trip.distance_km} • {trip.trip_duration_minutes}
            </div>
          </div>
        </div>

        {/* Payout Summary */}
        <div className="mb-5">
          <h2 className="font-semibold mb-2 text-gray-700">Payout Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Ride Fare</span>
              <span>₹{trip.total_fare.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>Platform Commission (20%)</span>
              <span>-₹{commission.toFixed(2)}</span>
            </div>
            <div className="border-t my-2" />
            <div className="flex justify-between font-semibold text-lg text-gray-800">
              <span>Payout</span>
              <span>₹{payout.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center">
          Payout will be settled in your bank within 24 hours.
        </p>
      </div>
    </div>
  );
};

export default DriverInvoice;
