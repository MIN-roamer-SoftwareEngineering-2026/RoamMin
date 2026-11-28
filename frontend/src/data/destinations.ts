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
    zh: "三坊七巷是福州历史文化名城的重要地标，保留了以南后街为中轴的传统坊巷格局。白墙黛瓦的明清古厝、名人故居与传统街巷相互交织，是了解福州建筑文化、历史人物和老城生活的代表性街区。",
    en: "Sanfang Qixiang is a landmark historic district in Fuzhou, preserving a traditional network of lanes centered on Nanhou Street. Its Ming- and Qing-era residences, whitewashed walls, dark-tiled roofs and former homes of notable figures offer a vivid introduction to the city's architectural and cultural heritage.",
  },

  highlights: [
    {
      zh: "三坊七巷保留了传统里坊格局，狭长街巷与明清古厝相互交织，展现福州老城独特的建筑风貌",
      en: "Its preserved network of traditional lanes and Ming- and Qing-era residences showcases the distinctive architecture of old Fuzhou",
    },
    {
      zh: "街区内分布着林则徐、严复等历史人物的相关故居与纪念场所，可以深入了解福州的人文历史",
      en: "Historic residences and memorial sites associated with figures such as Lin Zexu and Yan Fu offer insights into Fuzhou's cultural history",
    },
    {
      zh: "南后街与周边坊巷融合传统手工艺、福州特色小吃和文化展馆，适合在漫步中体验当地生活",
      en: "Nanhou Street and its surrounding lanes bring together traditional crafts, local snacks and cultural exhibitions for an immersive walking experience",
    },
  ],

  tags: [
    { zh: "明清古厝", en: "Historic residences" },
    { zh: "名人故居", en: "Historic figures" },
    { zh: "历史街区", en: "Historic district" },
  ],

  ticket: {
    zh: "街区免费，部分展馆另收费",
    en: "Free entry to the district; some museums charge admission",
  },

  duration: { zh: "2–3 小时", en: "2–3 hours" },

  hours: {
    zh: "街区全天开放",
    en: "The public streets are open all day",
  },

  bestSeason: {
    zh: "秋、冬",
    en: "Autumn and winter",
  },

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
    zh: "鼓山位于福州城区东部，是融合自然山林、佛教文化与摩崖石刻的代表性风景名胜区。山间古道蜿蜒，沿途分布着历史石刻与观景点，著名的涌泉寺坐落于山中，适合登山健行、欣赏山景和探访历史文化遗迹。",
    en: "Located east of central Fuzhou, Gushan is a scenic mountain known for its forested trails, Buddhist heritage and historic cliff inscriptions. Stone paths wind through the hills toward viewpoints and cultural landmarks, including the renowned Yongquan Temple, making it a rewarding destination for hiking and heritage exploration.",
  },

  highlights: [
    {
      zh: "鼓山登山古道沿山势蜿蜒而上，石阶、林木与山间景观相互交织，适合体验自然徒步的乐趣",
      en: "Gushan's historic stone-step trails wind through wooded slopes, offering a scenic hiking experience amid the mountain landscape",
    },
    {
      zh: "涌泉寺是鼓山重要的佛教文化古迹，寺院建筑与周围山林相映成趣，展现深厚的宗教与历史文化底蕴",
      en: "Yongquan Temple is a major Buddhist heritage site, where traditional temple architecture blends with the surrounding forested hills",
    },
    {
      zh: "鼓山保存着丰富的摩崖石刻，其中鼓山十八景一带兼具历史题刻与自然景观，适合欣赏石刻艺术和山林风光",
      en: "The mountain is known for its historic cliff inscriptions, especially around the Eighteen Scenic Spots area, where carved calligraphy and natural scenery come together",
    },
  ],

  tags: [
    { zh: "登山古道", en: "Historic trails" },
    { zh: "涌泉寺", en: "Yongquan Temple" },
    { zh: "摩崖石刻", en: "Cliff inscriptions" },
  ],

  ticket: {
    zh: "部分公共登山路线免费，寺院、部分景点及缆车可能另行收费",
    en: "Some public hiking routes are free; the temple, certain attractions and cable car services may charge admission",
  },

  duration: {
    zh: "3–4 小时",
    en: "3–4 hours",
  },

  hours: {
    zh: "登山路线及各景点开放安排不同，建议白天游览并提前确认",
    en: "Access hours vary by trail and attraction; daytime visits are recommended, with current schedules checked in advance",
  },

  bestSeason: {
    zh: "秋、冬",
    en: "Autumn and winter",
  },

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
  name: {
    zh: "上下杭历史文化街区",
    en: "Shangxiahang Historic District",
  },
  category: "heritage",
  district: { zh: "台江区", en: "Taijiang" },

  address: {
    zh: "福州市台江区上杭路、下杭路一带",
    en: "Shanghang and Xiahang roads, Taijiang District, Fuzhou",
  },

  summary: {
    zh: "上下杭曾是福州重要的商贸集散区域，保留了传统商业街巷、商帮会馆和富有地方特色的历史建筑。沿着上杭路、下杭路及周边街巷漫步，可以感受福州昔日的商业繁华，以及传统街区与现代休闲生活交融的独特氛围。",
    en: "Shangxiahang was once an important commercial hub in Fuzhou. Its historic streets preserve traditional shopfronts, merchant guild halls and distinctive local architecture. Walking along Shanghang and Xiahang roads reveals the city's trading heritage alongside its lively contemporary street culture.",
  },

  highlights: [
    {
      zh: "传统商铺、商帮会馆和历史建筑集中分布，展现福州昔日商贸活动与城市发展的历史",
      en: "Traditional shopfronts, merchant guild halls and historic buildings reflect Fuzhou's commercial past and urban development",
    },
    {
      zh: "上杭路、下杭路及周边街巷保留了传统街区格局，适合漫步欣赏闽都建筑与老城风貌",
      en: "The historic lanes around Shanghang and Xiahang roads offer a rewarding walk through traditional Fuzhou architecture and old-town scenery",
    },
    {
      zh: "历史街巷与地方小吃、文化空间和夜间灯光相结合，可以体验传统商埠在现代城市中的新活力",
      en: "Local snacks, cultural spaces and evening lights bring new energy to the district's historic commercial streets",
    },
  ],

  tags: [
    { zh: "商贸历史", en: "Trading heritage" },
    { zh: "历史街区", en: "Historic district" },
    { zh: "城市漫步", en: "City walk" },
  ],

  ticket: {
    zh: "公共街区免费，部分展馆及体验项目另行收费",
    en: "Free access to public streets; some exhibitions and activities charge separately",
  },

  duration: {
    zh: "1.5–2 小时",
    en: "1.5–2 hours",
  },

  hours: {
    zh: "公共街区全天开放，商铺及展馆营业时间各异",
    en: "Public streets are open all day; shops and exhibition venues have individual opening hours",
  },

  bestSeason: {
    zh: "四季",
    en: "All year",
  },

  coords: { lat: 26.054, lng: 119.304 },
  heat: 80,
},

