import { ChannelType, SlashCommandBuilder } from "discord.js";
import { ALL_ROLES } from "../domain/classes.js";
import { findOrCreateChannel } from "../utils/findOrCreateChannel.js";
import { findOrCreateRole } from "../utils/findOrCreateRole.js";

export const data = new SlashCommandBuilder()
	.setName("setup")
	.setDescription("Set up the WSG signup server");

export const execute = async (interaction) => {
	const guild = interaction.guild;

	await interaction.deferReply({ flags: 64 });

	const textCategory = guild.channels.cache.find(
		(channel) =>
			channel.type === ChannelType.GuildCategory &&
			channel.name.toLowerCase() === "text channels",
	);

	const voiceCategory = guild.channels.cache.find(
		(channel) =>
			channel.type === ChannelType.GuildCategory &&
			channel.name.toLowerCase() === "voice channels",
	);

	if (!textCategory) {
		await interaction.editReply("Couldn't find the Text channels category.");
		return;
	}

	if (!voiceCategory) {
		await interaction.editReply("Couldn't find the Voice Channels category.");
		return;
	}

	const welcome = await findOrCreateChannel(guild, {
		name: "welcome",
		type: ChannelType.GuildText,
		parentId: textCategory.id,
	});

	const wargame = await findOrCreateChannel(guild, {
		name: "wargame",
		type: ChannelType.GuildText,
		parentId: textCategory.id,
	});

	for (const role of ALL_ROLES) {
		await findOrCreateRole(guild, role);
	}

	await findOrCreateChannel(guild, {
		name: "games",
		type: ChannelType.GuildVoice,
		parentId: voiceCategory.id,
	});

	await findOrCreateChannel(guild, {
		name: "pugs",
		type: ChannelType.GuildVoice,
		parentId: voiceCategory.id,
	});

	await findOrCreateChannel(guild, {
		name: "sidebar",
		type: ChannelType.GuildVoice,
		parentId: voiceCategory.id,
	});

	await interaction.editReply(
		`Setup complete: ${welcome} and ${wargame}. Roles and voice channels are ready.`,
	);
};
