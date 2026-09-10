import { ChannelType, SlashCommandBuilder } from "discord.js";
import { CLASS_ROLES, getClassIndicator } from "../domain/classes.js";
import { readOnlyChannelOverwrites } from "../utils/channelPermissions.js";
import { findOrCreateChannel } from "../utils/findOrCreateChannel.js";
import { findOrCreateRole } from "../utils/findOrCreateRole.js";
import {
	loadClassRolesData,
	saveClassRolesData,
} from "../utils/classRolesStore.js";
import { createClassRolesPanel } from "../ui/classRolesPanel.js";

export const data = new SlashCommandBuilder()
	.setName("class-roles")
	.setDescription("Post the class role picker message");

const findExistingMessage = async (guild, panel) => {
	if (!panel) {
		return null;
	}

	const channel = await guild.channels.fetch(panel.channelId).catch(() => null);

	if (!channel?.isTextBased()) {
		return null;
	}

	return channel.messages.fetch(panel.messageId).catch(() => null);
};

export const execute = async (interaction) => {
	const guild = interaction.guild;

	await interaction.deferReply({ flags: 64 });

	for (const role of CLASS_ROLES) {
		await findOrCreateRole(guild, role);
	}

	const data = await loadClassRolesData();
	const existingMessage = await findExistingMessage(guild, data.panels[guild.id]);

	const textCategory = guild.channels.cache.find(
		(channel) =>
			channel.type === ChannelType.GuildCategory &&
			channel.name.toLowerCase() === "text channels",
	);

	const channel =
		existingMessage?.channel ??
		(await findOrCreateChannel(guild, {
			name: "class-roles",
			type: ChannelType.GuildText,
			parentId: textCategory?.id ?? null,
			permissionOverwrites: readOnlyChannelOverwrites(guild),
		}));

	const message = existingMessage
		? await existingMessage.edit(createClassRolesPanel())
		: await channel.send(createClassRolesPanel());

	for (const role of CLASS_ROLES) {
		await message.react(getClassIndicator(role.name));
	}

	const currentIndicators = new Set(CLASS_ROLES.map((role) => getClassIndicator(role.name)));

	for (const reaction of message.reactions.cache.values()) {
		if (!currentIndicators.has(reaction.emoji.name)) {
			await reaction.remove();
		}
	}

	if (existingMessage) {
		await interaction.editReply(
			`Updated the existing class role message in ${message.channel}.`,
		);

		return;
	}

	data.panels[guild.id] = {
		channelId: message.channelId,
		messageId: message.id,
	};

	await saveClassRolesData(data);

	await interaction.editReply(`Posted the class role message in ${message.channel}.`);
};
