import React, { useEffect, useState, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Typography, Select, Spin } from "antd";
import dayjs from "dayjs";
import axiosIns from "../../api/axios";

interface ChartDataItem {
  name: string;
  rides: number;
}

const defaultData: ChartDataItem[] = [
  { name: "Mon", rides: 0 },
  { name: "Tue", rides: 0 },
  { name: "Wed", rides: 0 },
  { name: "Thu", rides: 0 },
  { name: "Fri", rides: 0 },
  { name: "Sat", rides: 0 },
  { name: "Sun", rides: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl flex flex-col items-center">
        <span className="text-gray-500 text-xs font-semibold mb-1">
          {label}
        </span>
        <span className="text-gray-400 text-xs">
          Rides
        </span>
        <span className="text-lg font-bold text-gray-800">
          {payload[0].value}
        </span>
      </div>
    );
  }
  return null;
};

const RidesOverviewChart: React.FC = () => {
  const [period, setPeriod] = useState<string>("this_week");
  const [chartData, setChartData] = useState<ChartDataItem[]>(defaultData);
  const [loading, setLoading] = useState(false);

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    try {
      let startDate: string;
      let endDate: string;

      if (period === "this_week") {
        startDate = dayjs().startOf("week").format("YYYY-MM-DD");
        endDate = dayjs().endOf("week").format("YYYY-MM-DD");
      } else {
        startDate = dayjs().subtract(1, "week").startOf("week").format("YYYY-MM-DD");
        endDate = dayjs().subtract(1, "week").endOf("week").format("YYYY-MM-DD");
      }

      const response = await axiosIns.get("/api/drivers/dashboard-stats/rides-overview", {
        params: { startDate, endDate },
      });

      if (response.data.success && response.data.data?.chartData) {
        setChartData(response.data.data.chartData);
      } else {
        setChartData(defaultData);
      }
    } catch (error) {
      console.error("Failed to fetch rides overview:", error);
      setChartData(defaultData);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  const maxRides = Math.max(...chartData.map((d) => d.rides), 100);
  const yMax = Math.ceil(maxRides / 100) * 100;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-slate-700 flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-3">
        <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold">
          Rides Overview
        </Typography.Title>
        <Select
          value={period}
          onChange={(val) => setPeriod(val)}
          variant="borderless"
          className="bg-gray-50 dark:bg-slate-700 rounded-lg"
          options={[
            { value: "this_week", label: "This Week" },
            { value: "last_week", label: "Last Week" },
          ]}
        />
      </div>
      <div className="flex-1 w-full min-h-0 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-800/60 z-10 rounded-lg">
            <Spin size="small" />
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              domain={[0, yMax]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: "5 5" }} />
            <Line
              type="monotone"
              dataKey="rides"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#3b82f6" }}
              activeDot={{ r: 6, strokeWidth: 0, fill: "#3b82f6" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RidesOverviewChart;
