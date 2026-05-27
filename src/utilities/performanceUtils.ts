export interface PerformanceMetrics {
  completionRate: number;
  acceptanceRate: number;
  rating: number;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  rejectedTrips: number;
  totalEarnings: number;
  onlineMinutes: number;
}

/**
 * Calculates performance metrics from a list of ride objects.
 * 
 * @param rides Array of ride objects from the API
 * @returns Object with calculated rates and counts
 */
export const calculatePerformanceMetrics = (rides: any[]): PerformanceMetrics => {
  if (!Array.isArray(rides) || rides.length === 0) {
    return {
      completionRate: 0,
      acceptanceRate: 0,
      rating: 0,
      totalTrips: 0,
      completedTrips: 0,
      cancelledTrips: 0,
      rejectedTrips: 0,
      totalEarnings: 0,
      onlineMinutes: 0,
    };
  }

  const totalTrips = rides.length;
  
  const completedRides = rides.filter(r => 
    r.status?.toUpperCase() === 'COMPLETED' || 
    r.trip_status?.toUpperCase() === 'COMPLETED'
  );
  
  const completedTrips = completedRides.length;

  const cancelledTrips = rides.filter(r => 
    r.status?.toUpperCase() === 'CANCELLED' || 
    r.trip_status?.toUpperCase() === 'CANCELLED'
  ).length;

  // Accepted Trips: Anything that wasn't outright rejected or expired at REQUESTED state.
  const acceptedTrips = rides.filter(r => 
    ['ACCEPTED', 'ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED', 'DESTINATION_REACHED'].includes((r.status || r.trip_status || '').toUpperCase())
  ).length;

  // Acceptance Rate: (Accepted / Total)
  const acceptanceRate = totalTrips > 0 ? (acceptedTrips / totalTrips) * 100 : 0;

  // Completion Rate: (Completed / Accepted)
  const completionRate = acceptedTrips > 0 ? (completedTrips / acceptedTrips) * 100 : 0;

  // Average Rating: (Sum of Ratings / Rated Trips)
  const ratedRides = rides.filter(r => {
    const rval = parseFloat(r.rating || r.user_rating || r.trip_rating || r.passenger_rating || 0);
    return !isNaN(rval) && rval > 0;
  });
  
  const totalRating = ratedRides.reduce((sum, r) => {
    const val = parseFloat(r.rating || r.user_rating || r.trip_rating || r.passenger_rating || 0);
    return sum + val;
  }, 0);
  
  const rating = ratedRides.length > 0 ? totalRating / ratedRides.length : 0;

  // Total Earnings: Sum of amount from completed rides
  const totalEarnings = completedRides.reduce((sum, r) => {
    const amt = typeof r.amount === 'string' ? parseFloat(r.amount) : (r.amount || r.fare || 0);
    return sum + amt;
  }, 0);

  // Online Time (Simplified from trips): Sum of trip_duration_minutes + waiting_time_minutes
  const onlineMinutes = rides.reduce((sum, r) => {
    const duration = r.trip_duration_minutes || r.duration || 0;
    const waiting = r.waiting_time_minutes || 0;
    const wasActive = ['STARTED', 'COMPLETED', 'ARRIVED', 'DESTINATION_REACHED'].includes((r.status || r.trip_status || '').toUpperCase());
    return wasActive ? sum + (duration + waiting) : sum;
  }, 0);

  return {
    completionRate: Math.round(completionRate),
    acceptanceRate: Math.round(acceptanceRate),
    rating: parseFloat(rating.toFixed(1)),
    totalTrips,
    completedTrips,
    cancelledTrips,
    rejectedTrips: totalTrips - acceptedTrips,
    totalEarnings,
    onlineMinutes,
  };
};
