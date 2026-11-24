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
      zh: "烟台山保留了大量领事馆、教堂、洋行和近代洋楼，山地街巷随地势起伏展开，是感受福州开埠历史和中西交融城市风貌的重要街区。如今老建筑中也融入书店、咖啡馆和艺术空间，适合慢慢步行探索。",
      en: "Yantai Hill preserves consulates, churches, trading houses and historic villas along winding hillside streets. It offers a distinctive view of Fuzhou's treaty-port history and blend of Chinese and Western architecture, now mixed with bookstores, cafés and art spaces.",
    },

    highlights: [
      {
        zh: "石厝教堂、领事馆旧址和近代洋楼集中分布，适合边走边看建筑细节",
        en: "Historic churches, former consulates and period villas make the district especially rewarding for architecture walks",
      },
      {
        zh: "街区见证了福州开埠后的对外交流，是了解近代福州城市发展与中西文化交融的重要地点",
        en: "The district reflects Fuzhou's treaty-port era and the city's modern history of international exchange",
      },
      {
        zh: "历史建筑与书店、咖啡馆、展览和艺术空间结合，适合安排半天的城市漫步",
        en: "Historic buildings now mix with bookstores, cafés, exhibitions and art spaces, making the area ideal for a half-day city walk",
      },
    ],

    tags: [
      { zh: "近代建筑", en: "Historic architecture" },
      { zh: "城市漫步", en: "City walk" },
      { zh: "中西交融", en: "East-West heritage" },
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
      zh: "平潭综合实验区，距福州市区约 2 小时车程",
      en: "Pingtan, about a two-hour drive from downtown Fuzhou",
    },

    summary: {
      zh: "平潭以开阔海岸、沙滩、环岛公路和传统石头厝闻名，既适合沿海自驾与骑行，也可以在北港村、北部生态廊道等地感受独特的海岛聚落和山海景观。",
      en: "Pingtan is known for its open coastline, beaches, scenic coastal roads and traditional stone houses. It is well suited to road trips, cycling and exploring distinctive island villages and mountain-sea scenery.",
    },

    highlights: [
      {
        zh: "海岸线、沙滩和滨海公路景观丰富，适合自驾、骑行和看海",
        en: "A varied coastline of beaches and scenic coastal roads makes it ideal for driving, cycling and seaside views",
      },
      {
        zh: "北港村等传统聚落保留了具有平潭特色的花岗岩石头厝",
        en: "Traditional villages such as Beigang preserve Pingtan's distinctive granite stone houses",
      },
      {
        zh: "北部生态廊道将山海、风车、村落和观景台串联起来，适合安排半天以上的滨海游览",
        en: "The northern ecological corridor links mountains, sea views, wind turbines, villages and viewing platforms into a memorable coastal route",
      },
    ],

    tags: [
      { zh: "海岛", en: "Island" },
      { zh: "滨海自驾", en: "Coastal road trip" },
      { zh: "石头厝", en: "Stone houses" },
    ],

    ticket: {
      zh: "多数公共海滩和滨海区域免费，部分景点或体验项目另行收费",
      en: "Most public beaches and coastal areas are free; some attractions and activities charge separately",
    },

    duration: { zh: "1–2 天", en: "1–2 days" },

    hours: {
      zh: "公共滨海区域全天开放，具体景点以现场公告为准",
      en: "Public coastal areas are generally open all day; individual attractions set their own hours",
    },

    bestSeason: {
      zh: "春末至秋初",
      en: "Late spring to early autumn",
    },

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
  {
    id: "min-river-waterfront",
    name: { zh: "闽江滨江", en: "Min River Waterfront" },
    category: "urban",
    district: { zh: "台江区 / 仓山区", en: "Taijiang / Cangshan" },

    address: {
      zh: "福州市闽江两岸，建议从闽江之心、江滨步道等区域开始游览",
      en: "Along both banks of the Min River in central Fuzhou, with convenient access from the Heart of Min River and riverside promenades",
    },

    summary: {
      zh: "闽江穿城而过，两岸串联城市夜景、滨江步道、历史街区和现代城市空间。白天适合沿江散步与骑行，入夜后灯光映照江面，是感受福州山水城市风貌和夜生活氛围的代表性路线。",
      en: "The Min River runs through central Fuzhou, linking riverside promenades, historic districts and modern cityscapes. It is ideal for walking and cycling by day, while illuminated bridges and waterfront buildings create one of the city's signature night views.",
    },

    highlights: [
      {
        zh: "闽江两岸夜景是福州城市夜游的重要组成部分，灯光、桥梁和沿江建筑共同构成开阔的滨水景观",
        en: "Illuminated bridges, riverside buildings and reflections on the river create one of Fuzhou's defining nightscapes",
      },
      {
        zh: "可以从闽江之心沿滨江空间慢慢步行，感受江风、城市天际线和公共休闲空间",
        en: "Riverside promenades around the Heart of Min River offer relaxed walks with river breezes and broad city views",
      },
      {
        zh: "可与烟台山、上下杭等地点串联，适合组合成半天至晚间的城市漫步路线",
        en: "The waterfront connects naturally with Yantai Hill and Shangxiahang, making it easy to build a half-day or evening city walk",
      },
    ],

    tags: [
      { zh: "滨江", en: "Waterfront" },
      { zh: "夜景", en: "Night view" },
      { zh: "城市漫步", en: "City walk" },
    ],

    ticket: {
      zh: "公共滨江区域免费，游船等体验项目另行收费",
      en: "Public riverside areas are free; cruises and other activities charge separately",
    },

    duration: { zh: "1.5–3 小时", en: "1.5–3 hours" },

    hours: {
      zh: "公共滨江区域全天开放，夜景灯光及游船时间以当日公告为准",
      en: "Public riverside areas are open all day; lighting displays and cruises follow their own schedules",
    },

    bestSeason: {
      zh: "四季，傍晚至夜间体验更佳",
      en: "All year, especially from sunset into the evening",
    },

    coords: { lat: 26.0530, lng: 119.3060 },

    heat: 86,
  },
];

export const CATEGORY_ORDER: DestinationCategory[] = [
  "heritage",
  "nature",
  "urban",
  "island",
];
