import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { getClassIndicator } from "../domain/classes.js";
import { getEligiblePool, getRosterIds, getRosterSplit } from "../domain/roster.js";
import { getMemberName } from "../discord/memberNames.js";

const MAX_SELECT_OPTIONS = 25;

const formatPlayerLine = async (guild, player) => {
	const name = await getMemberName(guild, player.userId);

	return `${getClassIndicator(player.class)} ${name}`;
};

const formatPlayerLines = async (guild, players) => {
	if (players.length === 0) {
		return "—";
	}

	const lines = await Promise.all(
		players.map((player) => formatPlayerLine(guild, player)),
	);

	return lines.join("\n");
};

export const buildRosterDraftView = async (event, guild) => {
	const pool = getEligiblePool(event);
	const rosterIds = new Set(getRosterIds(event));
	const { roster, bench } = getRosterSplit(event);

	if (pool.length === 0) {
		return {
			content: "Nobody is signed up yet — nothing to roster.",
			components: [],
		};
	}

	const rosterLines = await formatPlayerLines(guild, roster);
	const benchLines = await formatPlayerLines(guild, bench);

	const options = await Promise.all(
		pool.slice(0, MAX_SELECT_OPTIONS).map(async (player) => {
			const name = await getMemberName(guild, player.userId);

			return new StringSelectMenuOptionBuilder()
				.setLabel(name)
				.setValue(player.userId)
				.setDescription(player.class)
				.setEmoji(getClassIndicator(player.class))
				.setDefault(rosterIds.has(player.userId));
		}),
	);

	return {
		content: [
			"## ROSTER DRAFT",
			"",
			`**ROSTER (${roster.length})**`,
			rosterLines,
			"",
			"Select the roster from the bench below.",
			benchLines,
		].join("\n"),
		components: [
			new ActionRowBuilder().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`roster:pick:${event.id}`)
					.setPlaceholder("Select the roster")
					.setMinValues(0)
					.setMaxValues(options.length)
					.addOptions(options),
			),
			new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`roster:submit:${event.id}`)
					.setLabel("SUBMIT")
					.setStyle(ButtonStyle.Success),

				new ButtonBuilder()
					.setCustomId(`roster:reset:${event.id}`)
					.setLabel("RESET")
					.setStyle(ButtonStyle.Danger),
			),
		],
	};
};

export const buildRosterAnnouncement = async (event, guild) => {
	const { roster, bench } = getRosterSplit(event);

	const rosterLines = await formatPlayerLines(guild, roster);

	const lines = ["## ROSTER", "", rosterLines];

	if (bench.length > 0) {
		const benchLines = await Promise.all(
			bench.map(async (player) => `${getClassIndicator(player.class)} ${await getMemberName(guild, player.userId)}`),
		);

		lines.push("", "-# BENCH", ...benchLines.map((line) => `-# ${line}`));
	}

	return lines.join("\n");
};
