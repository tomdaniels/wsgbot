import { ChannelType, SlashCommandBuilder } from "discord.js";
import { createEvent } from "../domain/wargame.js";
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

	const channel = guild.channels.cache.find(
		(channel) =>
			channel.type === ChannelType.GuildText && channel.name === "wargame",
	);

	if (!channel) {
		await interaction.reply({
			content: "Couldn't find the `#wargame` channel. Run `/setup` first.",
			flags: 64,
		});

		return;
	}

	const event = createEvent({
		guildId: guild.id,
		channelId: channel.id,
		date: date.getTime(),
	});

	const message = await channel.send(await createSignupPanel(event, guild));

	event.messageId = message.id;
	data.events[guild.id] = event;

	await saveWargameData(data);

	await interaction.reply({
		content: `Wargame created in ${channel}.`,
		flags: 64,
	});
};
