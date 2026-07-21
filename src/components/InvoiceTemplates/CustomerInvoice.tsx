import React from "react";
import { IoLocationOutline, IoTimerOutline, IoPersonOutline, IoCarOutline } from "react-icons/io5";
import type { TripDetailsType } from "../../store/slices/tripSlice";

// type TripInvoice = {
//   pickup: string;
//   drop: string;
//   distance: string;
//   duration: string;

//   baseFare: number;
//   distanceFare?: number;
//   timeFare?: number;
//   discount: number;
//   fare: number;

//   driverName: string;
//   driverPhone: string;
//   carNumber: string;
//   carType: string;
// };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  trip?: TripDetailsType;
};

const CustomerInvoice: React.FC<Props> = ({ isOpen, onClose, trip }) => {
  if (!isOpen || !trip) return null;

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
        <h1 className="text-2xl font-bold text-center mb-1">Ride Receipt</h1>
        <p className="text-gray-500 text-center text-sm mb-6">Thank you for riding with T2Drive</p>

        {/* Route */}
        <div className="bg-gray-50 p-4 rounded-xl mb-5">
          <div className="flex items-center gap-2 mb-3">
            <IoLocationOutline size={20} className="text-green-500" />
            <div>
              <p className="font-semibold text-gray-700">Pickup</p>
              <p className="text-gray-500 text-sm">{trip.pickup_address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <IoLocationOutline size={20} className="text-red-500 rotate-180" />
            <div>
              <p className="font-semibold text-gray-700">Drop</p>
              <p className="text-gray-500 text-sm">{trip.drop_address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <IoTimerOutline /> {trip.distance_km} • {trip.trip_duration_minutes}
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="mb-5">
          <h2 className="font-semibold mb-3 text-gray-700">Fare Breakdown</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Base Fare</span>
              <span>₹{trip.base_fare.toFixed(2)}</span>
            </div>
            {trip.distance_fare !== undefined && (
              <div className="flex justify-between">
                <span>Distance Fare</span>
                <span>₹{trip.distance_fare.toFixed(2)}</span>
              </div>
            )}
            {trip.time_fare !== undefined && (
              <div className="flex justify-between">
                <span>Time Fare</span>
                <span>₹{trip.time_fare.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-red-500">
              <span>Discount</span>
              <span>-₹{trip.discount.toFixed(2)}</span>
            </div>
            <div className="border-t my-2" />
            <div className="flex justify-between font-bold text-lg text-gray-800">
              <span>Total</span>
              <span>₹{trip.total_fare.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Driver Info */}
        <div className="mb-5">
          <h2 className="font-semibold mb-3 text-gray-700">Your Driver</h2>
          <div className="flex items-center gap-4 p-4 border rounded-xl bg-gray-50">
            <IoPersonOutline size={40} className="text-gray-600" />
            <div className="text-sm">
              <p className="font-semibold">{trip.driver_name}</p>
              <p className="text-gray-500 text-sm">📞 {trip.driver_phone}</p>
              <p className="flex items-center gap-1 text-gray-700 mt-1">
                <IoCarOutline /> {trip.car_number} • {trip.car_type}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center">
          For billing queries, contact support@t2drive.in
        </p>
      </div>
    </div>
  );
};

export default CustomerInvoice;
