// Destination front-end sample data (Team C).
// Fields are compiled by hand and only serve browsing, filtering and the detail view;
// once the places API lands, api/destinations.ts swaps the source without touching the pages.
// Ticket and opening hours follow on-site notices; the UI always labels this as sample data, not travel advice.

export type DestinationCategory = "heritage" | "nature" | "urban" | "island";

export interface Localized {
  zh: string;
  en: string;
}

export interface Destination {
  id: string;
  name: Localized;
  category: DestinationCategory;
  district: Localized;
  address: Localized;
  summary: Localized;
  highlights: Localized[];
  tags: Localized[];
  ticket: Localized;
  duration: Localized;
  hours: Localized;
  bestSeason: Localized;
  coords: { lat: number; lng: number };
  /** 0-100, used only for list sorting; not real visitor traffic */
  heat: number;
}

export const DESTINATION_SAMPLES: Destination[] = [
  {
    id: "sanfang-qixiang",
    name: { zh: "三坊七巷", en: "Sanfang Qixiang" },
    category: "heritage",
    district: { zh: "鼓楼区", en: "Gulou" },
    address: {
      zh: "福州市鼓楼区南后街",
      en: "Nanhou Street, Gulou District, Fuzhou",
    },
    summary: {
      zh: "福州老城的坊巷格局保留完整，白墙黛瓦间分布着大量民居与名人故居，适合半天步行慢慢看。",
      en: "The best-preserved lane-and-alley grid of old Fuzhou, with white walls, dark tiles and former residences of notable figures.",
    },
    highlights: [
      { zh: "南后街上两侧的坊巷可横向穿行，巷内比主街安静", en: "Cross into the side lanes for a quieter walk than the main street" },
      { zh: "多处民居改成展馆或书店，适合避雨、歇脚", en: "Several houses are now small museums or bookshops, good for a break" },
      { zh: "傍晚灯笼点亮后适合拍照，人流也相对分散", en: "Lanterns come on at dusk, when the crowds thin out" },
    ],
    tags: [
      { zh: "古厝", en: "Heritage" },
      { zh: "步行", en: "On foot" },
      { zh: "夜景", en: "Night view" },
    ],
    ticket: { zh: "街区免费，部分展馆另收费", en: "Free street, some museums charge" },
    duration: { zh: "2–3 小时", en: "2–3 hours" },
    hours: { zh: "街区全天开放", en: "Street open all day" },
    bestSeason: { zh: "秋、冬", en: "Autumn, winter" },
    coords: { lat: 26.0806, lng: 119.2978 },
    heat: 96,
  },
  {
    id: "yantaishan",
    name: { zh: "烟台山历史风貌区", en: "Yantai Hill" },
    category: "heritage",
    district: { zh: "仓山区", en: "Cangshan" },
    address: {
      zh: "福州市仓山区梅坞路、乐群路一带",
      en: "Meiwu and Lequn roads, Cangshan District, Fuzhou",
    },
    summary: {
      zh: "近代洋楼、教堂与老校舍沿坡而建，街道起伏有层次，适合一下午的city walk，顺路可以走到江边。",
      en: "Colonial-era villas, churches and old school buildings climb the slope, an easy afternoon walk that ends near the river.",
    },
    highlights: [
      { zh: "坡道和石阶多，建议穿软底鞋", en: "Slopes and steps throughout, wear comfortable shoes" },
      { zh: "老建筑多为外观参观，注意是否对外开放", en: "Most buildings are viewed from outside; check opening signs" },
      { zh: "从街区往下走可到闽江边，接上下杭", en: "Walk downhill to the Min River and on to Shangxiahang" },
    ],
    tags: [
      { zh: "洋楼", en: "Colonial" },
      { zh: "街拍", en: "Street photo" },
      { zh: "咖啡", en: "Coffee" },
    ],
    ticket: { zh: "免费", en: "Free" },
    duration: { zh: "2 小时", en: "2 hours" },
    hours: { zh: "街区全天开放", en: "Open all day" },
    bestSeason: { zh: "四季", en: "All year" },
    coords: { lat: 26.0479, lng: 119.3119 },
    heat: 88,
  },
  {
    id: "gushan",
    name: { zh: "鼓山", en: "Gushan" },
    category: "nature",
    district: { zh: "晋安区", en: "Jin'an" },
    address: {
      zh: "福州市晋安区鼓山镇",
      en: "Gushan Town, Jin'an District, Fuzhou",
    },
    summary: {
      zh: "城东的山地公园，古道石阶一路向上，山顶可俯瞰城区，半山有涌泉寺，体力一般也能走到合适的观景点。",
      en: "A mountain park east of the city: stone-step trails climb to ridge views, with Yongquan Temple halfway up.",
    },
    highlights: [
      { zh: "登山道与缆车可自由搭配，下山注意膝盖", en: "Mix the trail with the cable car, and take descents slowly" },
      { zh: "清晨与傍晚光线好，正午山路暴晒", en: "Best light at dawn and dusk; the trail is exposed at noon" },
      { zh: "半山有补给点，山上水价偏高，出发前备好", en: "Refill points are sparse; bring water before the climb" },
    ],
    tags: [
      { zh: "登山", en: "Hiking" },
      { zh: "寺庙", en: "Temple" },
      { zh: "俯瞰", en: "City view" },
    ],
    ticket: { zh: "登山免费，寺院与缆车另收费", en: "Trail free, temple and cable car charge" },
    duration: { zh: "3–4 小时", en: "3–4 hours" },
    hours: { zh: "白天开放，夜间不建议登山", en: "Daytime only; avoid night hiking" },
    bestSeason: { zh: "秋、冬", en: "Autumn, winter" },
    coords: { lat: 26.0553, lng: 119.3812 },
    heat: 84,
  },
  {
    id: "pingtan-island",
    name: { zh: "平潭岛", en: "Pingtan Island" },
    category: "island",
    district: { zh: "平潭综合实验区", en: "Pingtan" },
    address: {
      zh: "福州市平潭综合实验区，市区驾车约 2 小时",
      en: "Pingtan, about a two-hour drive from downtown Fuzhou",
    },
    summary: {
      zh: "海岛线路以海岸公路、沙滩和石头厝为主，风景开阔但风大，适合安排一整天或住一晚，不适合当日往返赶景点。",
      en: "Coastal roads, beaches and stone houses. Open scenery and strong wind; give it a full day or an overnight stay.",
    },
    highlights: [
      { zh: "环岛公路景点分散，建议先定两三个点再出发", en: "Sights are spread out; pick two or three stops ahead of time" },
      { zh: "海风大、日晒强，带外套和防晒", en: "Windy and exposed, bring a jacket and sun protection" },
      { zh: "节假日返程车流集中，留意渡口与车次时间", en: "Expect heavy return traffic on holidays" },
    ],
    tags: [
      { zh: "海岛", en: "Island" },
      { zh: "自驾", en: "Road trip" },
      { zh: "住一晚", en: "Overnight" },
    ],
    ticket: { zh: "多数海滩免费，个别景区另收费", en: "Most beaches free, some sites charge" },
    duration: { zh: "1–2 天", en: "1–2 days" },
    hours: { zh: "全天，景区按各自公告", en: "All day; sites post their own hours" },
    bestSeason: { zh: "春末至秋初", en: "Late spring to early autumn" },
    coords: { lat: 25.5034, lng: 119.7912 },
    heat: 90,
  },
  {
    id: "shangxiahang",
    name: { zh: "上下杭历史文化街区", en: "Shangxiahang" },
    category: "heritage",
    district: { zh: "台江区", en: "Taijiang" },
    address: {
      zh: "福州市台江区上杭路、下杭路",
      en: "Shanghang and Xiaohang roads, Taijiang District, Fuzhou",
    },
    summary: {
      zh: "旧时商埠码头所在，河巷与骑楼并行，规模比三坊七巷小，适合傍晚串一条两小时的散步路线。",
      en: "The old merchant wharves: canal lanes and arcaded shopfronts, smaller than Sanfang Qixiang and good for an evening walk.",
    },
    highlights: [
      { zh: "沿河一段适合慢走，夜里灯光柔和", en: "The canal stretch is calm and softly lit at night" },
      { zh: "街区偏商业，避开集中用餐时段更从容", en: "It is commercial; avoid peak dining hours" },
      { zh: "离烟台山、闽江边都不远，可拼成半日线", en: "Close to Yantai Hill and the river, easy to combine" },
    ],
    tags: [
      { zh: "商埠", en: "Wharves" },
      { zh: "夜景", en: "Night view" },
      { zh: "小吃", en: "Snacks" },
    ],
    ticket: { zh: "免费", en: "Free" },
    duration: { zh: "1.5–2 小时", en: "1.5–2 hours" },
    hours: { zh: "街区全天开放", en: "Open all day" },
    bestSeason: { zh: "四季", en: "All year" },
    coords: { lat: 26.054, lng: 119.304 },
    heat: 80,
  },
  {
    id: "west-lake-park",
    name: { zh: "福州西湖公园", en: "West Lake Park" },
    category: "urban",
    district: { zh: "鼓楼区", en: "Gulou" },
    address: {
      zh: "福州市鼓楼区湖滨路 70 号",
      en: "70 Hubin Road, Gulou District, Fuzhou",
    },
    summary: {
      zh: "市中心的园林湖面，环湖一圈路径平整，适合清晨或傍晚的轻量散步，也方便和周边博物馆一起安排。",
      en: "A landscaped lake in the city centre with a flat loop path, good for a light morning or evening walk.",
    },
    highlights: [
      { zh: "环湖步道平整，适合带长辈或推车", en: "Flat loop, easy with elders or a stroller" },
      { zh: "园内多树荫，夏天比街区凉快", en: "Plenty of shade, cooler than the streets in summer" },
      { zh: "出入口多，走累了可以就近离开", en: "Several entrances, so you can exit anywhere" },
    ],
    tags: [
      { zh: "园林", en: "Garden" },
      { zh: "散步", en: "Stroll" },
      { zh: "亲子", en: "Family" },
    ],
    ticket: { zh: "免费", en: "Free" },
    duration: { zh: "1–1.5 小时", en: "1–1.5 hours" },
    hours: { zh: "白天开放，夜间照明有限", en: "Daytime; limited lighting at night" },
    bestSeason: { zh: "四季", en: "All year" },
    coords: { lat: 26.0895, lng: 119.2836 },
    heat: 78,
  },
  {
    id: "fudao",
    name: { zh: "福州福道", en: "Fudao Trail" },
    category: "urban",
    district: { zh: "鼓楼区", en: "Gulou" },
    address: {
      zh: "福州市鼓楼区金牛山一带，多个入口",
      en: "Jinniushan area, Gulou District; several entrances",
    },
    summary: {
      zh: "架在山林上的城市步道，钢架走廊悬空穿行，视野开阔且遮阴良好，走一段就能回到城区。",
      en: "An elevated steel walkway through urban forest, with open views, good shade and quick access back to the city.",
    },
    highlights: [
      { zh: "入口分散，按体力选一段即可，不必全程走完", en: "Choose a section by fitness level; the full run is long" },
      { zh: "高处风大，秋冬注意保暖", en: "Windy on the high sections, dress warm in cooler months" },
      { zh: "傍晚灯光与城市天际线结合，适合拍照", en: "Evening light plus the skyline makes a good photo stop" },
    ],
    tags: [
      { zh: "步道", en: "Walkway" },
      { zh: "城市森林", en: "Urban forest" },
      { zh: "观景", en: "Viewpoint" },
    ],
    ticket: { zh: "免费", en: "Free" },
    duration: { zh: "1.5–2 小时", en: "1.5–2 hours" },
    hours: { zh: "全天开放", en: "Open all day" },
    bestSeason: { zh: "秋、冬", en: "Autumn, winter" },
    coords: { lat: 26.0733, lng: 119.2627 },
    heat: 74,
  },
  {
    id: "mawei-shipyard",
    name: { zh: "中国船政文化城", en: "Mawei Shipyard Heritage" },
    category: "heritage",
    district: { zh: "马尾区", en: "Mawei" },
    address: {
      zh: "福州市马尾区船政文化景区一带",
      en: "Shipyard heritage area, Mawei District, Fuzhou",
    },
    summary: {
      zh: "以近代船政工业与海军教育为主题的片区，展馆与旧厂区并存，离市区略远，适合对近代史感兴趣的半日行程。",
      en: "A district built around modern shipbuilding and naval education, with museums and old workshops; a half-day trip for history fans.",
    },
    highlights: [
      { zh: "展馆之间有一定步行距离，先看导览图", en: "Museums are a walk apart; start at the map board" },
      { zh: "从市区出发需留出往返车程", en: "Allow travel time from downtown Fuzhou" },
      { zh: "部分场馆需预约或周一闭馆，出发前确认", en: "Some halls need booking or close Mondays; check first" },
    ],
    tags: [
      { zh: "近代史", en: "Modern history" },
      { zh: "博物馆", en: "Museum" },
      { zh: "半日", en: "Half day" },
    ],
    ticket: { zh: "园区免费，部分展馆另收费", en: "Grounds free, some halls charge" },
    duration: { zh: "2–3 小时", en: "2–3 hours" },
    hours: { zh: "白天开放，按展馆公告", en: "Daytime, per museum notices" },
    bestSeason: { zh: "四季", en: "All year" },
    coords: { lat: 25.99, lng: 119.4567 },
    heat: 66,
  },
];

export const CATEGORY_ORDER: DestinationCategory[] = [
  "heritage",
  "nature",
  "urban",
  "island",
];
