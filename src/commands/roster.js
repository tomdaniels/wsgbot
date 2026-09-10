import { SlashCommandBuilder } from "discord.js";
import { memberHasRole } from "../domain/classes.js";
import { FACTION_LABELS, FACTIONS } from "../domain/factions.js";
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
	)
	.addStringOption((option) =>
		option
			.setName("faction")
			.setDescription("Which faction to roster (only needed for a dual-faction wargame)")
			.setRequired(false)
			.addChoices(
				{ name: FACTION_LABELS[FACTIONS.HORDE], value: FACTIONS.HORDE },
				{ name: FACTION_LABELS[FACTIONS.ALLIANCE], value: FACTIONS.ALLIANCE },
			),
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

	const requestedFaction = interaction.options.getString("faction");
	const faction = event.faction ?? requestedFaction;

	if (!faction) {
		await interaction.reply({
			content: "This wargame is open to both factions — pass `faction` to pick which one to roster.",
			flags: 64,
		});

		return;
	}

	if (event.faction && requestedFaction && requestedFaction !== event.faction) {
		await interaction.reply({
			content: `This wargame is restricted to ${FACTION_LABELS[event.faction]}.`,
			flags: 64,
		});

		return;
	}

	if (getEligiblePool(event, faction).length === 0) {
		await interaction.reply({
			content: `Nobody is signed up for ${FACTION_LABELS[faction]} yet — nothing to roster.`,
			flags: 64,
		});

		return;
	}

	await interaction.reply({
		...(await buildRosterDraftView(event, interaction.guild, faction)),
		flags: 64,
	});
};
