import "dotenv/config";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	Client,
	GatewayIntentBits,
} from "discord.js";
import { findOrCreateChannel } from "./utils/findOrCreateChannel.js";
import { findOrCreateRole } from "./utils/findOrCreateRole.js";
import { loadWargameData, saveWargameData } from "./utils/wargameStore.js";

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const roles = [
	{ name: "Druid", color: 0xff7d0a },
	{ name: "Hunter", color: 0xabd473 },
	{ name: "Mage", color: 0x69ccf0 },
	{ name: "Priest", color: 0xffffff },
	{ name: "Rogue", color: 0xfff569 },
	{ name: "Shaman", color: 0xf58cba },
	{ name: "Warlock", color: 0x9482c9 },
	{ name: "Warrior", color: 0xc79c6e },
	{ name: "Organizer", color: 0x7daea3 },
];

const classNames = new Set(
	roles.map((role) => role.name).filter((name) => name !== "Organizer"),
);

const classIndicators = {
	Druid: "🟠",
	Hunter: "🟢",
	Mage: "🔵",
	Priest: "⚪",
	Rogue: "🟡",
	Shaman: "🌸",
	Warlock: "🟣",
	Warrior: "🟤",
};

const getPlayerClasses = (member) =>
	roles
		.filter(
			(role) =>
				classNames.has(role.name) &&
				member.roles.cache.some((memberRole) => memberRole.name === role.name),
		)
		.map((role) => role.name);

const formatEventTime = (timestamp) => {
	const unix = Math.floor(timestamp / 1000);

	return `<t:${unix}:F>\n<t:${unix}:R>`;
};

const getMemberName = async (guild, userId) => {
	try {
		const member = await guild.members.fetch(userId);

		return member.displayName;
	} catch {
		return `<@${userId}>`;
	}
};

