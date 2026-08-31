import { iconUrl } from "../lib/icons";

export type TagCategory =
  | "Research"
  | "Strategy"
  | "UX Design"
  | "UI Design"
  | "Engineering"
  | "Design Systems"
  | "Neutral";

export type Client = {
  name: string;
  label?: string;
  logo?: string;
  logos?: string[];
  logoClass?: string;
  icon?: string;
  href?: string;
  surface?: "light" | "cyan" | "navy" | "asset" | "teal" | "deep";
};

export type Work = {
  id: "lpa" | "failfast" | "pelt8" | "pr";
  name: string;
  logo?: string;
  clients?: Client[];
  ctaLabel: string;
  ctaHref?: string;
};

export const works: Work[] = [
  {
    id: "lpa",
    name: "LPA",
    logo: iconUrl("work-lpa.svg"),
    clients: [
      {
        name: "Capmatix",
        logo: iconUrl("client-capmatix.png"),
        logoClass: "client-bubble__logo--capmatix",
        surface: "light",
      },
      {
        name: "Hedge Pilot",
        logo: "",
        logos: [
          iconUrl("client-hedgepilot-a.svg"),
          iconUrl("client-hedgepilot-b.svg"),
          iconUrl("client-hedgepilot-c.svg"),
        ],
        logoClass: "client-bubble__logo--hedgepilot",
        surface: "light",
      },
    ],
    ctaLabel: "See case study",
  },
  {
    id: "failfast",
    name: "FailFast",
    logo: iconUrl("work-failfast.svg"),
    clients: [
      {
        name: "La Meva Salut",
        label: "La Meva Salut",
        logo: iconUrl("client-lms.png"),
        logoClass: "client-bubble__logo--lms",
        href: "/blog/caso-estudio-onboarding/",
        surface: "light",
      },
      {
        name: "Base Sport",
        logo: iconUrl("client-base.png"),
        logoClass: "client-bubble__logo--base",
        surface: "light",
      },
      {
        name: "UOC",
        logo: iconUrl("client-uoc.svg"),
        logoClass: "client-bubble__logo--uoc",
        surface: "cyan",
      },
      {
        name: "Hospital Sant Joan de Déu",
        logo: iconUrl("client-hsjd.svg"),
        logoClass: "client-bubble__logo--asset",
        surface: "asset",
      },
      {
        name: "Barça",
        logo: iconUrl("client-barca.svg"),
        logoClass: "client-bubble__logo--barca",
        surface: "light",
      },
      {
        name: "TimeChef",
        logo: iconUrl("client-timechef.png"),
        logoClass: "client-bubble__logo--timechef",
        surface: "light",
      },
    ],
    ctaLabel: "See all work",
  },
  {
    id: "pelt8",
    name: "Pelt8",
    logo: iconUrl("work-pelt8.svg"),
    clients: [
      { name: "ESG B2B SaaS", icon: "MonitorCloud", surface: "teal" },
      { name: "Product UX/UI", icon: "PanelsTopLeft", surface: "deep" },
      { name: "Complex data flows", icon: "Workflow", surface: "teal" },
      { name: "Design System", icon: "Component", surface: "deep" },
      { name: "Engineering collaboration", icon: "CodeXml", surface: "teal" },
      { name: "Brand & Website", icon: "Monitor", surface: "deep" },
    ],
    ctaLabel: "See case study",
  },
  {
    id: "pr",
    name: "Paula Rodas",
    clients: [
      {
        name: "AIWIRA",
        logo: iconUrl("client-pr-lms.svg"),
        logoClass: "client-bubble__logo--asset",
        surface: "asset",
      },
      { name: "Medusa Watch", logo: "", surface: "navy" },
    ],
    ctaLabel: "See all cases",
  },
];
