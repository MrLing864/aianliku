import { industries, scenarios } from "../../src/lib/catalog";

export const CATALOG_INDUSTRIES = industries;
export const CATALOG_SCENARIOS = scenarios;

const industryAliasMap: Record<string, string> = {
  工业: "manufacturing",
  制造业: "manufacturing",
  制造: "manufacturing",
  汽车: "manufacturing",
  能源: "energy",
  电力: "energy",
  金融: "finance",
  银行: "finance",
  证券: "finance",
  保险: "finance",
  出行: "logistics",
  交通: "logistics",
  物流: "logistics",
  运输: "logistics",
  建筑地产: "real-estate",
  建筑: "real-estate",
  房地产: "real-estate",
  地产: "real-estate",
  文旅: "entertainment-media",
  文化: "entertainment-media",
  旅游: "entertainment-media",
  传媒: "entertainment-media",
  游戏: "entertainment-media",
  医疗: "healthcare",
  医药: "healthcare",
  健康: "healthcare",
  教育: "education",
  零售: "retail",
  电商: "retail",
  农业: "agriculture",
  政务: "government",
  政府: "government",
  通信: "telecommunications",
  电信: "telecommunications",
  企服: "ai-native",
  企业服务: "ai-native",
  互联网: "ai-native",
  科技: "ai-native",
  其他: "ai-native",
};

export function mapIndustry(name?: string) {
  if (!name) return CATALOG_INDUSTRIES[0];
  const id = industryAliasMap[name.trim()];
  if (id) {
    const found = CATALOG_INDUSTRIES.find((i) => i.id === id);
    if (found) return found;
  }
  // fallback by substring
  for (const alias of Object.keys(industryAliasMap)) {
    if (name.includes(alias)) {
      const found = CATALOG_INDUSTRIES.find((i) => i.id === industryAliasMap[alias]);
      if (found) return found;
    }
  }
  return CATALOG_INDUSTRIES[0];
}

export function mapScenario(name?: string) {
  if (!name) return CATALOG_SCENARIOS[0];
  const target = name.trim();
  const found = CATALOG_SCENARIOS.find(
    (s) => s.name === target || s.id === target || target.includes(s.name) || s.name.includes(target)
  );
  if (found) return found;
  return CATALOG_SCENARIOS[0];
}

export function pickScenarios(names: string[]) {
  return names.map(mapScenario).filter(Boolean);
}
