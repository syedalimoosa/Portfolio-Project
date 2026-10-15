export type ProjectGroup = "Shopify" | "WordPress" | "Custom";

export type Project = {
  name: string;
  category: string;
  platform: string;
  group: ProjectGroup;
  description: string;
  url: string;
  image?: string;
};

export const projects: Project[] = [
  { name: "Airbon", category: "Home / Air care", platform: "Shopify", group: "Shopify", description: "A Shopify storefront for clean-air furniture.", url: "https://www.airbon.co.uk", image: "/images/airbon-product.png" },
  { name: "Premier Collective", category: "Real estate / Nashville", platform: "WordPress", group: "WordPress", description: "A Nashville real estate team website for buyers, sellers, and homeowners.", url: "https://premiercollectivetn.com/", image: "/images/premier-collective.png" },
  { name: "CMB Gamer Tournaments", category: "Gaming / Tournaments", platform: "Custom Web", group: "Custom", description: "A gaming tournament website.", url: "https://cmbgamertornaments.com/", image: "/images/cmb-gamer-tournaments.png" },
  { name: "Mental Motivations", category: "Wellness / Care", platform: "WordPress", group: "WordPress", description: "A mental wellness and psychiatric care website.", url: "https://mentalmotivations.com/", image: "/images/mental-motivations.png" },
  { name: "Neighborhood News Network", category: "News / Community", platform: "WordPress", group: "WordPress", description: "A neighborhood news and community website.", url: "https://neighborhoodnewsnetwork.news/", image: "/images/neighborhood-news.png" },
  { name: "Unisphere Services", category: "Business / Services", platform: "WordPress", group: "WordPress", description: "A business services website.", url: "https://unisphereservices.ca", image: "/images/unisphere.png" },
  { name: "Portioned", category: "SaaS / Product", platform: "WordPress", group: "WordPress", description: "A product website for Portioned.", url: "https://portioned.app", image: "/images/portioned.png" },
  { name: "Prime Aesthetics", category: "Beauty / Storefront", platform: "Shopify", group: "Shopify", description: "An online storefront for Prime Aesthetics.", url: "https://preimeaesthetics.myshopify.com", image: "/images/prime-aesthetics.png" },
  { name: "Apps Vega", category: "Agency / Digital", platform: "Custom PHP / Web", group: "Custom", description: "A website for Apps Vega.", url: "https://www.appsvega.com", image: "/images/apps-vega.png" },
];

