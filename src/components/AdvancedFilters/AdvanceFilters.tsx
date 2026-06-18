import React, { useState } from "react";
import {
  Collapse,
  Form,
  Row,
  Col,
  Select,
  Input,
  InputNumber,
  Radio,
  Button,
  DatePicker,
  Slider,
} from "antd";
import { FilterOutlined } from "@ant-design/icons";
import { Dayjs } from "dayjs";

const { Panel } = Collapse;
const { Option } = Select;

export interface FieldOption {
  value: string | boolean;
  label: string;
}

export interface FilterField {
  name: string;
  label: string;
  type: "input" | "select" | "radio" | "range" | "time" | "date" | "slider";
  options?: FieldOption[];
  minPlaceholder?: string;
  maxPlaceholder?: string;
  min?: number;
  max?: number;
  step?: number;
  mode?: "multiple" | "tags";
  defaultValue?: Dayjs;

  showTime?: boolean;
  timeFormat?: string;
  dateFormat?: string;
}

export interface FilterValues {
  [key: string]: any;
}

interface AdvancedFiltersProps {
  filterFields: FilterField[];
  applyFilters: (values: FilterValues) => void;
  initialValues?: FilterValues;
  isStandalone?: boolean;
  onClear?: () => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filterFields,
  applyFilters,
  onClear,
  isStandalone = false,
  //initialValues = {},
}) => {
  const [activeFilterPanel, setActiveFilterPanel] = useState<string[]>([]);
  const [filterForm] = Form.useForm();

  const handleClearAllFilters = () => {
    filterForm.resetFields();
    applyFilters(filterForm.getFieldsValue());
    if (onClear) onClear();
  };

  const onFilterValuesChange = (_changedValues: Record<string, any>, allValues: FilterValues) => {
    applyFilters(allValues);
  };

  const renderField = (field: FilterField) => {
    switch (field.type) {
      case "input":
        return <Input placeholder={`Enter ${field.label.toLowerCase()}`} />;
      case "select":
        return (
          <Select mode={field.mode ?? "tags"} placeholder={`Select ${field.label.toLowerCase()}`}>
            {field.options?.map((opt: FieldOption) => (
              <Option key={opt.value.toString()} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        );
      case "radio":
        return (
          <Radio.Group>
            {field.options?.map((opt: FieldOption) => (
              <Radio key={opt.value.toString()} value={opt.value}>
                {opt.label}
              </Radio>
            ))}
          </Radio.Group>
        );
      case "range":
        return (
          <Input.Group compact>
            <Form.Item name={`${field.name}Min`} noStyle>
              <InputNumber
                min={0}
                placeholder={field.minPlaceholder || "Min"}
                style={{ width: "50%" }}
              />
            </Form.Item>
            <Form.Item name={`${field.name}Max`} noStyle>
              <InputNumber
                min={0}
                placeholder={field.maxPlaceholder || "Max"}
                style={{ width: "50%" }}
              />
            </Form.Item>
          </Input.Group>
        );
      case "slider":
        return (
          <Form.Item name={field.name} noStyle>
            <Slider
              range
              min={field.min ?? 0}
              max={field.max ?? 100}
              step={field.step ?? 1}
              defaultValue={[field.min ?? 0, field.max ?? 100]}
            />
          </Form.Item>
        );
      case "time":
        return <DatePicker.TimePicker style={{ width: "100%" }} use12Hours format="hh:mm A" />;
      case "date":
        return (
          <DatePicker
            style={{ width: "100%" }}
            showTime={field.showTime ? { format: field.timeFormat ?? "hh:mm A" } : false}
            format={
              field.showTime
                ? `${field.dateFormat ?? "YYYY-MM-DD"} ${field.timeFormat ?? "hh:mm A"}`
                : (field.dateFormat ?? "YYYY-MM-DD")
            }
          />
        );

      default:
        return null;
    }
  };

  const computedInitialValues = React.useMemo(() => {
    const values: Record<string, any> = {};

    filterFields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        values[field.name] = field.defaultValue;
      }
    });

    return values;
  }, [filterFields]);

  // ✅ 2️⃣ APPLY defaults to form (THIS IS THE FIX)
  React.useEffect(() => {
    filterForm.setFieldsValue(computedInitialValues);
  }, [computedInitialValues, filterForm]);

  const FilterFormContent = (
    <Form
      form={filterForm}
      name="advanced_filters"
      onValuesChange={onFilterValuesChange}
      layout="vertical"
      initialValues={computedInitialValues}
    >
      <Row gutter={[16, 16]} align="bottom">
        {filterFields.map((field) => (
          <Col xs={24} sm={12} md={4} key={field.name}>
            <Form.Item
              name={field.type === "range" ? undefined : field.name}
              label={
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {field.label}
                </span>
              }
              style={{ marginBottom: 0 }}
            >
              {renderField(field)}
            </Form.Item>
          </Col>
        ))}
        {isStandalone && (
          <Col xs={24} sm={12} md={4}>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="link"
                size="small"
                onClick={handleClearAllFilters}
                danger
                className="font-black uppercase tracking-wider text-[10px] hover:text-rose-600 transition-colors h-[40px] flex items-center"
              >
                Clear Filters
              </Button>
            </Form.Item>
          </Col>
        )}
      </Row>
    </Form>
  );

  if (isStandalone) {
    return FilterFormContent;
  }

  return (
    <Collapse
      activeKey={activeFilterPanel}
      onChange={(key) => setActiveFilterPanel(Array.isArray(key) ? key : [key])}
      ghost
      size="small"
      expandIconPosition="end"
    >
      <Panel
        header={
          <div className="flex items-center gap-2">
            <FilterOutlined />
            <span
              style={{
                fontSize: "1rem",
                lineHeight: "1.5rem",
                fontWeight: 600,
              }}
            >
              Advanced Filters
            </span>
          </div>
        }
        key="advanced-filters"
        extra={
          <div className="flex items-center gap-2">
            <Button
              type="text"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAllFilters();
              }}
            >
              Clear All
            </Button>
          </div>
        }
      >
        {FilterFormContent}
      </Panel>
    </Collapse>
  );
};

export default AdvancedFilters;
