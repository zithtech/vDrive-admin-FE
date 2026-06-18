import { Button, DatePicker, Select, Row, Col, Input } from "antd";
import { useState, useEffect } from "react";

export type FilterFieldType = "select" | "date";

export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  options?: { label: string; value: string }[];
  mode?: "multiple" | "tags";
}

interface FilterProps<T extends Record<string, any>> {
  fields: FilterField[];
  initialValues?: T;
  onChange: (filters: T) => void;
}

const Filter = <T extends Record<string, any>>({
  fields,
  initialValues = {} as T,
  onChange,
}: FilterProps<T>) => {
  const [localFilters, setLocalFilters] = useState<T>(initialValues);

  useEffect(() => {
    onChange(localFilters);
  }, [localFilters, onChange]);

  const handleFilterChange = (key: keyof T, value: any) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    const resetValues = fields.reduce((acc, field) => {
      acc[field.key as keyof T] = (field.type === "select" ? [] : null) as T[keyof T];
      return acc;
    }, {} as T);
    setLocalFilters(resetValues);
  };

  return (
    <Row gutter={[16, 16]} align="bottom" justify="end" className="my-4">
      {fields.map((field) => (
        <Col xs={24} sm={12} md={6} lg={5} key={field.key}>
          {field.type === "select" ? (
            <Select
              style={{ width: "100%" }}
              allowClear
              mode={field.mode || "multiple"}
              value={localFilters[field.key as keyof T]}
              maxTagCount="responsive"
              options={field.options}
              onChange={(value) => handleFilterChange(field.key as keyof T, value)}
              placeholder={field.label}
            />
          ) : field.type === "date" ? (
            <DatePicker
              style={{ width: "100%" }}
              value={localFilters[field.key as keyof T]}
              onChange={(date: Date | null) => handleFilterChange(field.key as keyof T, date)}
              placeholder={field.label}
            />
          ) : (
            <Input
              style={{ width: "100%" }}
              value={localFilters[field.key as keyof T] || ""}
              onChange={(e) => handleFilterChange(field.key as keyof T, e.target.value)}
              placeholder={field.label}
              allowClear
            />
          )}
        </Col>
      ))}
      <Col>
        <Button onClick={handleReset}>Reset</Button>
      </Col>
    </Row>
  );
};

export default Filter;
