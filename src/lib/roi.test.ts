import { describe, expect, it } from "vitest";
import { analyzeRoiInput, calculatePaybackMonths } from "@/lib/roi";

describe("ROI input safeguards", () => {
  it("calculates only when monthly net saving is positive", () => {
    expect(
      calculatePaybackMonths({
        investment: 100_000,
        monthlyCost: 5_000,
        monthlySaving: 25_000,
      }),
    ).toBe(5);
    expect(
      calculatePaybackMonths({
        investment: 100_000,
        monthlyCost: 25_000,
        monthlySaving: 25_000,
      }),
    ).toBeNull();
  });

  it("flags likely unit or magnitude mistakes for confirmation", () => {
    expect(
      analyzeRoiInput({ investment: 0, monthlyCost: 0, monthlySaving: 10_000 }),
    ).toContain("一次性投入为 0，但月度节省大于 0");
    expect(
      analyzeRoiInput({
        investment: 100_000,
        monthlyCost: 1_000,
        monthlySaving: 1_000_000,
      }),
    ).toContain("简单回收期短于约一周，可能存在单位、周期或数量级错误");
  });

  it("does not flag ordinary SME assumptions", () => {
    expect(
      analyzeRoiInput({
        investment: 100_000,
        monthlyCost: 5_000,
        monthlySaving: 20_000,
      }),
    ).toEqual([]);
  });
});
