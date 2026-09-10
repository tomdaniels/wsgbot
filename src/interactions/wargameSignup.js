import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getLockedFaction, getMemberClasses } from "../domain/classes.js";
import { FACTION_INDICATORS, FACTION_LABELS, FACTIONS } from "../domain/factions.js";
import {
	getPlayer,
	isSignupFull,
	MAX_SIGNUPS,
	PLAYER_STATUS,
	setPlayerSignup,
} from "../domain/wargame.js";
import { updateSignupPanel } from "../ui/signupPanel.js";
import { loadWargameData, saveWargameData } from "../utils/wargameStore.js";

export const prefix = "wargame";

const promptClassChoice = async (interaction, status, playerClasses) => {
	await interaction.reply({
		content: "Choose the class you're signing up as.",
		components: [
			new ActionRowBuilder().addComponents(
				...playerClasses.map((className) =>
					new ButtonBuilder()
						.setCustomId(`wargame:class:${status}:${className}`)
						.setLabel(className)
						.setStyle(ButtonStyle.Primary),
				),
			),
		],
		flags: 64,
	});
};

const buildFactionPrompt = (status, className) => ({
	content: `Choose your faction for **${className}**.`,
	components: [
		new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(`wargame:faction:${status}:${className}:${FACTIONS.ALLIANCE}`)
				.setLabel(FACTION_LABELS[FACTIONS.ALLIANCE])
				.setEmoji(FACTION_INDICATORS[FACTIONS.ALLIANCE])
				.setStyle(ButtonStyle.Primary),

			new ButtonBuilder()
				.setCustomId(`wargame:faction:${status}:${className}:${FACTIONS.HORDE}`)
				.setLabel(FACTION_LABELS[FACTIONS.HORDE])
				.setEmoji(FACTION_INDICATORS[FACTIONS.HORDE])
				.setStyle(ButtonStyle.Primary),
		),
	],
});

const resolveFaction = (event, className) => {
	const lockedFaction = getLockedFaction(className);

	if (event.faction && lockedFaction && event.faction !== lockedFaction) {
		return { conflict: true };
	}

	return { faction: event.faction ?? lockedFaction ?? null };
};

const factionConflictMessage = (event, className) =>
	`${className} is ${FACTION_LABELS[getLockedFaction(className)]}-only, and this wargame is ${FACTION_LABELS[event.faction]}-only.`;

const finalizeSignUp = async ({ interaction, event, data, className, faction, mode }) => {
	const respond = (payload) =>
		mode === "update" ? interaction.update(payload) : interaction.reply({ ...payload, flags: 64 });

	if (isSignupFull(event, interaction.user.id, faction)) {
		await respond({
			content: `${FACTION_LABELS[faction]} signups are full (${MAX_SIGNUPS}/${MAX_SIGNUPS}). Try TENTATIVE in case a spot opens up.`,
			components: [],
		});

		return;
	}

	setPlayerSignup(event, interaction.user.id, PLAYER_STATUS.SIGNED_UP, className, faction);

	await saveWargameData(data);
	await updateSignupPanel(event, interaction.guild);

	await respond({
		content: `You're **signed up** as **${className}** (${FACTION_LABELS[faction]}).`,
		components: [],
	});
};

