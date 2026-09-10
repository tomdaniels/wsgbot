import { CLASS_ROLES, getClassIndicator } from "../domain/classes.js";

export const createClassRolesPanel = () => ({
	content: [
		"## WELCOME",
		"",
		"What class would you play for wargames? Can be horde or alliance, signups are based on what you nominate below.",
		"",
		...CLASS_ROLES.map(
			(role) => `${getClassIndicator(role.name)} — ${role.name}`,
		),
	].join("\n"),
});
