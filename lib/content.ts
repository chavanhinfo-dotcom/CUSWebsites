// All site copy lives here. Edit this file to update text without touching components.
// Source: Chavan_Udyog_Samuh_Company_Profile.docx

export const company = {
  name: "Chavan Udyog Samuh",
  tagline: "Solapur's Diversified Business Conglomerate",
  since: 1960,
  hq: "Solapur, Maharashtra",
  motto: "Legacy. Growth. Trust.",
};

export const navLinks = [
  { href: "#about", label: "About" },
  { href: "#legacy", label: "Legacy" },
  { href: "#businesses", label: "Businesses" },
  { href: "#journey", label: "Journey" },
  { href: "#presence", label: "Presence" },
];

export const heroSlides = [
  { src: "/images/showroom-luxury.jpg", label: "Passenger Cars" },
  { src: "/images/bike-riders.jpg", label: "Two-Wheelers" },
  { src: "/images/truck-street.jpg", label: "Commercial Vehicles" },
  { src: "/images/appliance-kitchen.jpg", label: "Home Appliances" },
];

export const stats = [
  { value: 65, suffix: "+", label: "Years of trust" },
  { value: 4, suffix: "", label: "Business verticals" },
  { value: 10, suffix: "+", label: "Brand partnerships" },
  { value: 2, suffix: "", label: "States" },
  { value: 4, suffix: "", label: "Districts served" },
];

export const about = {
  lead:
    "Chavan Udyog Samuh is one of the fastest-growing and most diversified business groups in Solapur, Maharashtra. With a legacy of more than six decades, the group has grown from a small yarn trading business into a multi-sector enterprise spanning appliances, two-wheelers, four-wheelers, and commercial vehicles.",
  closing:
    "Our growth has been built on trust, service excellence, and a lasting commitment to our customers.",
};

export const legacy = [
  {
    generation: "The Founder",
    era: "1960",
    people: [
      {
        name: "Late Mr. Ambadas U. Chavan",
        initials: "AC",
        role: "Founder",
        text: "Began with trading yarn and long cloth. His deep understanding of trade laid the foundation for everything the group is today.",
      },
    ],
  },
  {
    generation: "Second Generation",
    era: "Growth & diversification",
    people: [
      {
        name: "Mr. Shivprakash Chavan",
        initials: "SC",
        role: "Leadership",
        text: "An experienced veteran of the trading and service industries, driving steady growth and diversification.",
      },
      {
        name: "Mr. Ghanshyam Chavan",
        initials: "GC",
        role: "Leadership",
        text: "An experienced veteran of the trading and service industries, driving steady growth and diversification.",
      },
    ],
  },
  {
    generation: "Next Generation",
    era: "Future-ready",
    people: [
      {
        name: "Mr. Purushottam Chavan",
        initials: "PC",
        role: "Next-generation leader",
        text: "Son of Mr. Shivprakash Chavan, positioning the group for a future-ready transformation.",
      },
    ],
  },
];

export const verticals = [
  {
    id: "appliances",
    index: "01",
    title: "Home Appliances",
    summary:
      "Retail and distribution of home appliances since 1984, including the Samsung Exclusive Plaza.",
    brands: ["Samsung Exclusive Plaza", "Retail", "Distribution"],
    image: "/images/appliance-fridge.jpg",
    since: 1984,
  },
  {
    id: "two-wheelers",
    index: "02",
    title: "Two-Wheelers",
    summary:
      "From Kinetic Honda in 1990 to electric mobility today: a full spectrum of two-wheeler dealerships.",
    brands: ["Hero MotoCorp", "Royal Enfield", "Ather Electric", "Kinetic Honda"],
    image: "/images/bike-enfield.jpg",
    since: 1990,
  },
  {
    id: "cars",
    index: "03",
    title: "Passenger Cars",
    summary:
      "Maruti Suzuki Arena and Nexa showrooms, plus a multi-brand showroom and workshop.",
    brands: ["Maruti Suzuki Arena", "Nexa", "Multi-brand showroom", "Workshop"],
    image: "/images/hero-showroom.jpg",
    since: 2004,
  },
  {
    id: "commercial",
    index: "04",
    title: "Commercial Vehicles",
    summary:
      "Tata Commercial across SCV and the full range, alongside Maruti Commercial, moving the region's businesses.",
    brands: ["Tata Commercial SCV", "Tata Full Range", "Maruti Commercial"],
    image: "/images/truck-rural.jpg",
    since: 2013,
  },
];

export const brands = [
  "Samsung",
  "Hero MotoCorp",
  "Royal Enfield",
  "Ather Electric",
  "Kinetic Honda",
  "Maruti Suzuki Arena",
  "Nexa",
  "Tata Commercial",
  "Maruti Commercial",
  "Hero Premia",
];

export type Category = "heritage" | "appliances" | "two-wheelers" | "cars" | "commercial";

export const categoryMeta: Record<Category, { label: string; image: string }> = {
  heritage: { label: "Heritage", image: "/images/yarn-spools.jpg" },
  appliances: { label: "Appliances", image: "/images/appliance-washer.jpg" },
  "two-wheelers": { label: "Two-Wheelers", image: "/images/bike-road.jpg" },
  cars: { label: "Cars", image: "/images/car-floor.jpg" },
  commercial: { label: "Commercial", image: "/images/truck-red.jpg" },
};

