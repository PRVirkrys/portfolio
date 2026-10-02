import { iconUrl } from "../lib/icons";
import { withBase } from "../lib/url";
import { companyWorkPath, type WorkCompanyId } from "./work-companies";

export type TagCategory =
  | "Research"
  | "Strategy"
  | "UX Design"
  | "UI Design"
  | "Engineering"
  | "Design Systems"
  | "Branding"
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
  id: WorkCompanyId;
  name: string;
  logo?: string;
  clients?: Client[];
  ctaLabel: string;
  ctaHref?: string;
  /** Bubble links straight here instead of opening a clients panel. */
  href?: string;
};

export const works: Work[] = [
  {
    id: "lpa",
    ctaHref: withBase(companyWorkPath("lpa")),
    name: "LPA",
    logo: iconUrl("work-lpa.svg"),
    clients: [
      {
        name: "Capmatix",
        href: withBase("/work/lpa-caso-estudio/"),
        logo: iconUrl("client-capmatix.png"),
        logoClass: "client-bubble__logo--capmatix",
        surface: "light",
      },
      {
        name: "Hedge Pilot",
        href: withBase("/work/lpa-caso-estudio/"),
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
    ctaHref: withBase(companyWorkPath("failfast")),
    name: "FailFast",
    logo: iconUrl("work-failfast.svg"),
    clients: [
      {
        name: "La Meva Salut",
        label: "La Meva Salut",
        logo: iconUrl("client-lms.png"),
        logoClass: "client-bubble__logo--lms",
        // No case study yet; add `href` back once it's published.
        surface: "light",
      },
      {
        name: "Base Sport",
        href: withBase("/work/base-caso-estudio/"),
        logo: iconUrl("client-base.png"),
        logoClass: "client-bubble__logo--base",
        surface: "light",
      },
      {
        name: "Universitat Oberta de Catalunya",
        href: withBase("/work/uoc-catalogo-experiencia-decision/"),
        logo: iconUrl("client-uoc.svg"),
        logoClass: "client-bubble__logo--uoc",
        surface: "cyan",
      },
      {
        name: "Hospital Sant Joan de Déu",
        href: withBase("/work/hsjd-caso-estudio/"),
        logo: iconUrl("client-hsjd.svg"),
        logoClass: "client-bubble__logo--asset",
        surface: "asset",
      },
      /*
      {
        name: "Barça",
        logo: iconUrl("client-barca.svg"),
        logoClass: "client-bubble__logo--barca",
        surface: "light",
      }, */
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
    ctaHref: withBase(companyWorkPath("pelt8")),
    name: "Pelt8",
    logo: iconUrl("work-pelt8.svg"),
    href: withBase("/work/pelt8-caso-estudio/"),
    ctaLabel: "See case study",
  },
  {
    id: "pr",
    ctaHref: withBase(companyWorkPath("pr")),
    name: "Paula Rodas",
    clients: [
      {
        name: "AIWIRA",
        logo: iconUrl("client-pr-lms.svg"),
        logoClass: "client-bubble__logo--asset",
        surface: "asset",
      },
      { name: "Medusa Watch", href: withBase("/work/medusawatch-caso-estudio/"), logo: "", surface: "navy" },
    ],
    ctaLabel: "See all cases",
  },
];
