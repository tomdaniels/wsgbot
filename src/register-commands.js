import "dotenv/config";
import { REST, Routes } from "discord.js";
import * as classRolesCommand from "./commands/classRoles.js";
import * as setupCommand from "./commands/setup.js";
import * as wargameCommand from "./commands/wargame.js";
import * as rosterCommand from "./commands/roster.js";

const commands = [
	setupCommand,
	wargameCommand,
	rosterCommand,
	classRolesCommand,
].map((command) => command.data.toJSON());

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
