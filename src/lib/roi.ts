export interface RoiInputs {
  investment: number;
  monthlyCost: number;
  monthlySaving: number;
}

export const ROI_MAX_AMOUNT = 1_000_000_000;

export function analyzeRoiInput(input: RoiInputs) {
  const warnings: string[] = [];
  if (input.investment === 0 && input.monthlySaving > 0) {
    warnings.push("一次性投入为 0，但月度节省大于 0");
  }
  if (input.investment >= 100_000_000)
    warnings.push("一次性投入达到 1 亿元，请确认没有把万元当成元重复换算");
  if (input.monthlyCost >= 100_000_000)
    warnings.push("月运行成本达到 1 亿元，请确认金额单位与统计周期");
  if (input.monthlySaving >= 100_000_000)
    warnings.push("月度节省达到 1 亿元，请确认金额单位与统计周期");

  const net = input.monthlySaving - input.monthlyCost;
  if (input.investment > 0 && net > 0 && input.investment / net < 0.25) {
    warnings.push("简单回收期短于约一周，可能存在单位、周期或数量级错误");
  }
  return warnings;
}

export function calculatePaybackMonths(input: RoiInputs) {
  const net = input.monthlySaving - input.monthlyCost;
  return net > 0 && input.investment >= 0 ? input.investment / net : null;
}
