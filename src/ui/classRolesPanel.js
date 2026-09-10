import { CLASS_ROLES, getClassIndicator } from "../domain/classes.js";

export const createClassRolesPanel = () => ({
	content: [
		"## WELCOME - PICK YOUR CLASS",
		"",
		"React with your class to get the matching role. You will be able to sign up to games for that class based on which roles are assigned.",
		"",
		...CLASS_ROLES.map(
			(role) => `${getClassIndicator(role.name)} — ${role.name}`,
		),
	].join("\n"),
});