// `short` is the signboard name shown on each building in the 3D journey (Option B)
export const milestones: { year: number; title: string; short: string; category: Category; image?: string }[] = [
  { year: 1960, title: "Founded with Yarn Trading", short: "Yarn & Cloth Trading", category: "heritage", image: "/images/yarn-threads.jpg" },
  { year: 1984, title: "Entered Home Appliances", short: "Home Appliances", category: "appliances", image: "/images/appliance-washer.jpg" },
  { year: 1990, title: "Kinetic Engineering and Kinetic Honda", short: "Kinetic Honda", category: "two-wheelers", image: "/images/scooter-blue.jpg" },
  { year: 1996, title: "Distribution of Home Appliances", short: "Appliance Distribution", category: "appliances", image: "/images/appliance-kitchen.jpg" },
  { year: 2004, title: "Multi-Brand Car Showroom and Workshop", short: "Multi-Brand Cars", category: "cars", image: "/images/car-key.jpg" },
  { year: 2005, title: "Samsung Exclusive Plaza", short: "Samsung Plaza", category: "appliances", image: "/images/appliance-fridge.jpg" },
  { year: 2007, title: "Hero Honda Dealership", short: "Hero Honda", category: "two-wheelers", image: "/images/bike-road.jpg" },
  { year: 2010, title: "Maruti Suzuki Dealership", short: "Maruti Suzuki", category: "cars", image: "/images/hero-showroom.jpg" },
  { year: 2013, title: "Tata Commercial SCV Dealership", short: "Tata SCV", category: "commercial", image: "/images/truck-red.jpg" },
  { year: 2015, title: "Royal Enfield Dealership", short: "Royal Enfield", category: "two-wheelers", image: "/images/bike-enfield.jpg" },
  { year: 2016, title: "Tata Commercial Full Range Dealership; Nexa Dealership", short: "Tata Motors · Nexa", category: "commercial", image: "/images/truck-street.jpg" },
  { year: 2017, title: "Maruti Commercial Dealership", short: "Maruti Commercial", category: "commercial", image: "/images/truck-rural.jpg" },
  { year: 2019, title: "Arena Showroom Upgradation", short: "Arena", category: "cars", image: "/images/showroom-luxury.jpg" },
  { year: 2022, title: "Nexa Dealership at Bijapur", short: "Nexa Bijapur", category: "cars", image: "/images/car-floor.jpg" },
  { year: 2023, title: "Ather Electric Scooter Dealership", short: "Ather Electric", category: "two-wheelers", image: "/images/speedometer.jpg" },
  { year: 2025, title: "Hero MotoCorp Premia", short: "Hero Premia", category: "two-wheelers", image: "/images/bike-riders.jpg" },
];

// lon/lat used to place pins on the presence map
export const presence = [
  { state: "Maharashtra", districts: [
    { name: "Solapur", lon: 75.91, lat: 17.66, hq: true },
    { name: "Dharashiv", lon: 76.04, lat: 18.18 },
  ] },
  { state: "Karnataka", districts: [
    { name: "Bijapur", lon: 75.71, lat: 16.83 },
    { name: "Bagalkot", lon: 75.7, lat: 16.18 },
  ] },
];

export const future = {
  heading: "Building on heritage. Moving toward what's next.",
  text: "With the next generation now at the helm, Chavan Udyog Samuh is building on its heritage while moving toward a future-ready, customer-first business model. Our commitment stays the same: growth, service excellence, and customer trust.",
  pillars: ["Growth", "Service excellence", "Customer trust"],
};

// Short descriptions for each stop of the journey, drawn from the company profile.
export const stopNotes: Record<Category, string> = {
  heritage: "Late Mr. Ambadas U. Chavan began trading yarn and long cloth. His understanding of trade laid the foundation for everything the group is today.",
  appliances: "Retail and distribution of home appliances, including the Samsung Exclusive Plaza.",
  "two-wheelers": "Two-wheeler dealerships spanning Kinetic Honda, Hero MotoCorp, Royal Enfield and Ather Electric.",
  cars: "Maruti Suzuki Arena and Nexa showrooms, plus a multi-brand showroom and workshop.",
  commercial: "Tata Commercial across SCV and the full range, alongside Maruti Commercial.",
};

// Answers use only facts from the company profile.
export const faq = [
  {
    q: "When was Chavan Udyog Samuh founded?",
    a: "The group was founded in 1960 by Late Mr. Ambadas U. Chavan, whose entrepreneurial vision began with trading yarn and long cloth.",
  },
  {
    q: "Which businesses does the group operate?",
    a: "Four verticals: home appliances (retail and distribution, including Samsung Exclusive Plaza), two-wheelers, passenger cars, and commercial vehicles.",
  },
  {
    q: "Which brands do you represent?",
    a: "Samsung, Hero MotoCorp, Royal Enfield, Ather Electric, Kinetic Honda, Maruti Suzuki (Arena and Nexa), Tata Commercial and Maruti Commercial.",
  },
  {
    q: "Where do you operate?",
    a: "Across Maharashtra (Solapur and Dharashiv) and Karnataka (Bijapur and Bagalkot), with our head office in Solapur.",
  },
  {
    q: "Who leads the group today?",
    a: "Mr. Shivprakash Chavan and Mr. Ghanshyam Chavan lead the group, with Mr. Purushottam Chavan, the next-generation leader, positioning it for a future-ready transformation.",
  },
  {
    q: "What is next for the group?",
    a: "Building on its heritage while moving toward a future-ready, customer-first business model, with the same commitment to growth, service excellence and customer trust.",
  },
];
