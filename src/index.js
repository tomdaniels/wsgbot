import "dotenv/config";
import { client } from "./discord/client.js";
import * as classRolesCommand from "./commands/classRoles.js";
import * as initCommand from "./commands/init.js";
import * as rosterCommand from "./commands/roster.js";
import * as wargameCommand from "./commands/wargame.js";
import {
	handleReactionAdd,
	handleReactionRemove,
} from "./interactions/classRoleReactions.js";
import * as rosterDraft from "./interactions/rosterDraft.js";
import * as wargameSignup from "./interactions/wargameSignup.js";

const commands = new Map(
	[initCommand, wargameCommand, rosterCommand, classRolesCommand].map(
		(command) => [command.data.name, command],
	),
);

const componentHandlers = [wargameSignup, rosterDraft];

const findComponentHandler = (customId) => {
	const prefix = customId.split(":")[0];

	return componentHandlers.find((handler) => handler.prefix === prefix);
};

client.once("clientReady", () => {
	console.log(`Logged in as ${client.user.tag}`);
});

const reportInteractionError = async (interaction, error) => {
	console.error(error);

	const content = "Something went wrong running that.";

	if (interaction.deferred || interaction.replied) {
		await interaction.editReply({ content }).catch(console.error);
		return;
	}

	await interaction.reply({ content, flags: 64 }).catch(console.error);
};

client.on("interactionCreate", async (interaction) => {
	if (!interaction.guildId) {
		return;
	}

	try {
		if (interaction.isChatInputCommand()) {
			await commands.get(interaction.commandName)?.execute(interaction);
			return;
		}

		if (interaction.isAutocomplete()) {
			await commands
				.get(interaction.commandName)
				?.autocomplete?.(interaction);
			return;
		}

		if (interaction.isButton() || interaction.isStringSelectMenu()) {
			await findComponentHandler(interaction.customId)?.handle(interaction);
		}
	} catch (error) {
		if (interaction.isAutocomplete()) {
			console.error(error);
			return;
		}

		await reportInteractionError(interaction, error);
	}
});

client.on("messageReactionAdd", async (reaction, user) => {
	await handleReactionAdd(reaction, user).catch(console.error);
});

client.on("messageReactionRemove", async (reaction, user) => {
	await handleReactionRemove(reaction, user).catch(console.error);
});

client.login(process.env.DISCORD_TOKEN);
