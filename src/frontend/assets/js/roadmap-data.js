/**
 * Fallback roadmap items for local development and first deploys.
 * The release workflow overwrites this file from GitHub milestones so the
 * frontend can stay fully static while still showing fresh roadmap content.
 */
export const roadmapItems = [
	{
		title: "Interactief snackrad delen",
		category: "nu",
		status: "Live",
		description: "Deel je huidige Rad van Patat via een unieke link of QR-code zodat anderen exact hetzelfde rad openen.",
		icon: "share",
		progress: 100,
	},
	{
		title: "Friet of patat onboarding",
		category: "nu",
		status: "Live",
		description: "Nieuwe bezoekers krijgen een eenmalige keuze met toasts en een blijvende banner op basis van hun antwoord.",
		icon: "restaurant",
		progress: 100,
	},
	{
		title: "Roadmap automatisch uit GitHub milestones",
		category: "binnenkort",
		status: "In ontwikkeling",
		description: "Nieuwe releases vullen deze roadmap automatisch met milestone-informatie uit GitHub.",
		icon: "track_changes",
		progress: 70,
	},
	{
		title: "Meerdere snacklijsten beheren",
		category: "binnenkort",
		status: "Gepland",
		description: "Maak verschillende snacksets aan voor kantoor, familie of snackavond en wissel snel tussen die lijsten.",
		icon: "inventory_2",
		progress: 25,
	},
	{
		title: "Persoonlijke profielen en favorieten",
		category: "later",
		status: "Gepland",
		description: "Bewaar favoriete snacks en voorkeursinstellingen in een eigen profiel zodra de backend eraan hangt.",
		icon: "account_circle",
		progress: 0,
	},
	{
		title: "Slimme snacksuggesties",
		category: "later",
		status: "Gepland",
		description: "Laat het systeem op basis van stemming, historie of gelegenheid nog gerichter snacks voorstellen.",
		icon: "psychology",
		progress: 0,
	},
];