{
  id: "west-lake-park",
  name: {
    zh: "福州西湖公园",
    en: "Fuzhou West Lake Park",
  },
  category: "urban",
  district: { zh: "鼓楼区", en: "Gulou" },

  address: {
    zh: "福州市鼓楼区湖滨路 70 号",
    en: "70 Hubin Road, Gulou District, Fuzhou",
  },

  summary: {
    zh: "福州西湖公园是福州历史悠久的城市园林，以湖光水色、亭台桥榭和绿树环绕的湖岛景观闻名。园内湖面开阔，曲桥连接不同景区，传统园林建筑与自然景色相互映衬，是感受福州古典园林文化和城市休闲氛围的代表性去处。",
    en: "Fuzhou West Lake Park is a historic urban garden known for its tranquil lake scenery, traditional pavilions, bridges and tree-lined islands. Its winding paths and waterside architecture blend classical Chinese garden design with natural beauty, making it a popular place to experience Fuzhou's garden heritage and relaxed city life.",
  },

  highlights: [
    {
      zh: "西湖公园拥有悠久的园林历史，湖泊、亭台与传统建筑共同构成富有福州地方特色的古典园林景观",
      en: "The park's long garden history is reflected in its lakes, traditional pavilions and architecture, creating a distinctive classical landscape",
    },
    {
      zh: "园内湖岛相连，曲桥、湖岸与水面相互映衬，适合欣赏湖景、拍摄园林风光和体验宁静的城市绿地",
      en: "Connected islands, winding bridges and scenic waterfront paths offer picturesque lake views and peaceful green spaces within the city",
    },
    {
      zh: "西湖公园与周边文化场馆及城市公共空间相邻，可以将园林游览与福州历史文化体验结合起来",
      en: "The park's proximity to cultural venues and public spaces makes it easy to combine a garden visit with an exploration of Fuzhou's local history",
    },
  ],

  tags: [
    { zh: "古典园林", en: "Classical garden" },
    { zh: "湖岛风光", en: "Lake scenery" },
    { zh: "城市休闲", en: "Urban leisure" },
  ],

  ticket: {
    zh: "公园免费开放，部分独立项目可能收费",
    en: "Free park admission; some separate activities may charge fees",
  },

  duration: {
    zh: "1–1.5 小时",
    en: "1–1.5 hours",
  },

  hours: {
    zh: "具体开放时间及园内设施安排以公园现场公告为准",
    en: "Opening hours and facility schedules are subject to official park notices",
  },

  bestSeason: {
    zh: "四季",
    en: "All year",
  },

  coords: { lat: 26.0895, lng: 119.2836 },
  heat: 78,
},

