/**
 * 上市公司（A 股主板 / 创业板 / 科创板 / 港股）清单获取。
 *
 * 三层来源，统一去重后覆盖"全部已上市公司"：
 * 1) 内置清单 KNOWN_COMPANIES：头部/代表性上市公司（名称 + 官网主域名 + 行业 + 规模 + 板块 + 代码）。
 *    这是"直接去官网采集"的可靠来源（域名可信），覆盖 A 股与港股头部。
 * 2) 运行时从东方财富公开接口拉全量 A 股（沪市主板 + 深市主板 + 创业板 + 科创板 + 北交所），
 *    以及全量港股，补全剩余上市公司（代码 + 名称）。
 * 3) 全部名单按"企业名称"去重合并（A/H 两地上市视为同一家，优先保留有官网域名的条目）。
 *
 * 说明：东方财富接口不返回官网域名，全量名单仅用于搜索引擎发现（结果再按企业官网域名过滤）。
 */

export type Market = "A主板" | "创业板" | "科创板" | "北交所" | "港股";

export interface CompanyConfig {
  name: string;
  /** 官网主域名，如 "icbc.com.cn"；空字符串表示未知（仅用于搜索发现） */
  domain: string;
  /** 行业（catalog slug 或中文），用于 region 之外的归类 */
  sector: string;
  /** 规模提示：大型 / 中型 / 小型（影响 organization.size 文案） */
  scale: "大型" | "中型" | "小型";
  /** 上市板块（用于统计与去重溯源，可选，运行时从全量名单补全） */
  market?: Market;
  /** 股票代码（A 股如 600519；港股如 00700，可选） */
  code?: string;
}

