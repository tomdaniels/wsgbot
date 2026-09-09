import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const commands = [
	new SlashCommandBuilder()
		.setName("setup")
		.setDescription("Set up the WSG signup server"),

	new SlashCommandBuilder()
		.setName("wargame")
		.setDescription("Create a WSG wargame signup")
		.addStringOption((option) =>
			option
				.setName("date")
				.setDescription("Event date and time, e.g. 2026-09-11 20:00")
				.setRequired(true),
		),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

try {
	console.log("Registering commands...");

	await rest.put(
		Routes.applicationGuildCommands(
			"1547077841001123841",
			"1547076383992193064",
		),
		{ body: commands },
	);

	console.log("Successfully registered commands.");
} catch (error) {
	console.error(error);
}
