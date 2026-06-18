import { useMemo } from "react";
import { useAppSelector } from "../store/hooks";
import type { Tax } from "../store/slices/taxSlice";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppliedTax {
  taxCode: string;
  taxName: string;
  taxPercentage: number;
  taxAmount: number;
}

export interface TaxBreakdown {
  basePrice: number;
  appliedTaxes: AppliedTax[]; // each tax line item
  totalTaxAmount: number; // sum of all tax amounts
  totalPrice: number; // basePrice + totalTaxAmount
  hasTax: boolean;
}

// ── Tax group rules ───────────────────────────────────────────────────────────
//
// In India these groups are mutually exclusive — only one from each group fires:
//
//  GST group  (pick ONE):  GST  |  CGST+SGST  |  IGST  |  CGST+UTGST
//  Deductions (separate):  TDS  — applied to driver payout, NOT to rider fare
//  Collections (separate): TCS  — applied to fare collected by platform
//  Add-ons    (stackable):  VAT, PT, SURCHARGE — stack on top of GST group
//
// The admin marks taxes isActive=true. This hook respects those flags and
// resolves conflicts automatically using the priority rules below.

// const GST_GROUP = ["GST", "CGST", "SGST", "IGST", "UTGST"];
const ADDONS = ["VAT", "SURCHARGE"]; // stack freely on top of GST
// const DEDUCTION = ["TDS"];              // driver-side, not applied to rider fare here
const COLLECTION = ["TCS"]; // platform-side collection tax

/**
 * From a list of active taxes, resolve which ones actually apply to a ride fare.
 * Enforces Indian GST mutual-exclusivity rules.
 */
function resolveApplicableTaxes(activeTaxes: Tax[]): Tax[] {
  const result: Tax[] = [];

  // ── Step 1: Resolve the GST group (mutually exclusive) ─────────────────────
  //
  // Priority order when multiple GST taxes are active simultaneously:
  //   1. CGST + SGST pair  (intra-state — most common for ride-hailing)
  //   2. CGST + UTGST pair (union territory rides)
  //   3. IGST alone        (inter-state)
  //   4. GST alone         (composite / fallback)

  const cgst = activeTaxes.find((t) => t.indian_tax === "CGST");
  const sgst = activeTaxes.find((t) => t.indian_tax === "SGST");
  const utgst = activeTaxes.find((t) => t.indian_tax === "UTGST");
  const igst = activeTaxes.find((t) => t.indian_tax === "IGST");
  const gst = activeTaxes.find((t) => t.indian_tax === "GST");

  if (cgst && sgst) {
    result.push(cgst, sgst); // intra-state pair
  } else if (cgst && utgst) {
    result.push(cgst, utgst); // union territory pair
  } else if (igst) {
    result.push(igst); // inter-state single
  } else if (gst) {
    result.push(gst); // composite/fallback single
  } else if (cgst) {
    result.push(cgst); // CGST alone (misconfigured but handle gracefully)
  } else if (sgst) {
    result.push(sgst);
  }

  // ── Step 2: Stack add-ons on top ────────────────────────────────────────────
  activeTaxes.filter((t) => ADDONS.includes(t.indian_tax)).forEach((t) => result.push(t));

  // ── Step 3: TCS on fare (platform collection — include in rider price) ──────
  activeTaxes.filter((t) => COLLECTION.includes(t.indian_tax)).forEach((t) => result.push(t));

  // TDS is intentionally excluded from rider fare calculation.
  // It is deducted from driver payout separately — use useDriverPayoutTax() for that.

  return result;
}

// ── Main hook ─────────────────────────────────────────────────────────────────

/**
 * Returns a breakdown of all applicable taxes on a given base price,
 * respecting Indian GST mutual-exclusivity rules.
 *
 * Usage:
 *   const breakdown = useTaxBreakdown(400);
 *   breakdown.totalPrice     // 440 (if GST_10 active)
 *   breakdown.appliedTaxes   // [{ taxCode: "GST_10", taxAmount: 40, ... }]
 */
export function useTaxBreakdown(basePrice: number): TaxBreakdown {
  const taxes = useAppSelector((state) => state.tax.taxes);

  return useMemo(() => {
    const activeTaxes = taxes.filter((t) => t.is_active);
    const applicable = resolveApplicableTaxes(activeTaxes);

    if (applicable.length === 0) {
      return {
        basePrice,
        appliedTaxes: [],
        totalTaxAmount: 0,
        totalPrice: basePrice,
        hasTax: false,
      };
    }

    const appliedTaxes: AppliedTax[] = applicable.map((t) => {
      const taxAmount = parseFloat(((basePrice * t.percentage) / 100).toFixed(2));
      return {
        taxCode: t.tax_code,
        taxName: t.tax_name,
        taxPercentage: t.percentage,
        taxAmount,
      };
    });

    const totalTaxAmount = parseFloat(
      appliedTaxes.reduce((sum, t) => sum + t.taxAmount, 0).toFixed(2),
    );

    return {
      basePrice,
      appliedTaxes,
      totalTaxAmount,
      totalPrice: parseFloat((basePrice + totalTaxAmount).toFixed(2)),
      hasTax: true,
    };
  }, [taxes, basePrice]);
}

/**
 * TDS hook — used separately for driver payout screen, not rider fare.
 * TDS is deducted from what the platform pays the driver.
 *
 * driverEarning = rideAmount - TDS amount
 */
export function useDriverPayoutTax(grossPayout: number): {
  tdsAmount: number;
  netPayout: number;
  tdsTax: Tax | null;
} {
  const taxes = useAppSelector((state) => state.tax.taxes);

  return useMemo(() => {
    const tdsTax = taxes.find((t) => t.is_active && t.indian_tax === "TDS") || null;
    if (!tdsTax) {
      return { tdsAmount: 0, netPayout: grossPayout, tdsTax: null };
    }
    const tdsAmount = parseFloat(((grossPayout * tdsTax.percentage) / 100).toFixed(2));
    return {
      tdsAmount,
      netPayout: parseFloat((grossPayout - tdsAmount).toFixed(2)),
      tdsTax,
    };
  }, [taxes, grossPayout]);
}

/**
 * Pure function version — use when you already have the tax list
 * (e.g. in onFinish before dispatching to backend).
 */
export function computeTaxBreakdown(basePrice: number, allTaxes: Tax[]): TaxBreakdown {
  const activeTaxes = allTaxes.filter((t) => t.is_active);
  const applicable = resolveApplicableTaxes(activeTaxes);

  if (applicable.length === 0) {
    return { basePrice, appliedTaxes: [], totalTaxAmount: 0, totalPrice: basePrice, hasTax: false };
  }

  const appliedTaxes: AppliedTax[] = applicable.map((t) => ({
    taxCode: t.tax_code,
    taxName: t.tax_name,
    taxPercentage: t.percentage,
    taxAmount: parseFloat(((basePrice * t.percentage) / 100).toFixed(2)),
  }));

  const totalTaxAmount = parseFloat(appliedTaxes.reduce((s, t) => s + t.taxAmount, 0).toFixed(2));

  return {
    basePrice,
    appliedTaxes,
    totalTaxAmount,
    totalPrice: parseFloat((basePrice + totalTaxAmount).toFixed(2)),
    hasTax: true,
  };
}
