import { Tag, Tooltip } from "antd";
import type { TaxBreakdown } from "../../hooks/useTaxedPricing";

/**
 * Reusable component — shows each tax line and the final total.
 * Used in both TimeSlotItem and PricingPreview slot cards.
 */
interface TaxBreakdownDisplayProps {
  breakdown: TaxBreakdown;
  showBase?: boolean;
  compact?: boolean;
}

const TAG_COLORS: Record<string, string> = {
  CGST: "blue",
  SGST: "cyan",
  IGST: "geekblue",
  UTGST: "purple",
  GST: "orange",
  TCS: "gold",
  VAT: "volcano",
  SURCHARGE: "magenta",
  TDS: "red",
  PT: "lime",
};

const TaxBreakdownDisplay = ({
  breakdown,
  showBase = false,
  compact = false,
}: TaxBreakdownDisplayProps) => {
  if (!breakdown.hasTax) {
    return <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>No active tax</span>;
  }

  const indianTaxFromCode = (code: string) => code.split("_")[0];

  if (compact) {
    // Single-line version for TimeSlotItem
    return (
      <Tooltip
        title={
          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            {showBase && <div>Base: ₹{breakdown.basePrice.toFixed(2)}</div>}
            {breakdown.appliedTaxes.map((t) => (
              <div key={t.taxCode}>
                {t.taxCode} ({t.taxPercentage}%): +₹{t.taxAmount.toFixed(2)}
              </div>
            ))}
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.2)",
                paddingTop: 4,
                fontWeight: 600,
              }}
            >
              Total tax: +₹{breakdown.totalTaxAmount.toFixed(2)}
            </div>
          </div>
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: "help" }}>
          {breakdown.appliedTaxes.map((t) => (
            <Tag
              key={t.taxCode}
              color={TAG_COLORS[indianTaxFromCode(t.taxCode)] || "default"}
              style={{ fontSize: 11, margin: 0, fontFamily: "monospace" }}
            >
              {t.taxCode}
            </Tag>
          ))}
          <span style={{ color: "#d97706", fontWeight: 600, fontSize: 12 }}>
            +₹{breakdown.totalTaxAmount.toFixed(2)}
          </span>
        </div>
      </Tooltip>
    );
  }

  // Full version for PricingPreview
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {showBase && (
        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          Base: ₹{breakdown.basePrice.toFixed(2)}
        </span>
      )}
      {breakdown.appliedTaxes.map((t) => (
        <div key={t.taxCode} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Tag
            color={TAG_COLORS[indianTaxFromCode(t.taxCode)] || "default"}
            style={{ fontSize: 11, margin: 0, fontFamily: "monospace" }}
          >
            {t.taxCode}
          </Tag>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            {t.taxPercentage}%
          </span>
          <span style={{ fontSize: 12, color: "#d97706", fontWeight: 500 }}>
            +₹{t.taxAmount.toFixed(2)}
          </span>
        </div>
      ))}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderTop: "1px solid var(--color-border-tertiary)",
          paddingTop: 4,
          marginTop: 2,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Total tax:</span>
        <span style={{ fontSize: 12, color: "#d97706", fontWeight: 600 }}>
          +₹{breakdown.totalTaxAmount.toFixed(2)}
        </span>
      </div>
      <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 700 }}>
        ≈ ₹{breakdown.totalPrice.toFixed(2)} / km incl. tax
      </span>
    </div>
  );
};

export default TaxBreakdownDisplay;