/** 头部/代表性上市公司（含官网域名，可直接去官网采集）。A 股 + 港股头部。可继续补充。 */
export const KNOWN_COMPANIES: CompanyConfig[] = [
  { name: "工商银行", domain: "icbc.com.cn", sector: "金融", scale: "大型" },
  { name: "建设银行", domain: "ccb.com", sector: "金融", scale: "大型" },
  { name: "农业银行", domain: "abchina.com", sector: "金融", scale: "大型" },
  { name: "中国银行", domain: "boc.cn", sector: "金融", scale: "大型" },
  { name: "招商银行", domain: "cmbchina.com", sector: "金融", scale: "大型" },
  { name: "中国平安", domain: "pingan.com", sector: "金融", scale: "大型" },
  { name: "中国人寿", domain: "china-life.com.cn", sector: "金融", scale: "大型" },
  { name: "贵州茅台", domain: "moutaichina.com", sector: "食品饮料", scale: "大型" },
  { name: "五粮液", domain: "wuliangye.com.cn", sector: "食品饮料", scale: "大型" },
  { name: "宁德时代", domain: "catl.com", sector: "新能源", scale: "大型" },
  { name: "比亚迪", domain: "byd.com", sector: "汽车", scale: "大型" },
  { name: "中国石化", domain: "sinopec.com", sector: "能源化工", scale: "大型" },
  { name: "中国石油", domain: "cnpc.com.cn", sector: "能源化工", scale: "大型" },
  { name: "中国移动", domain: "10086.cn", sector: "通信", scale: "大型" },
  { name: "中国联通", domain: "chinaunicom.com.cn", sector: "通信", scale: "大型" },
  { name: "中国电信", domain: "chinatelecom.com.cn", sector: "通信", scale: "大型" },
  { name: "京东", domain: "jd.com", sector: "电商零售", scale: "大型" },
  { name: "美的集团", domain: "midea.com", sector: "家电制造", scale: "大型" },
  { name: "格力电器", domain: "gree.com", sector: "家电制造", scale: "大型" },
  { name: "海尔智家", domain: "haier.com", sector: "家电制造", scale: "大型" },
  { name: "三一重工", domain: "sany.com", sector: "工程机械", scale: "大型" },
  { name: "恒瑞医药", domain: "hengrui.com", sector: "医药", scale: "大型" },
  { name: "药明康德", domain: "wuxiapptec.com", sector: "医药", scale: "大型" },
  { name: "隆基绿能", domain: "longi.com", sector: "新能源", scale: "大型" },
  { name: "长江电力", domain: "cypc.com.cn", sector: "电力", scale: "大型" },
  { name: "宝钢股份", domain: "baosteel.com", sector: "钢铁冶金", scale: "大型" },
  { name: "上汽集团", domain: "saicmotor.com", sector: "汽车", scale: "大型" },
  { name: "伊利股份", domain: "yili.com", sector: "食品饮料", scale: "大型" },
  { name: "海康威视", domain: "hikvision.com", sector: "安防电子", scale: "大型" },
  { name: "京东方A", domain: "boe.com", sector: "半导体显示", scale: "大型" },
  { name: "立讯精密", domain: "luxshare-ict.com", sector: "电子制造", scale: "大型" },
  { name: "顺丰控股", domain: "sf-express.com", sector: "物流", scale: "大型" },
  { name: "中国建筑", domain: "cscec.com", sector: "建筑工程", scale: "大型" },
  { name: "万科A", domain: "vanke.com", sector: "房地产", scale: "大型" },
  { name: "保利发展", domain: "poly.com.cn", sector: "房地产", scale: "大型" },
  { name: "中信证券", domain: "citics.com", sector: "金融", scale: "大型" },
  { name: "东方财富", domain: "eastmoney.com", sector: "金融", scale: "大型" },
  { name: "科大讯飞", domain: "iflytek.com", sector: "人工智能", scale: "中型" },
  { name: "用友网络", domain: "yonyou.com", sector: "企业软件", scale: "中型" },
  { name: "广联达", domain: "glodon.com", sector: "建筑软件", scale: "中型" },
  { name: "三六零", domain: "360.cn", sector: "网络安全", scale: "大型" },
  { name: "浪潮信息", domain: "inspur.com", sector: "服务器", scale: "大型" },
  { name: "中科曙光", domain: "sugon.com", sector: "服务器", scale: "大型" },
  { name: "紫光股份", domain: "thunis.com", sector: "ICT", scale: "大型" },
  { name: "工业富联", domain: "fii-foxconn.com", sector: "电子制造", scale: "大型" },
  { name: "歌尔股份", domain: "goertek.com", sector: "电子制造", scale: "中型" },
  { name: "汇川技术", domain: "inovance.com", sector: "工业自动化", scale: "中型" },
  { name: "福耀玻璃", domain: "fuyaogroup.com", sector: "汽车玻璃", scale: "大型" },
  { name: "万华化学", domain: "whchem.com", sector: "化工", scale: "大型" },
  { name: "上海机场", domain: "shairport.com", sector: "交通基建", scale: "大型" },
  { name: "中国中车", domain: "crrcgc.cc", sector: "轨道交通", scale: "大型" },
  { name: "中国中铁", domain: "crec.cn", sector: "建筑工程", scale: "大型" },
  { name: "中国铁建", domain: "crcc.cn", sector: "建筑工程", scale: "大型" },
  { name: "中国交建", domain: "ccccltd.cn", sector: "建筑工程", scale: "大型" },
  { name: "中国电建", domain: "powerchina.cn", sector: "电力工程", scale: "大型" },
  { name: "三峡能源", domain: "ctg.com.cn", sector: "新能源", scale: "大型" },
  { name: "国电南瑞", domain: "nari-china.com", sector: "电力自动化", scale: "大型" },
  { name: "上海电气", domain: "shanghai-electric.com", sector: "装备制造", scale: "大型" },
  { name: "TCL科技", domain: "tcl.com", sector: "半导体显示", scale: "大型" },
  { name: "四川长虹", domain: "changhong.com", sector: "家电制造", scale: "大型" },
  { name: "青岛海尔", domain: "haier.com", sector: "家电制造", scale: "大型" },
  { name: "洋河股份", domain: "yanghe.com", sector: "食品饮料", scale: "大型" },
  { name: "泸州老窖", domain: "lzlj.com", sector: "食品饮料", scale: "大型" },
  { name: "山西汾酒", domain: "fenjiu.com.cn", sector: "食品饮料", scale: "大型" },
  { name: "伊利", domain: "yili.com", sector: "食品饮料", scale: "大型" },
  { name: "蒙牛乳业", domain: "mengniu.com.cn", sector: "食品饮料", scale: "大型" },
  { name: "安踏体育", domain: "anta.com", sector: "服装鞋帽", scale: "大型" },
  { name: "李宁", domain: "li-ning.com", sector: "服装鞋帽", scale: "大型" },
  { name: "携程", domain: "ctrip.com", sector: "在线旅游", scale: "大型" },
  { name: "百度", domain: "baidu.com", sector: "互联网", scale: "大型" },
  { name: "网易", domain: "163.com", sector: "互联网", scale: "大型" },
  { name: "小米集团", domain: "mi.com", sector: "消费电子", scale: "大型" },
  { name: "联想集团", domain: "lenovo.com", sector: "计算设备", scale: "大型" },
  { name: "中兴通讯", domain: "zte.com.cn", sector: "通信", scale: "大型" },
  { name: "紫光国微", domain: "gigadevice.com", sector: "半导体", scale: "中型" },
  { name: "韦尔股份", domain: "willsemi.com", sector: "半导体", scale: "中型" },
  { name: "兆易创新", domain: "gigadevice.com", sector: "半导体", scale: "中型" },
  { name: "北方华创", domain: "naura.com", sector: "半导体设备", scale: "大型" },
  { name: "中芯国际", domain: "smics.com", sector: "半导体", scale: "大型" },
  { name: "长电科技", domain: "jcetglobal.com", sector: "半导体封测", scale: "大型" },
  { name: "通威股份", domain: "tongwei.com", sector: "新能源", scale: "大型" },
  { name: "阳光电源", domain: "sungrowpower.com", sector: "新能源", scale: "大型" },
  { name: "晶科能源", domain: "jinkosolar.com", sector: "新能源", scale: "大型" },
  { name: "天合光能", domain: "trinasolar.com", sector: "新能源", scale: "大型" },
  { name: "TCL中环", domain: "tcl.com", sector: "新能源", scale: "大型" },
  { name: "特变电工", domain: "tbea.com", sector: "电力设备", scale: "大型" },
  { name: "正泰电器", domain: "chint.com", sector: "低压电器", scale: "大型" },
  { name: "德赛西威", domain: "desay-sv.com", sector: "汽车电子", scale: "中型" },
  { name: "华域汽车", domain: "hasco.net.cn", sector: "汽车零部件", scale: "大型" },
  { name: "福耀", domain: "fuyaogroup.com", sector: "汽车玻璃", scale: "大型" },
  { name: "长城汽车", domain: "gwm.cn", sector: "汽车", scale: "大型" },
  { name: "广汽集团", domain: "gac.com.cn", sector: "汽车", scale: "大型" },
  { name: "上汽", domain: "saicmotor.com", sector: "汽车", scale: "大型" },
  { name: "吉利汽车", domain: "geely.com", sector: "汽车", scale: "大型" },
  { name: "长安汽车", domain: "changan.com.cn", sector: "汽车", scale: "大型" },
  { name: "海尔智家", domain: "haier.com", sector: "家电制造", scale: "大型" },
  { name: "海信视像", domain: "hisense.com", sector: "家电制造", scale: "大型" },
  { name: "TCL电子", domain: "tcl.com", sector: "家电制造", scale: "大型" },
  { name: "石头科技", domain: "roborock.com", sector: "智能家电", scale: "中型" },
  { name: "科沃斯", domain: "ecovacs.com", sector: "智能家电", scale: "中型" },
  { name: "大华股份", domain: "dahuatech.com", sector: "安防电子", scale: "大型" },
  { name: "宇视科技", domain: "uniview.com", sector: "安防电子", scale: "中型" },
  { name: "商汤科技", domain: "sensetime.com", sector: "人工智能", scale: "中型" },
  { name: "旷视科技", domain: "megvii.com", sector: "人工智能", scale: "中型" },
  { name: "依图科技", domain: "yitu.com", sector: "人工智能", scale: "中型" },
  { name: "云从科技", domain: "cloudwalk.com", sector: "人工智能", scale: "中型" },
  { name: "寒武纪", domain: "cambricon.com", sector: "AI芯片", scale: "中型" },
  { name: "地平线", domain: "horizon.ai", sector: "AI芯片", scale: "中型" },
  { name: "第四范式", domain: "4paradigm.com", sector: "企业AI", scale: "中型" },
  { name: "明略科技", domain: "mininglamp.com", sector: "企业AI", scale: "中型" },
  { name: "同花顺", domain: "10jqka.com.cn", sector: "金融", scale: "中型" },
  { name: "恒生电子", domain: "hundsun.com", sector: "金融科技", scale: "大型" },
  { name: "新大陆", domain: "newlandcomputer.com", sector: "支付终端", scale: "中型" },
  { name: "广电运通", domain: "grgbanking.com", sector: "金融科技", scale: "大型" },
  { name: "宇信科技", domain: "yusys.com.cn", sector: "金融科技", scale: "中型" },
  { name: "润和软件", domain: "hoperun.com", sector: "软件", scale: "中型" },
  { name: "软通动力", domain: "isoftstone.com", sector: "软件", scale: "大型" },
  { name: "中软国际", domain: "chinasofti.com", sector: "软件", scale: "大型" },
  { name: "东华软件", domain: "dhesoft.com", sector: "软件", scale: "大型" },
  { name: "东软集团", domain: "neusoft.com", sector: "软件", scale: "大型" },
  { name: "卫宁健康", domain: "winning.com.cn", sector: "医疗IT", scale: "中型" },
  { name: "创业慧康", domain: "bsoft.com.cn", sector: "医疗IT", scale: "中型" },
  { name: "万达信息", domain: "wondersgroup.com", sector: "医疗IT", scale: "中型" },
  { name: "思创医惠", domain: "sichuang.com", sector: "医疗IT", scale: "中型" },
  { name: "鱼跃医疗", domain: "yuyue.com.cn", sector: "医疗器械", scale: "中型" },
  { name: "迈瑞医疗", domain: "mindray.com", sector: "医疗器械", scale: "大型" },
  { name: "乐普医疗", domain: "lepumedical.com", sector: "医疗器械", scale: "大型" },
  { name: "爱尔眼科", domain: "aierchina.com", sector: "医疗", scale: "大型" },
  { name: "通策医疗", domain: "topchoice.com.cn", sector: "医疗", scale: "中型" },
  { name: "智飞生物", domain: "zhifeishengwu.com", sector: "生物制药", scale: "大型" },
  { name: "沃森生物", domain: "walvax.com", sector: "生物制药", scale: "中型" },
  { name: "复星医药", domain: "fosunpharma.com", sector: "医药", scale: "大型" },
  { name: "上海医药", domain: "sphchina.com", sector: "医药", scale: "大型" },
  { name: "白云山", domain: "gybys.com.cn", sector: "医药", scale: "大型" },
  { name: "云南白药", domain: "ynby.com", sector: "医药", scale: "大型" },
  { name: "片仔癀", domain: "zzh.cn", sector: "医药", scale: "大型" },
  { name: "天士力", domain: "tasty.com.cn", sector: "医药", scale: "中型" },
  { name: "以岭药业", domain: "yiling.com.cn", sector: "医药", scale: "中型" },
  { name: "华东医药", domain: "ebewe.com", sector: "医药", scale: "大型" },
  { name: "新和成", domain: "nhu.com.cn", sector: "医药化工", scale: "大型" },
  { name: "荣盛石化", domain: "rongsheng.com", sector: "石化", scale: "大型" },
  { name: "恒力石化", domain: "hengli.com", sector: "石化", scale: "大型" },
  { name: "卫星化学", domain: "satlpec.com", sector: "化工", scale: "大型" },
  { name: "华鲁恒升", domain: "hualu-hengsheng.com", sector: "化工", scale: "大型" },
  { name: "宝丰能源", domain: "baofengenergy.com", sector: "能源化工", scale: "大型" },
  { name: "中国神华", domain: "csec.com", sector: "煤炭", scale: "大型" },
  { name: "陕西煤业", domain: "shccig.com", sector: "煤炭", scale: "大型" },
  { name: "兖矿能源", domain: "ykem.com", sector: "煤炭", scale: "大型" },
  { name: "中煤能源", domain: "chinacoalenergy.com", sector: "煤炭", scale: "大型" },
  { name: "紫金矿业", domain: "zjky.cn", sector: "矿业", scale: "大型" },
  { name: "江西铜业", domain: "jxcc.com", sector: "有色", scale: "大型" },
  { name: "中国铝业", domain: "chalco.com.cn", sector: "有色", scale: "大型" },
  { name: "山东黄金", domain: "sd-gold.com", sector: "黄金", scale: "大型" },
  { name: "洛阳钼业", domain: "cmoc.com", sector: "矿业", scale: "大型" },
  { name: "中国中冶", domain: "mcc.com.cn", sector: "冶金", scale: "大型" },
  { name: "鞍钢股份", domain: "ansteel.com", sector: "钢铁冶金", scale: "大型" },
  { name: "华菱钢铁", domain: "valin.com", sector: "钢铁冶金", scale: "大型" },
  { name: "河钢股份", domain: "hbisco.com", sector: "钢铁冶金", scale: "大型" },
  { name: "马钢股份", domain: "ma-steel.com", sector: "钢铁冶金", scale: "大型" },
  { name: "太钢不锈", domain: "tisco.com.cn", sector: "钢铁冶金", scale: "大型" },
  { name: "中国巨石", domain: "jushi.com", sector: "建材", scale: "大型" },
  { name: "北新建材", domain: "bnbm.com.cn", sector: "建材", scale: "大型" },
  { name: "海螺水泥", domain: "conch.cn", sector: "建材", scale: "大型" },
  { name: "东方雨虹", domain: "yuhong.com.cn", sector: "建材", scale: "大型" },
  { name: "福莱特", domain: "flatgroup.com", sector: "建材", scale: "大型" },
  { name: "伟星新材", domain: "chinastar.com.cn", sector: "建材", scale: "中型" },
  { name: "苏泊尔", domain: "supor.com", sector: "家电制造", scale: "大型" },
  { name: "九阳股份", domain: "joyoung.com", sector: "家电制造", scale: "中型" },
  { name: "小熊电器", domain: "xiaobear.com", sector: "家电制造", scale: "中型" },
  { name: "新宝股份", domain: "donlim.com", sector: "家电制造", scale: "大型" },
  { name: "科沃斯", domain: "ecovacs.com", sector: "智能家电", scale: "中型" },
  { name: "公牛集团", domain: "gongniu.cn", sector: "电工", scale: "大型" },
  { name: "欧普照明", domain: "opple.com", sector: "照明", scale: "中型" },
  { name: "晨光文具", domain: "mg-pen.com", sector: "文具", scale: "中型" },
  { name: "安克创新", domain: "anker.com", sector: "消费电子", scale: "中型" },
  { name: "传音控股", domain: "transsion.com", sector: "消费电子", scale: "大型" },
  { name: "蓝思科技", domain: "hnlens.com", sector: "电子制造", scale: "大型" },
  { name: "闻泰科技", domain: "wingtech.com", sector: "电子制造", scale: "大型" },
  { name: "卓胜微", domain: "maxscend.com", sector: "半导体", scale: "中型" },
  { name: "圣邦股份", domain: "sgmcu.com", sector: "半导体", scale: "中型" },
  { name: "斯达半导", domain: "powersemicon.com", sector: "半导体", scale: "中型" },
  { name: "士兰微", domain: "silan.com", sector: "半导体", scale: "中型" },
  { name: "华润微", domain: "crmicro.com", sector: "半导体", scale: "大型" },
  { name: "沪硅产业", domain: "nsig.com", sector: "半导体", scale: "大型" },
  { name: "中微公司", domain: "amec-inc.com", sector: "半导体设备", scale: "中型" },
  { name: "盛美上海", domain: "acmrc.com", sector: "半导体设备", scale: "中型" },
  { name: "拓荆科技", domain: "piotech.com.cn", sector: "半导体设备", scale: "中型" },
  { name: "华海清科", domain: "hwatsing.com", sector: "半导体设备", scale: "中型" },
  { name: "芯源微", domain: "kingsemi.com", sector: "半导体设备", scale: "中型" },
  { name: "富创精密", domain: "fortuneprecision.com", sector: "半导体设备", scale: "中型" },
  { name: "拓维信息", domain: "talkweb.com.cn", sector: "软件", scale: "中型" },
  { name: "神州数码", domain: "digitalchina.com", sector: "IT分销", scale: "大型" },
  { name: "常山北明", domain: "csbf.com.cn", sector: "软件", scale: "中型" },
  { name: "太极股份", domain: "taiji.com.cn", sector: "软件", scale: "大型" },
  { name: "中国软件", domain: "cs2c.com.cn", sector: "软件", scale: "大型" },
  { name: "卫士通", domain: "westone.com.cn", sector: "网络安全", scale: "大型" },
  { name: "启明星辰", domain: "venustech.com.cn", sector: "网络安全", scale: "大型" },
  { name: "绿盟科技", domain: "nsfocus.com", sector: "网络安全", scale: "中型" },
  { name: "深信服", domain: "sangfor.com", sector: "网络安全", scale: "大型" },
  { name: "奇安信", domain: "qianxin.com", sector: "网络安全", scale: "大型" },
  { name: "安恒信息", domain: "dbappsecurity.com.cn", sector: "网络安全", scale: "中型" },

  // 港股头部（带官网域名，可直接去官网采集）
  { name: "腾讯控股", domain: "tencent.com", sector: "互联网", scale: "大型", market: "港股", code: "00700" },
  { name: "阿里巴巴", domain: "alibabagroup.com", sector: "互联网", scale: "大型", market: "港股", code: "09988" },
  { name: "美团", domain: "meituan.com", sector: "本地生活", scale: "大型", market: "港股", code: "03690" },
  { name: "京东集团", domain: "jd.com", sector: "电商零售", scale: "大型", market: "港股", code: "09618" },
  { name: "网易", domain: "163.com", sector: "互联网", scale: "大型", market: "港股", code: "09999" },
  { name: "百度集团", domain: "baidu.com", sector: "互联网", scale: "大型", market: "港股", code: "09888" },
  { name: "快手", domain: "kuaishou.com", sector: "短视频", scale: "大型", market: "港股", code: "01024" },
  { name: "小米集团", domain: "mi.com", sector: "消费电子", scale: "大型", market: "港股", code: "01810" },
  { name: "联想集团", domain: "lenovo.com", sector: "计算设备", scale: "大型", market: "港股", code: "00992" },
  { name: "哔哩哔哩", domain: "bilibili.com", sector: "互联网", scale: "中型", market: "港股", code: "09626" },
  { name: "中芯国际", domain: "smics.com", sector: "半导体", scale: "大型", market: "港股", code: "00981" },
  { name: "舜宇光学", domain: "sunnyoptical.com", sector: "光学光电", scale: "大型", market: "港股", code: "02382" },
  { name: "理想汽车", domain: "lixiang.com", sector: "汽车", scale: "大型", market: "港股", code: "02015" },
  { name: "小鹏汽车", domain: "xiaopeng.com", sector: "汽车", scale: "大型", market: "港股", code: "09868" },
  { name: "蔚来", domain: "nio.cn", sector: "汽车", scale: "大型", market: "港股", code: "09866" },
  { name: "蒙牛乳业", domain: "mengniu.com.cn", sector: "食品饮料", scale: "大型", market: "港股", code: "02319" },
  { name: "安踏体育", domain: "anta.com", sector: "服装鞋帽", scale: "大型", market: "港股", code: "02020" },
  { name: "李宁", domain: "li-ning.com", sector: "服装鞋帽", scale: "大型", market: "港股", code: "02331" },
  { name: "携程集团", domain: "ctrip.com", sector: "在线旅游", scale: "大型", market: "港股", code: "09961" },
  { name: "友邦保险", domain: "aia.com", sector: "金融", scale: "大型", market: "港股", code: "01299" },
  { name: "汇丰控股", domain: "hsbc.com", sector: "金融", scale: "大型", market: "港股", code: "00005" },
  { name: "香港交易所", domain: "hkex.com.hk", sector: "金融", scale: "大型", market: "港股", code: "00388" },
  { name: "中国平安", domain: "pingan.com", sector: "金融", scale: "大型", market: "港股", code: "02318" },
  { name: "药明康德", domain: "wuxiapptec.com", sector: "医药", scale: "大型", market: "港股", code: "02359" },
  { name: "海尔智家", domain: "haier.com", sector: "家电制造", scale: "大型", market: "港股", code: "06690" },
  { name: "中国神华", domain: "csec.com", sector: "煤炭", scale: "大型", market: "港股", code: "01088" },
  { name: "中广核电力", domain: "cgnpc.com.cn", sector: "电力", scale: "大型", market: "港股", code: "01816" },
];