const createSignupPanel = async (event) => {
	const guild = await client.guilds.fetch(event.guildId);
	const players = Object.values(event.players);

	const signedUp = players.filter((player) => player.status === "signed_up");

	const tentative = players.filter((player) => player.status === "tentative");

	const absent = players.filter((player) => player.status === "absent");

	const roster = players.filter(
		(player) => player.rosterStatus === "selected",
	).length;

	const formatSignedUpPlayer = async (player) => {
		const name = await getMemberName(guild, player.userId);
		const indicator = classIndicators[player.class] ?? "⚪";

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
			`**SIGNED UP ${signedUp.length}**`,
			"",
			signedUpPlayers.length > 0 ? signedUpPlayers.join("\n") : "—",
			"",
			`**TENTATIVE:** ${tentativeNames}`,
			`**ABSENT:** ${absentNames}`,
			"",
			`**ROSTER ${roster}/10**`,
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

const updateSignupPanel = async (event) => {
	const channel = await client.channels.fetch(event.channelId);

	if (!channel?.isTextBased()) {
		return;
	}

	const message = await channel.messages.fetch(event.messageId);

	await message.edit(await createSignupPanel(event));
};

const setPlayerStatus = async (interaction, status) => {
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

	const playerClasses = getPlayerClasses(member);

	if (playerClasses.length === 0) {
		await interaction.reply({
			content:
				"You don't have a class role yet. Ask an organizer to assign you one.",
			flags: 64,
		});

		return;
	}

	const existingPlayer = event.players[interaction.user.id];

	if (status === "signed_up" && existingPlayer?.status === "signed_up") {
		if (playerClasses.length === 1) {
			await interaction.reply({
				content: `You're already signed up as **${existingPlayer.class}**.`,
				flags: 64,
			});

			return;
		}

		await interaction.reply({
			content: "Choose the class you're changing to.",
			components: [
				new ActionRowBuilder().addComponents(
					...playerClasses.map((className) =>
						new ButtonBuilder()
							.setCustomId(`wargame:class:signed_up:${className}`)
							.setLabel(className)
							.setStyle(ButtonStyle.Primary),
					),
				),
			],
			flags: 64,
		});

		return;
	}

	const player = existingPlayer ?? {
		userId: interaction.user.id,
		rosterStatus: "pending",
	};

	if (playerClasses.length === 1) {
		player.class = player.class ?? playerClasses[0];
		player.status = status;

		event.players[interaction.user.id] = player;

		await saveWargameData(data);
		await updateSignupPanel(event);

		await interaction.reply({
			content: `You're **${status.replace("_", " ")}** as **${player.class}**.`,
			flags: 64,
		});

		return;
	}

	if (status !== "signed_up" && player.class) {
		player.status = status;

		event.players[interaction.user.id] = player;

		await saveWargameData(data);
		await updateSignupPanel(event);

		await interaction.reply({
			content: `You're **${status}** as **${player.class}**.`,
			flags: 64,
		});

		return;
	}

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

const setPlayerClass = async (interaction, status, className) => {
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

	const playerClasses = getPlayerClasses(member);

	if (!playerClasses.includes(className)) {
		await interaction.reply({
			content: "You don't have that class role.",
			flags: 64,
		});

		return;
	}

	const existingPlayer = event.players[interaction.user.id];

	event.players[interaction.user.id] = {
		userId: interaction.user.id,
		class: className,
		status,
		rosterStatus: existingPlayer?.rosterStatus ?? "pending",
	};

	await saveWargameData(data);
	await updateSignupPanel(event);

	await interaction.update({
		content: `You're **${status.replace("_", " ")}** as **${className}**.`,
		components: [],
	});
};

client.once("clientReady", () => {
	console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.guildId) {
		return;
	}

	if (interaction.isChatInputCommand()) {
		if (interaction.commandName === "setup") {
			const guild =
				interaction.guild ?? (await client.guilds.fetch(interaction.guildId));

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
				await interaction.editReply(
					"Couldn't find the Text channels category.",
				);
				return;
			}

			if (!voiceCategory) {
				await interaction.editReply(
					"Couldn't find the Voice Channels category.",
				);
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

			for (const role of roles) {
				await findOrCreateRole(guild, role);
			}

			await findOrCreateChannel(guild, {
				name: "Wargame",
				type: ChannelType.GuildVoice,
				parentId: voiceCategory.id,
			});

			await findOrCreateChannel(guild, {
				name: "Pug",
				type: ChannelType.GuildVoice,
				parentId: voiceCategory.id,
			});

			await findOrCreateChannel(guild, {
				name: "Organizer",
				type: ChannelType.GuildVoice,
				parentId: voiceCategory.id,
			});

			await interaction.editReply(
				`Setup complete: ${welcome} and ${wargame}. Roles and voice channels are ready.`,
			);

			return;
		}

		if (interaction.commandName === "wargame") {
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

			const event = {
				id: crypto.randomUUID(),
				guildId: guild.id,
				channelId: channel.id,
				messageId: null,
				date: date.getTime(),
				players: {},
			};

			const message = await channel.send(await createSignupPanel(event));

			event.messageId = message.id;
			data.events[guild.id] = event;

			await saveWargameData(data);

			await interaction.reply({
				content: `Wargame created in ${channel}.`,
				flags: 64,
			});

			return;
		}
	}

	if (!interaction.isButton()) {
		return;
	}

	if (interaction.customId === "wargame:signup") {
		await setPlayerStatus(interaction, "signed_up");
		return;
	}

	if (interaction.customId === "wargame:tentative") {
		await setPlayerStatus(interaction, "tentative");
		return;
	}

	if (interaction.customId === "wargame:absent") {
		await setPlayerStatus(interaction, "absent");
		return;
	}

	if (interaction.customId.startsWith("wargame:class:")) {
		const [, , status, className] = interaction.customId.split(":");

		await setPlayerClass(interaction, status, className);
	}
});

client.login(process.env.DISCORD_TOKEN);
