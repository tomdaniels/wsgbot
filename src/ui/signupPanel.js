import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { client } from "../client.js";
import { getClassIndicator } from "../domain/classes.js";
import { MAX_SIGNUPS, PLAYER_STATUS } from "../domain/wargame.js";
import { getMemberName } from "../discord/memberNames.js";
import { formatEventTime } from "../format.js";

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

	const formatSignedUpPlayer = async (player) => {
		const name = await getMemberName(guild, player.userId);
		const indicator = getClassIndicator(player.class);

		return `${indicator} ${name}`;
	};

	const formatNames = async (playerList) => {
		if (playerList.length === 0) {
			return "—";
		}

		const names = await Promise.all(
			playerList.map((player) => getMemberName(guild, player.userId)),
		);

		return names.join(", ");
	};

	const signedUpPlayers = await Promise.all(signedUp.map(formatSignedUpPlayer));

	const tentativeNames = await formatNames(tentative);
	const absentNames = await formatNames(absent);

	return {
		content: [
			"## WARGAME",
			"",
			formatEventTime(event.date),
			"",
			`**SIGNED UP ${signedUp.length}/${MAX_SIGNUPS}**`,
			"",
			signedUpPlayers.length > 0 ? signedUpPlayers.join("\n") : "—",
			"",
			`**TENTATIVE:** ${tentativeNames}`,
			`**ABSENT:** ${absentNames}`,
		].join("\n"),
		components: [
			new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId("wargame:signup")
					.setLabel("SIGN UP")
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
