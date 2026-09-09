import "dotenv/config";
import { client } from "./client.js";
import * as rosterCommand from "./commands/roster.js";
import * as setupCommand from "./commands/setup.js";
import * as wargameCommand from "./commands/wargame.js";
import * as rosterDraft from "./interactions/rosterDraft.js";
import * as wargameSignup from "./interactions/wargameSignup.js";

const commands = new Map(
	[setupCommand, wargameCommand, rosterCommand].map((command) => [
		command.data.name,
		command,
	]),
);

const componentHandlers = [wargameSignup, rosterDraft];

const findComponentHandler = (customId) => {
	const prefix = customId.split(":")[0];

	return componentHandlers.find((handler) => handler.prefix === prefix);
};

client.once("clientReady", () => {
	console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.guildId) {
		return;
	}

	if (interaction.isChatInputCommand()) {
		await commands.get(interaction.commandName)?.execute(interaction);
		return;
	}

	if (interaction.isAutocomplete()) {
		await commands.get(interaction.commandName)?.autocomplete?.(interaction);
		return;
	}

	if (interaction.isButton() || interaction.isStringSelectMenu()) {
		await findComponentHandler(interaction.customId)?.handle(interaction);
	}
});

client.login(process.env.DISCORD_TOKEN);
