import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { client } from "../discord/client.js";
import { getClassIndicator } from "../domain/classes.js";
import { FACTION_COLORS, FACTION_LABELS, FACTIONS } from "../domain/factions.js";
import { MAX_SIGNUPS, PLAYER_STATUS } from "../domain/wargame.js";
import { getMemberName } from "../discord/memberNames.js";
import { formatEventTime } from "../utils/datetime.js";

const formatSignedUpPlayer = async (guild, player) => {
	const name = await getMemberName(guild, player.userId);
	const indicator = getClassIndicator(player.class);

	return `${indicator} ${name}`;
};

const buildFactionEmbed = async (guild, faction, players) => {
	const lines = await Promise.all(players.map((player) => formatSignedUpPlayer(guild, player)));

	return new EmbedBuilder()
		.setColor(FACTION_COLORS[faction])
		.setTitle(`${FACTION_LABELS[faction].toUpperCase()} (${players.length}/${MAX_SIGNUPS})`)
		.setDescription(lines.length > 0 ? lines.join("\n") : "—");
};

export const createSignupPanel = async (event, guild) => {
	const players = Object.values(event.players);

	const signedUp = players.filter(
		(player) => player.status === PLAYER_STATUS.SIGNED_UP,
	);

	const tentative = players.filter(
		(player) => player.status === PLAYER_STATUS.TENTATIVE,
	);

	const absent = players.filter(
		(player) => player.status === PLAYER_STATUS.ABSENT,
	);

	const formatNames = async (playerList) => {
		if (playerList.length === 0) {
			return "—";
		}

		const names = await Promise.all(
			playerList.map((player) => getMemberName(guild, player.userId)),
		);

		return names.join(", ");
	};

	const tentativeNames = await formatNames(tentative);
	const absentNames = await formatNames(absent);

	const factions = event.faction ? [event.faction] : [FACTIONS.ALLIANCE, FACTIONS.HORDE];

	const embeds = await Promise.all(
		factions.map((faction) =>
			buildFactionEmbed(guild, faction, signedUp.filter((player) => player.faction === faction)),
		),
	);

	const factionHeader = event.faction
		? ` — ${FACTION_LABELS[event.faction].toUpperCase()} ONLY`
		: "";

	const signUpLabel = event.faction
		? `SIGN UP (${FACTION_LABELS[event.faction].toUpperCase()})`
		: "SIGN UP";

	return {
		content: [
			`## WARGAME${factionHeader}`,
			"",
			formatEventTime(event.date),
			"",
			`**TENTATIVE:** ${tentativeNames}`,
			`**ABSENT:** ${absentNames}`,
		].join("\n"),
		embeds,
		components: [
			new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId("wargame:signup")
					.setLabel(signUpLabel)
					.setStyle(ButtonStyle.Success),

				new ButtonBuilder()
					.setCustomId("wargame:tentative")
					.setLabel("TENTATIVE")
					.setStyle(ButtonStyle.Secondary),

				new ButtonBuilder()
					.setCustomId("wargame:absent")
					.setLabel("ABSENT")
					.setStyle(ButtonStyle.Secondary),
			),
		],
	};
};

export const updateSignupPanel = async (event, guild) => {
	const channel = await client.channels.fetch(event.channelId);

	if (!channel?.isTextBased()) {
		return;
	}

	const message = await channel.messages.fetch(event.messageId);

	await message.edit(await createSignupPanel(event, guild));
};
