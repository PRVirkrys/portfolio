import { iconUrl } from '../lib/icons';

export type TagCategory = 'Research' | 'Strategy' | 'UX Design' | 'UI Design' | 'Engineering' | 'Design Systems' | 'Neutral';

export type Client = {
	name: string;
	logo: string;
	logos?: string[];
	logoClass?: string;
	href?: string;
	surface?: 'light' | 'cyan' | 'navy' | 'asset';
};

export type Work = {
	id: 'lpa' | 'failfast' | 'pelt8' | 'pr';
	name: string;
	logo?: string;
	clients?: Client[];
	tags?: { label: string; category: TagCategory }[];
	ctaLabel: string;
	ctaHref?: string;
};

export const works: Work[] = [
	{
		id: 'lpa',
		name: 'LPA',
		logo: iconUrl('work-lpa.svg'),
		clients: [
			{ name: 'Capmatix', logo: iconUrl('client-capmatix.png'), logoClass: 'client-bubble__logo--capmatix', surface: 'light' },
			{ name: 'HedgePilot', logo: '', logos: [iconUrl('client-hedgepilot-a.svg'), iconUrl('client-hedgepilot-b.svg'), iconUrl('client-hedgepilot-c.svg')], logoClass: 'client-bubble__logo--hedgepilot', surface: 'light' },
		],
		ctaLabel: 'See case study',
	},
	{
		id: 'failfast',
		name: 'FailFast',
		logo: iconUrl('work-failfast.svg'),
		clients: [
			{ name: 'LMS', logo: iconUrl('client-lms.png'), logoClass: 'client-bubble__logo--lms', href: '/blog/caso-estudio-onboarding/', surface: 'light' },
			{ name: 'Base', logo: iconUrl('client-base.png'), logoClass: 'client-bubble__logo--base', surface: 'light' },
			{ name: 'UOC', logo: iconUrl('client-uoc.svg'), logoClass: 'client-bubble__logo--uoc', surface: 'cyan' },
			{ name: 'HSJD', logo: iconUrl('client-hsjd.svg'), logoClass: 'client-bubble__logo--asset', surface: 'asset' },
			{ name: 'Barca', logo: iconUrl('client-barca.svg'), logoClass: 'client-bubble__logo--barca', surface: 'light' },
			{ name: 'TimeChef', logo: iconUrl('client-timechef.png'), logoClass: 'client-bubble__logo--timechef', surface: 'light' },
		],
		ctaLabel: 'See all work',
	},
	{
		id: 'pelt8',
		name: 'Pelt8',
		logo: iconUrl('work-pelt8.svg'),
		tags: [
			{ label: 'ESG reporting', category: 'Research' },
			{ label: 'B2B SaaS', category: 'Strategy' },
			{ label: 'Information architecture', category: 'UX Design' },
			{ label: 'Complex flows', category: 'UX Design' },
			{ label: 'Metrics & reporting', category: 'UX Design' },
			{ label: 'Product UX/UI', category: 'UI Design' },
			{ label: 'Data dashboards', category: 'UI Design' },
			{ label: 'Design system', category: 'Design Systems' },
			{ label: 'Components & docs', category: 'Design Systems' },
			{ label: 'Engineering collaboration', category: 'Engineering' },
			{ label: 'UX & visual QA', category: 'UI Design' },
			{ label: 'Framer + CMS', category: 'Engineering' },
			{ label: 'No-code automations', category: 'Engineering' },
			{ label: 'HTML/CSS emails', category: 'Engineering' },
			{ label: 'Brand identity', category: 'Strategy' },
		],
		ctaLabel: 'See case study',
	},
	{
		id: 'pr',
		name: 'Paula Rodas',
		clients: [
			{ name: 'LMS', logo: iconUrl('client-pr-lms.svg'), logoClass: 'client-bubble__logo--asset', surface: 'asset' },
			{ name: 'Jellyfish', logo: '', surface: 'navy' },
		],
		ctaLabel: 'See case study',
	},
];
