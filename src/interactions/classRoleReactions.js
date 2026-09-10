import { CLASS_ROLES, getClassByIndicator } from "../domain/classes.js";
import { findOrCreateRole } from "../utils/findOrCreateRole.js";
import { loadClassRolesData } from "../utils/classRolesStore.js";

const isClassRolesPanelMessage = async (message) => {
	if (!message.guildId) {
		return false;
	}

	const data = await loadClassRolesData();
	const panel = data.panels[message.guildId];

	return panel?.messageId === message.id;
};

const resolveClassRoleReaction = async (reaction, user) => {
	if (user.bot) {
		return null;
	}

	if (reaction.partial) {
		reaction = await reaction.fetch();
	}

	if (reaction.message.partial) {
		await reaction.message.fetch();
	}

	const classRole = CLASS_ROLES.find(
		(role) => role.name === getClassByIndicator(reaction.emoji.name),
	);

	if (!classRole || !(await isClassRolesPanelMessage(reaction.message))) {
		return null;
	}

	const guild = reaction.message.guild;
	const member = await guild.members.fetch(user.id);

	return { classRole, guild, member };
};

export const handleReactionAdd = async (reaction, user) => {
	const resolved = await resolveClassRoleReaction(reaction, user);

	if (!resolved) {
		return;
	}

	const { classRole, guild, member } = resolved;
	const role = await findOrCreateRole(guild, classRole);

	await member.roles.add(role);
};

export const handleReactionRemove = async (reaction, user) => {
	const resolved = await resolveClassRoleReaction(reaction, user);

	if (!resolved) {
		return;
	}

	const { classRole, guild, member } = resolved;
	const role = guild.roles.cache.find((role) => role.name === classRole.name);

	if (role) {
		await member.roles.remove(role);
	}
};
