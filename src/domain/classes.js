export const CLASS_ROLES = [
	{ name: "Druid", color: 0xff7d0a },
	{ name: "Hunter", color: 0xabd473 },
	{ name: "Mage", color: 0x69ccf0 },
	{ name: "Paladin", color: 0xf58cba },
	{ name: "Priest", color: 0xffffff },
	{ name: "Rogue", color: 0xfff569 },
	{ name: "Shaman", color: 0x0070dd },
	{ name: "Warlock", color: 0x9482c9 },
	{ name: "Warrior", color: 0xc79c6e },
];

export const ORGANIZER_ROLE = { name: "Organizer", color: 0x7daea3 };

export const ALL_ROLES = [...CLASS_ROLES, ORGANIZER_ROLE];

const CLASS_INDICATORS = {
	Druid: "🟠",
	Hunter: "🟢",
	Mage: "🔵",
	Paladin: "🌸",
	Priest: "⚪",
	Rogue: "🟡",
	Shaman: "🟦",
	Warlock: "🟣",
	Warrior: "🟤",
};

export const getClassIndicator = (className) =>
	CLASS_INDICATORS[className] ?? "⚪";

export const getClassByIndicator = (indicator) =>
	CLASS_ROLES.find((role) => CLASS_INDICATORS[role.name] === indicator)?.name;

export const getMemberClasses = (member) =>
	CLASS_ROLES.filter((role) =>
		member.roles.cache.some((memberRole) => memberRole.name === role.name),
	).map((role) => role.name);

export const memberHasRole = (member, roleName) =>
	member.roles.cache.some((memberRole) => memberRole.name === roleName);
