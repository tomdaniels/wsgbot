import "dotenv/config";
import { ChannelType, Client, GatewayIntentBits } from "discord.js";
import { findOrCreateChannel } from "./utils/findOrCreateChannel.js";

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

client.once("clientReady", () => {
	console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	if (!interaction.guildId) return;
	if (interaction.commandName !== "setup") return;

	const guild =
		interaction.guild ?? (await client.guilds.fetch(interaction.guildId));

	await interaction.deferReply({ flags: 64 });

	const textCategory = guild.channels.cache.find(
		(channel) =>
			channel.type === ChannelType.GuildCategory &&
			channel.name.toLowerCase() === "text channels",
	);

	if (!textCategory) {
		await interaction.editReply("Couldn't find the Text channels category.");
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
		const existingRole = guild.roles.cache.find(
			(existing) => existing.name === role.name,
		);

		if (existingRole) {
			await existingRole.edit({
				color: role.color,
			});
		} else {
			await guild.roles.create({
				name: role.name,
				color: role.color,
			});
		}
	}

	await interaction.editReply(
		`Setup complete: ${welcome} and ${wargame}. Roles are ready.`,
	);
});

client.login(process.env.DISCORD_TOKEN);