{
  id: "fudao",
  name: { zh: "福州福道", en: "Fudao Trail" },
  category: "urban",
  district: { zh: "鼓楼区", en: "Gulou" },

  address: {
    zh: "福州市鼓楼区金牛山一带，设有多个出入口",
    en: "Jinniushan area, Gulou District, Fuzhou, with multiple access points",
  },

  summary: {
    zh: "福州福道是一条穿行于城市山林之间的特色空中步道，以蜿蜒延伸的钢结构栈道和独特的悬空设计闻名。步道依山势起伏，将森林景观、山地绿地与城市视野连接起来，让游客在林间漫步的同时，从不同高度欣赏福州的自然风光与城市景色。",
    en: "Fudao Trail is a distinctive elevated walkway winding through the forested hills of Fuzhou. Known for its curving steel structure and suspended design, the trail connects woodland scenery, hillside green spaces and urban viewpoints, allowing visitors to experience the city's natural landscape from different elevations.",
  },

  highlights: [
    {
      zh: "福道采用蜿蜒延伸的钢结构空中栈道设计，步道顺应山势穿行于林间，形成具有现代建筑特色的城市景观",
      en: "Its winding elevated steel walkway follows the contours of the hills, creating a distinctive modern architectural landmark within the urban forest",
    },
    {
      zh: "步道连接金牛山周边的山林与绿地，游客可以在树冠附近穿行，从不同角度欣赏森林景观与山地自然风光",
      en: "The trail links wooded hillsides and green spaces around Jinniushan, offering varied perspectives of the forest canopy and surrounding landscape",
    },
    {
      zh: "部分高处路段拥有开阔的城市视野，能够欣赏福州城区与山林交织的景观，适合观景摄影和休闲漫步",
      en: "Elevated sections offer sweeping views of Fuzhou's urban skyline framed by green hills, making the trail ideal for photography and leisurely walks",
    },
  ],

  tags: [
    { zh: "空中栈道", en: "Elevated walkway" },
    { zh: "城市森林", en: "Urban forest" },
    { zh: "建筑景观", en: "Architecture" },
  ],

  ticket: {
    zh: "公共步道免费开放",
    en: "Free access to the public walkway",
  },

  duration: {
    zh: "1.5–2 小时（分段游览）",
    en: "1.5–2 hours (selected sections)",
  },

  hours: {
    zh: "开放时间以景区公告为准，建议白天游览",
    en: "Opening hours are subject to official notices; daytime visits are recommended",
  },

  bestSeason: {
    zh: "秋、冬",
    en: "Autumn and winter",
  },

  coords: { lat: 26.0733, lng: 119.2627 },
  heat: 74,
},

{
  id: "mawei-shipyard",
  name: {
    zh: "中国船政文化城",
    en: "China Shipbuilding Culture City",
  },
  category: "heritage",
  district: { zh: "马尾区", en: "Mawei" },

  address: {
    zh: "福州市马尾区船政文化景区一带",
    en: "Shipbuilding heritage area, Mawei District, Fuzhou",
  },

  summary: {
    zh: "中国船政文化城位于福州马尾，是展示中国近代船政工业、海军教育与海防建设历史的重要文化区域。这里依托福建船政的历史遗存，通过船政主题展馆、近代工业遗迹和文化展示空间，呈现中国近代造船技术发展与海军人才培养的历史进程，是了解中国近代工业文明与海洋文化的重要窗口。",
    en: "Located in Mawei, Fuzhou, China Shipbuilding Culture City explores the history of modern Chinese shipbuilding, naval education and coastal defense. Through shipbuilding heritage sites, themed museums and industrial relics, the district illustrates the development of modern shipbuilding technology and naval training, offering insight into China's early industrial and maritime history.",
  },

  highlights: [
    {
      zh: "福建船政创办于1866年，是中国近代造船工业与海军教育发展的重要起点，相关历史展览展现了早期工业技术与海防建设的发展历程",
      en: "Founded in 1866, the Fujian Shipbuilding Administration played a pioneering role in modern Chinese shipbuilding and naval education, with exhibitions tracing early industrial and coastal defense developments",
    },
    {
      zh: "船政文化相关展馆通过历史文献、船舶模型和主题展陈，介绍近代造船技术、船政学堂及海军人才培养的历史",
      en: "Shipbuilding heritage museums use historical documents, ship models and themed displays to explore naval technology, shipbuilding schools and the training of maritime professionals",
    },
    {
      zh: "马尾船政历史遗存与近代工业建筑共同构成独特的工业文化景观，让游客能够从建筑与展览中感受中国近代工业发展的历程",
      en: "Historic shipbuilding sites and industrial architecture in Mawei create a distinctive heritage landscape that reflects the development of China's modern industry",
    },
  ],

  tags: [
    { zh: "船政文化", en: "Shipbuilding heritage" },
    { zh: "近代工业", en: "Modern industry" },
    { zh: "海军教育", en: "Naval education" },
  ],

  ticket: {
    zh: "公共区域可免费游览，部分展馆及体验项目可能收费",
    en: "Public areas may be visited free of charge; some museums and activities may charge admission",
  },

  duration: {
    zh: "2–3 小时",
    en: "2–3 hours",
  },

  hours: {
    zh: "各展馆开放时间及预约要求不同，建议提前查询官方公告",
    en: "Opening hours and reservation requirements vary by museum; check official notices before visiting",
  },

  bestSeason: {
    zh: "四季",
    en: "All year",
  },

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
