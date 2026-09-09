import "dotenv/config";
import { ChannelType, Client, GatewayIntentBits } from "discord.js";
import { findOrCreateChannel } from "./utils/findOrCreateChannel.js";

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once("clientReady", () => {
	console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	if (!interaction.guildId) return;

	const guild =
		interaction.guild ?? (await client.guilds.fetch(interaction.guildId));

	if (interaction.commandName === "setup") {
		const textCategory = guild.channels.cache.find(
			(channel) =>
				channel.type === ChannelType.GuildCategory &&
				channel.name === "Text channels",
		);

		if (!textCategory) {
			await interaction.reply({
				content: "Couldn't find the TEXT CHANNELS category.",
				flags: 64,
			});
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

		await interaction.reply({
			content: `Setup complete: ${welcome} and ${wargame}.`,
			flags: 64,
		});
	}
});

client.login(process.env.DISCORD_TOKEN);
