import { ChannelType, SlashCommandBuilder } from "discord.js";
import { createEvent } from "../domain/wargame.js";
import { FACTION_LABELS, FACTIONS } from "../domain/factions.js";
import { readOnlyChannelOverwrites } from "../utils/channelPermissions.js";
import { findOrCreateChannel } from "../utils/findOrCreateChannel.js";
import { loadWargameData, saveWargameData } from "../utils/wargameStore.js";
import { createSignupPanel } from "../ui/signupPanel.js";

export const data = new SlashCommandBuilder()
	.setName("wargame")
	.setDescription("Create a WSG wargame signup")
	.addStringOption((option) =>
		option
			.setName("date")
			.setDescription("Event date and time, e.g. 2026-09-11 20:00")
			.setRequired(true),
	)
	.addStringOption((option) =>
		option
			.setName("faction")
			.setDescription("Restrict signups to one faction (omit for both Horde and Alliance)")
			.setRequired(false)
			.addChoices(
				{ name: FACTION_LABELS[FACTIONS.HORDE], value: FACTIONS.HORDE },
				{ name: FACTION_LABELS[FACTIONS.ALLIANCE], value: FACTIONS.ALLIANCE },
			),
	);

export const execute = async (interaction) => {
	const data = await loadWargameData();

	const dateInput = interaction.options.getString("date", true);
	const date = new Date(dateInput.replace(" ", "T"));

	if (Number.isNaN(date.getTime())) {
		await interaction.reply({
			content: "Invalid date. Use something like `2026-09-11 20:00`.",
			flags: 64,
		});

		return;
	}

	const guild = interaction.guild;

	const textCategory = guild.channels.cache.find(
		(channel) =>
			channel.type === ChannelType.GuildCategory &&
			channel.name.toLowerCase() === "text channels",
	);

	const channel = await findOrCreateChannel(guild, {
		name: "wargame",
		type: ChannelType.GuildText,
		parentId: textCategory?.id ?? null,
		permissionOverwrites: readOnlyChannelOverwrites(guild),
	});

	const previousEvent = data.events[guild.id];

	if (previousEvent) {
		const previousChannel = await guild.channels.fetch(previousEvent.channelId).catch(() => null);

		const previousMessage = previousChannel?.isTextBased()
			? await previousChannel.messages.fetch(previousEvent.messageId).catch(() => null)
			: null;

		await previousMessage?.edit({ components: [] }).catch(() => null);
	}

	const faction = interaction.options.getString("faction");

	const event = createEvent({
		guildId: guild.id,
		channelId: channel.id,
		date: date.getTime(),
		faction,
	});

	const message = await channel.send(await createSignupPanel(event, guild));

	event.messageId = message.id;
	data.events[guild.id] = event;

	await saveWargameData(data);

	await interaction.reply({
		content: `Wargame created in ${channel}${faction ? ` (${FACTION_LABELS[faction]} only)` : ""}.`,
		flags: 64,
	});
};
