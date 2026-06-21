import React, { useEffect, useState } from "react";
import { Button, Table, Space, Card, Tag, Modal } from "antd";
import { DownloadOutlined, EyeOutlined, EditOutlined, LoadingOutlined } from "@ant-design/icons";
import { IoAdd } from "react-icons/io5";
import TitleBar from "../components/TitleBarCommon/TitleBar";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchPricingFareRules, setPage, setPageSize } from "../store/slices/pricingFareRulesSlice";
import type { PricingFareRule } from "../store/slices/pricingFareRulesSlice";
import type { ColumnsType } from "antd/es/table";
import PricingPreview from "../components/DriverPricing/PricingPreview";
import dayjs from "dayjs";
import { useHasPermission } from "../hooks/usePermission";

// Helper to transform PricingFareRule time_slots to PricingPreview format
const transformSlotsForPreview = (rule: PricingFareRule) => {
  const transformed: any = {
    "normal-driver": [],
    "premium-driver": [],
    "elite-driver": [],
  };

  if (rule.time_slots) {
    rule.time_slots.forEach((slot, index) => {
      if (transformed[slot.driver_types]) {
        transformed[slot.driver_types].push({
          id: index + 1,
          day: slot.day,
          timeRange: [dayjs(slot.from_time, "HH:mm:ss"), dayjs(slot.to_time, "HH:mm:ss")],
          perKmRate: Number(slot.per_km_rate),
          perHourRate: Number(slot.per_hour_rate),
        });
      }
    });
  }
  return transformed;
};

const PricingAndFareRules: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [previewRule, setPreviewRule] = useState<PricingFareRule | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const canCreatePricing = useHasPermission("pricing", "create");
  const canUpdatePricing = useHasPermission("pricing", "update");

  // Redux state
  const { fareRules, isLoading, total, currentPage, pageSize } = useAppSelector(
    (state) => state.pricingFareRules,
  );

  // Fetch data on mount
  useEffect(() => {
    dispatch(
      fetchPricingFareRules({
        page: currentPage,
        limit: pageSize,
        include_time_slots: true,
      }),
    );

    return () => {
      // dispatch(clearFareRules());
    };
  }, [dispatch, currentPage, pageSize]);

  // Handle pagination change
  const handleTableChange = (pagination: any) => {
    if (pagination.current !== currentPage) {
      dispatch(setPage(pagination.current));
    }
    if (pagination.pageSize !== pageSize) {
      dispatch(setPageSize(pagination.pageSize));
    }
  };

  const handleEdit = (record: PricingFareRule) => {
    navigate(`/PricingAndFareRules/pricing/${record.id}`);
  };

  const handleView = (record: PricingFareRule) => {
    setPreviewRule(record);
    setIsPreviewOpen(true);
  };

  // Column definitions
  const columns: ColumnsType<PricingFareRule> = [
    {
      title: "Country",
      dataIndex: "country_id", // Should probably resolve name
      key: "country_name",
      width: 120,
      render: () => "India", // Placeholder
    },
    {
      title: "State",
      dataIndex: "state_id", // Should probably resolve name
      key: "state_name",
      width: 120,
      render: (_, record) => record.state_name, // Placeholder
    },
    {
      title: "District", // Updated label based on schema confusion
      dataIndex: "district_name", // Displaying City Name for "District" column
      key: "district_name",
      width: 150,
      ellipsis: true,
      render: (_, record) => record.district_name || "All",
    },
    {
      title: "Area",
      dataIndex: "area_name", // Displaying Area Name
      key: "area_name",
      width: 150,
      ellipsis: true,
      render: (text) => text || "All",
    },
    {
      title: "Hotspot Name",
      dataIndex: "hotspot_name",
      key: "hotspot_name",
      width: 150,
      ellipsis: true,
      render: (text) => text || "-",
    },
    {
      title: "Is Hotspot",
      dataIndex: "is_hotspot",
      key: "is_hotspot",
      width: 120,
      align: "center",
      render: (value: boolean) => (
        <Tag color={value ? "blue" : "default"}>{value ? "Yes" : "No"}</Tag>
      ),
    },
    {
      title: "Price / KM",
      dataIndex: "per_km_price",
      key: "per_km_price",
      width: 110,
      align: "right",
      render: (value: number | string) => `₹${Number(value).toFixed(2)}/km`,
    },
    {
      title: "Price / Hr",
      dataIndex: "per_hour_price",
      key: "per_hour_price",
      width: 110,
      align: "right",
      render: (value: number | string) => `₹${Number(value || 0).toFixed(2)}/hr`,
    },
    {
      title: "Min Fare",
      dataIndex: "minimum_fare",
      key: "minimum_fare",
      width: 100,
      align: "right",
      render: (value: number | string) => `₹${Number(value || 0).toFixed(2)}`,
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            View
          </Button>
          {canUpdatePricing && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (location.pathname !== "/PricingAndFareRules") {
    return <Outlet />;
  }

  return (
    <TitleBar
      title="Driver Price Management"
      description="Advanced admin interface for pricing control"
      extraContent={
        <div className="flex items-center gap-2">
          {canCreatePricing && (
            <div>
              <Button
                type="primary"
                icon={<IoAdd />}
                onClick={() => navigate("/PricingAndFareRules/pricing")}
              >
                Add Pricing
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className="w-full h-full overflow-y-auto">
        <Card
          title="Pricing & Fare Rules"
          extra={
            <Space>
              <Button icon={<DownloadOutlined />} onClick={() => {}}>
                CSV
              </Button>
              <Button icon={<DownloadOutlined />} onClick={() => {}}>
                Excel
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={fareRules}
            loading={{
              spinning: isLoading,
              indicator: <LoadingOutlined style={{ fontSize: 48 }} spin />,
              tip: "Loading pricing rules...",
            }}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              pageSizeOptions: ["10", "20", "50", "100"],
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
            size="middle"
          />
        </Card>

        {/* Preview Modal */}
        <Modal
          title="Pricing Rule Preview"
          open={isPreviewOpen}
          onCancel={() => setIsPreviewOpen(false)}
          footer={null}
          width={800}
        >
          {previewRule && (
            <div className="max-h-[70vh] overflow-y-auto">
              {/* Reuse existing Preview Component */}
              <PricingPreview
                country={previewRule.country_name || ""}
                state={previewRule.state_name || ""}
                district={previewRule.district_name || ""}
                area={previewRule.area_name || ""}
                pincode={previewRule.pincode || ""}
                perKmPrice={Number(previewRule.per_km_price)}
                perHourPrice={Number(previewRule.per_hour_price) || 0}
                minimumFare={Number(previewRule.minimum_fare) || 0}
                oneWayReturnPct={Number(previewRule.one_way_return_pct) || 0}
                hotspotEnabled={previewRule.is_hotspot}
                hotspotId={previewRule.hotspot_name || ""}
                multiplier={Number(previewRule.multiplier || 1)}
                timeSlots={transformSlotsForPreview(previewRule)}
                extraKmCheckpoints={(previewRule.extra_km_checkpoints ?? [])
                  .slice()
                  .sort((a: any, b: any) => a.from_km - b.from_km)
                  .map((c: any, i: number) => ({
                    uid: i,
                    from_km: Number(c.from_km),
                    price: Number(c.price),
                  }))}
              />
            </div>
          )}
        </Modal>
      </div>
    </TitleBar>
  );
};

export default PricingAndFareRules;
