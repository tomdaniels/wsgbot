import { ChannelType, SlashCommandBuilder } from "discord.js";
import { ORGANIZER_ROLE } from "../domain/classes.js";
import { organizerOnlyChannelOverwrites } from "../utils/channelPermissions.js";
import { findOrCreateChannel } from "../utils/findOrCreateChannel.js";
import { findOrCreateRole } from "../utils/findOrCreateRole.js";
import * as classRolesCommand from "./classRoles.js";
import * as rosterCommand from "./roster.js";
import * as wargameCommand from "./wargame.js";

const GUILD_COMMANDS = [wargameCommand, rosterCommand, classRolesCommand];

export const data = new SlashCommandBuilder()
	.setName("init")
	.setDescription("Set up voice channels, the Organizer role, and commands for this server");

export const execute = async (interaction) => {
	const guild = interaction.guild;

	await interaction.deferReply({ flags: 64 });

	await guild.commands.set(GUILD_COMMANDS.map((command) => command.data.toJSON()));

	const voiceCategory = guild.channels.cache.find(
		(channel) =>
			channel.type === ChannelType.GuildCategory &&
			channel.name.toLowerCase() === "voice channels",
	);

	const organizerRole = await findOrCreateRole(guild, ORGANIZER_ROLE);

	await findOrCreateChannel(guild, {
		name: "games",
		type: ChannelType.GuildVoice,
		parentId: voiceCategory?.id ?? null,
	});

	await findOrCreateChannel(guild, {
		name: "pugs",
		type: ChannelType.GuildVoice,
		parentId: voiceCategory?.id ?? null,
	});

	await findOrCreateChannel(guild, {
		name: "sidebar",
		type: ChannelType.GuildVoice,
		parentId: voiceCategory?.id ?? null,
		permissionOverwrites: organizerOnlyChannelOverwrites(guild, organizerRole.id),
	});

	await interaction.editReply(
		"Init complete: commands, the Organizer role, and voice channels are ready. Run /class-roles and /wargame to set up their own channels.",
	);
};
