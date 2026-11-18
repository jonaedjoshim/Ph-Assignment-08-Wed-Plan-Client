import type { ServiceCategory } from "@/lib/service-categories";

export type DemoService = {
  id: string;
  name: string;
  vendorName: string;
  category: ServiceCategory;
  location: string;
  startingPrice: number;
  description: string;
  artworkClass: string;
};

export const DEMO_SERVICES: DemoService[] = [
  {
    id: "golden-hour-photography",
    name: "Golden Hour Wedding Photography",
    vendorName: "Mira & Co. Photography",
    category: "Photography & Videography",
    location: "Dhaka, Bangladesh",
    startingPrice: 950,
    description: "Thoughtful wedding photography with a warm, natural style.",
    artworkClass: "bg-gradient-to-br from-rose-200 via-amber-100 to-orange-200",
  },
  {
    id: "ever-after-films",
    name: "Ever After Wedding Films",
    vendorName: "Ever After Films",
    category: "Photography & Videography",
    location: "Chattogram, Bangladesh",
    startingPrice: 1200,
    description:
      "Cinematic films that capture the feeling of your celebration.",
    artworkClass: "bg-gradient-to-br from-slate-200 via-stone-100 to-rose-200",
  },
  {
    id: "courtyard-estate",
    name: "The Courtyard Estate",
    vendorName: "Courtyard Events",
    category: "Wedding Venues",
    location: "Dhaka, Bangladesh",
    startingPrice: 2800,
    description: "An elegant event space for intimate and larger celebrations.",
    artworkClass:
      "bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-200",
  },
  {
    id: "lakeside-pavilion",
    name: "Lakeside Pavilion",
    vendorName: "Lakeside Gatherings",
    category: "Wedding Venues",
    location: "Sylhet, Bangladesh",
    startingPrice: 2200,
    description:
      "A relaxed venue with a beautiful setting for your wedding day.",
    artworkClass: "bg-gradient-to-br from-sky-200 via-cyan-100 to-emerald-200",
  },
  {
    id: "petal-and-paper",
    name: "Petal & Paper Decorations",
    vendorName: "Petal & Paper Studio",
    category: "Decoration & Florist",
    location: "Dhaka, Bangladesh",
    startingPrice: 700,
    description:
      "Personalised floral styling and thoughtful event decorations.",
    artworkClass: "bg-gradient-to-br from-pink-200 via-rose-100 to-lime-100",
  },
  {
    id: "table-and-thyme",
    name: "Table & Thyme Catering",
    vendorName: "Table & Thyme",
    category: "Catering Services",
    location: "Chattogram, Bangladesh",
    startingPrice: 1100,
    description:
      "A flexible catering service for wedding celebrations and events.",
    artworkClass:
      "bg-gradient-to-br from-orange-200 via-amber-100 to-yellow-200",
  },
  {
    id: "blush-studio",
    name: "Blush Studio Bridal Styling",
    vendorName: "Blush Studio",
    category: "Makeup & Styling",
    location: "Dhaka, Bangladesh",
    startingPrice: 450,
    description: "Bridal makeup and styling tailored to your preferred look.",
    artworkClass:
      "bg-gradient-to-br from-fuchsia-200 via-pink-100 to-orange-100",
  },
  {
    id: "wedding-edit",
    name: "The Wedding Edit",
    vendorName: "The Wedding Edit Studio",
    category: "Wedding Fashion",
    location: "Dhaka, Bangladesh",
    startingPrice: 650,
    description: "Wedding fashion and outfit styling for your special day.",
    artworkClass: "bg-gradient-to-br from-violet-200 via-rose-100 to-amber-100",
  },
];
