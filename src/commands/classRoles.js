import { SlashCommandBuilder } from "discord.js";
import { CLASS_ROLES, getClassIndicator } from "../domain/classes.js";
import {
	loadClassRolesData,
	saveClassRolesData,
} from "../utils/classRolesStore.js";
import { createClassRolesPanel } from "../ui/classRolesPanel.js";

export const data = new SlashCommandBuilder()
	.setName("class-roles")
	.setDescription("Post the class role picker message in this channel");

const findExistingMessage = async (guild, panel) => {
	if (!panel) {
		return null;
	}

	const channel = await guild.channels.fetch(panel.channelId).catch(() => null);

	if (!channel?.isTextBased()) {
		return null;
	}

	return channel.messages.fetch(panel.messageId).catch(() => null);
};

export const execute = async (interaction) => {
	const guild = interaction.guild;

	await interaction.deferReply({ flags: 64 });

	const data = await loadClassRolesData();
	const existingMessage = await findExistingMessage(
		guild,
		data.panels[guild.id],
	);

	const message = existingMessage
		? await existingMessage.edit(createClassRolesPanel())
		: await interaction.channel.send(createClassRolesPanel());

	for (const role of CLASS_ROLES) {
		await message.react(getClassIndicator(role.name));
	}

	if (existingMessage) {
		await interaction.editReply(
			`Updated the existing class role message in ${message.channel}.`,
		);

		return;
	}

	data.panels[guild.id] = {
		channelId: message.channelId,
		messageId: message.id,
	};

	await saveClassRolesData(data);

	await interaction.editReply(`Posted the class role message in ${message.channel}.`);
};
