import "dotenv/config";
import { REST, Routes } from "discord.js";
import * as initCommand from "../commands/init.js";

const APPLICATION_ID = "1547077841001123841";

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

try {
	console.log("Registering /init globally...");

	await rest.put(Routes.applicationCommands(APPLICATION_ID), {
		body: [initCommand.data.toJSON()],
	});

	console.log("Successfully registered /init.");
} catch (error) {
	console.error(error);
}
