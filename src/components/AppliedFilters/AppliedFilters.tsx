import { Card, Tag } from "antd";
import { format } from "date-fns-tz";
import React from "react";

export type FilterValue = string | number | Date | null | Array<string | number>;
import { capitalize } from "../../utilities/capitalize";
export interface AppliedFiltersProps<T extends object> {
  filters: T;
  setFilters: React.Dispatch<React.SetStateAction<T>>;
  labels?: Partial<Record<keyof T, string>>;
  colors?: Partial<Record<keyof T, string>>;
}

const AppliedFilters = <T extends object>({
  filters,
  setFilters,
  labels = {},
  colors = {},
}: AppliedFiltersProps<T>) => {
  const handleRemove = (key: keyof T, valueToRemove?: string | number) => {
    const current = filters[key] as any;

    if (Array.isArray(current)) {
      setFilters({
        ...filters,
        [key]: current.filter((v) => v !== valueToRemove),
      });
    } else {
      setFilters({ ...filters, [key]: null });
    }
  };

  const hasFilters = Object.values(filters).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== null,
  );

  if (!hasFilters) return null;

  return (
    // <Badge.Ribbon text="Applied Filters" >
    <Card size="small" className="w-full">
      <div className="w-full p-4 flex items-center gap-2 flex-wrap">
        {Object.entries(filters).map(([key, value]) => {
          if (!value) return null;

          const tagColor = colors[key as keyof T] || "blue";
          const label = labels[key as keyof T] || key;

          if (Array.isArray(value)) {
            return value.map((item) => (
              <Tag
                key={`${key}-${item}`}
                closable
                color={tagColor}
                onClose={() => handleRemove(key as keyof T, item)}
              >
                {`${capitalize(label)}: ${capitalize(item)}`}
              </Tag>
            ));
          }

          const displayValue =
            value instanceof Date
              ? format(value, "MM/dd/yyyy", {
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                })
              : String(value);
          return (
            <Tag key={key} closable color={tagColor} onClose={() => handleRemove(key as keyof T)}>
              {`${capitalize(label)}: ${capitalize(displayValue)}`}
            </Tag>
          );
        })}
      </div>
    </Card>
  );
};

export default AppliedFilters;
