import { SlashCommandBuilder } from "discord.js";
import { memberHasRole } from "../domain/classes.js";
import { getEligiblePool } from "../domain/roster.js";
import { formatEventDateShort } from "../utils/datetime.js";
import { loadWargameData } from "../utils/wargameStore.js";
import { buildRosterDraftView } from "../ui/rosterPanel.js";

export const data = new SlashCommandBuilder()
	.setName("roster")
	.setDescription("Select the roster for a wargame")
	.addStringOption((option) =>
		option
			.setName("event")
			.setDescription("Wargame to manage")
			.setRequired(true)
			.setAutocomplete(true),
	);

export const autocomplete = async (interaction) => {
	const data = await loadWargameData();
	const event = data.events[interaction.guildId];

	if (!event) {
		await interaction.respond([]);
		return;
	}

	await interaction.respond([
		{ name: `Wargame – ${formatEventDateShort(event.date)}`, value: event.id },
	]);
};

export const execute = async (interaction) => {
	const member = await interaction.guild.members.fetch(interaction.user.id);

	if (!memberHasRole(member, "Organizer")) {
		await interaction.reply({
			content: "Only organizers can manage the roster.",
			flags: 64,
		});

		return;
	}

	const data = await loadWargameData();
	const event = data.events[interaction.guildId];

	if (!event) {
		await interaction.reply({
			content: "There isn't an active wargame.",
			flags: 64,
		});

		return;
	}

	if (getEligiblePool(event).length === 0) {
		await interaction.reply({
			content: "Nobody is signed up yet — nothing to roster.",
			flags: 64,
		});

		return;
	}

	await interaction.reply({
		...(await buildRosterDraftView(event, interaction.guild)),
		flags: 64,
	});
};