const setStatus = async (interaction, status) => {
	const data = await loadWargameData();
	const event = data.events[interaction.guildId];

	if (!event) {
		await interaction.reply({
			content: "There isn't an active wargame.",
			flags: 64,
		});

		return;
	}

	const member = await interaction.guild.members.fetch(interaction.user.id);
	const playerClasses = getMemberClasses(member);

	if (playerClasses.length === 0) {
		await interaction.reply({
			content:
				"You don't have a class role yet. Nominate your classes in #whalecum.",
			flags: 64,
		});

		return;
	}

	if (status === PLAYER_STATUS.SIGNED_UP) {
		if (playerClasses.length > 1) {
			await promptClassChoice(interaction, status, playerClasses);
			return;
		}

		const className = playerClasses[0];
		const resolved = resolveFaction(event, className);

		if (resolved.conflict) {
			await interaction.reply({
				content: factionConflictMessage(event, className),
				flags: 64,
			});

			return;
		}

		if (resolved.faction) {
			await finalizeSignUp({ interaction, event, data, className, faction: resolved.faction, mode: "reply" });
			return;
		}

		await interaction.reply({ ...buildFactionPrompt(status, className), flags: 64 });
		return;
	}

	const existingPlayer = getPlayer(event, interaction.user.id);

	const reply = async (className) => {
		setPlayerSignup(event, interaction.user.id, status, className);

		await saveWargameData(data);
		await updateSignupPanel(event, interaction.guild);

		await interaction.reply({
			content: `You're **${status.replace("_", " ")}** as **${className}**.`,
			flags: 64,
		});
	};

	if (playerClasses.length === 1) {
		await reply(playerClasses[0]);
		return;
	}

	if (existingPlayer?.class) {
		await reply(existingPlayer.class);
		return;
	}

	await promptClassChoice(interaction, status, playerClasses);
};

const setClass = async (interaction, status, className) => {
	const data = await loadWargameData();
	const event = data.events[interaction.guildId];

	if (!event) {
		await interaction.update({
			content: "There isn't an active wargame.",
			components: [],
		});

		return;
	}

	const member = await interaction.guild.members.fetch(interaction.user.id);
	const playerClasses = getMemberClasses(member);

	if (!playerClasses.includes(className)) {
		await interaction.update({
			content: "You don't have that class role.",
			components: [],
		});

		return;
	}

	if (status === PLAYER_STATUS.SIGNED_UP) {
		const resolved = resolveFaction(event, className);

		if (resolved.conflict) {
			await interaction.update({
				content: factionConflictMessage(event, className),
				components: [],
			});

			return;
		}

		if (resolved.faction) {
			await finalizeSignUp({ interaction, event, data, className, faction: resolved.faction, mode: "update" });
			return;
		}

		await interaction.update(buildFactionPrompt(status, className));
		return;
	}

	setPlayerSignup(event, interaction.user.id, status, className);

	await saveWargameData(data);
	await updateSignupPanel(event, interaction.guild);

	await interaction.update({
		content: `You're **${status.replace("_", " ")}** as **${className}**.`,
		components: [],
	});
};

const setFaction = async (interaction, status, className, faction) => {
	const data = await loadWargameData();
	const event = data.events[interaction.guildId];

	if (!event) {
		await interaction.update({
			content: "There isn't an active wargame.",
			components: [],
		});

		return;
	}

	if (event.faction && event.faction !== faction) {
		await interaction.update({
			content: `This wargame is restricted to ${FACTION_LABELS[event.faction]}.`,
			components: [],
		});

		return;
	}

	const member = await interaction.guild.members.fetch(interaction.user.id);
	const playerClasses = getMemberClasses(member);

	if (!playerClasses.includes(className)) {
		await interaction.update({
			content: "You don't have that class role.",
			components: [],
		});

		return;
	}

	const lockedFaction = getLockedFaction(className);

	if (lockedFaction && lockedFaction !== faction) {
		await interaction.update({
			content: `${className} is ${FACTION_LABELS[lockedFaction]}-only.`,
			components: [],
		});

		return;
	}

	await finalizeSignUp({ interaction, event, data, className, faction, mode: "update" });
};

export const handle = async (interaction) => {
	if (interaction.isButton()) {
		if (interaction.customId === "wargame:signup") {
			await setStatus(interaction, PLAYER_STATUS.SIGNED_UP);
			return;
		}

		if (interaction.customId === "wargame:tentative") {
			await setStatus(interaction, PLAYER_STATUS.TENTATIVE);
			return;
		}

		if (interaction.customId === "wargame:absent") {
			await setStatus(interaction, PLAYER_STATUS.ABSENT);
			return;
		}

		if (interaction.customId.startsWith("wargame:faction:")) {
			const [, , status, className, faction] = interaction.customId.split(":");

			await setFaction(interaction, status, className, faction);
			return;
		}

		if (interaction.customId.startsWith("wargame:class:")) {
			const [, , status, className] = interaction.customId.split(":");

			await setClass(interaction, status, className);
		}
	}
};