/**
 * 东方财富板块接口映射：fs 参数 -> 板块名。
 * 覆盖沪市主板(0+6)、深市主板(1+2)、创业板(1+23)、科创板(0+80)、北交所(0+90 / 1+90)、港股(90+2/3)。
 */
const EASTMONEY_BOARDS: { fs: string; market: Market }[] = [
  { fs: "m:0+t:6", market: "A主板" }, // 沪市主板
  { fs: "m:1+t:2", market: "A主板" }, // 深市主板
  { fs: "m:1+t:23", market: "创业板" }, // 创业板
  { fs: "m:0+t:80", market: "科创板" }, // 科创板
  { fs: "m:0+t:90,m:1+t:90", market: "北交所" }, // 北交所
];

const HK_BOARD = { fs: "m:90+t:2,m:90+t:3", market: "港股" as Market };

/** 拉取单个东方财富板块的（代码+名称）列表。 */
async function fetchEastmoneyBoard(fs: string, market: Market, timeoutMs = 25000): Promise<CompanyConfig[]> {
  const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=6000&fid=f3&fs=${encodeURIComponent(fs)}&fields=f12,f14`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Referer: "https://quote.eastmoney.com/" } });
    const json = (await res.json()) as any;
    const list = json?.data?.diff || [];
    return list
      .map((d: any) => ({ name: String(d.f14 || ""), code: String(d.f12 || ""), market }))
      .filter((x: any) => x.name)
      .map((x: any) => ({ name: x.name, domain: "", sector: "未披露", scale: "未披露" as const, market: x.market, code: x.code }));
  } catch (err: any) {
    console.warn(`[companies] 拉取板块 ${market} 失败: ${err.message || err}`);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 运行时拉取全市场上市公司（A 股主板 + 创业板 + 科创板 + 北交所 + 港股），并去重合并内置清单。
 * 返回按"企业名称"去重后的完整名单：同名企业优先保留 KNOWN_COMPANIES 中带官网域名的条目。
 * 这是"覆盖全部上市公司"的主数据源。
 */
export async function getAllListedCompanies(): Promise<CompanyConfig[]> {
  // 1) 内置清单（带官网域名），以 name 为 key 优先
  const byName = new Map<string, CompanyConfig>();
  for (const c of KNOWN_COMPANIES) {
    byName.set(c.name, { ...c });
  }

  // 2) 并行拉取 A 股各板块 + 港股
  const boards = [...EASTMONEY_BOARDS, HK_BOARD];
  const results = await Promise.all(boards.map((b) => fetchEastmoneyBoard(b.fs, b.market)));
  for (const arr of results) {
    for (const c of arr) {
      const exist = byName.get(c.name);
      if (!exist) {
        // 新增：全量名单中未发现的内地/港股企业
        byName.set(c.name, { ...c });
      } else if (!exist.domain && c.domain) {
        // 已存在但无域名，补充（一般不会发生，KNOWN 已有域名）
        byName.set(c.name, { ...exist, domain: c.domain, code: c.code || exist.code, market: exist.market || c.market });
      }
    }
  }

  const all = Array.from(byName.values());
  console.log(`[companies] 全市场上市公司去重后共 ${all.length} 家（A股主板/创业板/科创板/北交所 + 港股）`);
  return all;
}

/**
 * 兼容旧调用：返回去重后全部企业名称（用于进度调度切片）。
 */
export async function getAllListedCompanyNames(): Promise<string[]> {
  const all = await getAllListedCompanies();
  return all.map((c) => c.name);
}

/**
 * @deprecated 旧接口，保留以兼容可能调用。建议改用 getAllListedCompanies。
 * 仅拉 A 股（不含港股）名称数组。
 */
export async function getAllAStockNames(): Promise<string[]> {
  const all = await getAllListedCompanies();
  return all.filter((c) => c.market !== "港股").map((c) => c.name);
}

/** 返回可直接"去官网采集"的清单（含官网域名）。 */
export function getKnownCompanies(): CompanyConfig[] {
  return KNOWN_COMPANIES;
}

/** 从内置清单按名称查企业配置（含官网域名）。找不到返回 undefined。 */
export function getKnownCompanyByName(name: string): CompanyConfig | undefined {
  return KNOWN_COMPANIES.find((c) => c.name === name);
}

/** 按名称构造 CompanyConfig（用于全量名单中的企业，可能无官网域名）。 */
export function makeCompanyConfig(name: string, market?: Market, code?: string): CompanyConfig {
  const known = getKnownCompanyByName(name);
  if (known) return known;
  return { name, domain: "", sector: "未披露", scale: "未披露", market, code };
}
