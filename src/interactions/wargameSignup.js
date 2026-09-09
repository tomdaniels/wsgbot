import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getMemberClasses } from "../domain/classes.js";
import { PLAYER_STATUS, getPlayer, setPlayerSignup } from "../domain/wargame.js";
import { loadWargameData, saveWargameData } from "../utils/wargameStore.js";
import { updateSignupPanel } from "../ui/signupPanel.js";

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
				"You don't have a class role yet. Ask an organizer to assign you one.",
			flags: 64,
		});

		return;
	}

	const existingPlayer = getPlayer(event, interaction.user.id);

	if (status === PLAYER_STATUS.SIGNED_UP && existingPlayer?.status === PLAYER_STATUS.SIGNED_UP) {
		if (playerClasses.length === 1) {
			await interaction.reply({
				content: `You're already signed up as **${existingPlayer.class}**.`,
				flags: 64,
			});

			return;
		}

		await promptClassChoice(interaction, status, playerClasses);
		return;
	}

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
		await reply(existingPlayer?.class ?? playerClasses[0]);
		return;
	}

	if (status !== PLAYER_STATUS.SIGNED_UP && existingPlayer?.class) {
		await reply(existingPlayer.class);
		return;
	}

	await promptClassChoice(interaction, status, playerClasses);
};

const setClass = async (interaction, status, className) => {
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

	if (!playerClasses.includes(className)) {
		await interaction.reply({
			content: "You don't have that class role.",
			flags: 64,
		});

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

		if (interaction.customId.startsWith("wargame:class:")) {
			const [, , status, className] = interaction.customId.split(":");

			await setClass(interaction, status, className);
		}
	}
};
