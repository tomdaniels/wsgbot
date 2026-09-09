import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const commands = [
	new SlashCommandBuilder()
		.setName("setup")
		.setDescription("Set up the WSG signup server"),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

try {
	console.log("Registering /setup...");

	await rest.put(
		Routes.applicationGuildCommands(
			"1547077841001123841",
			"1547076383992193064",
		),
		{ body: commands },
	);

	console.log("Successfully registered /setup.");
} catch (error) {
	console.error(error);
}
