import { PermissionFlagsBits } from "discord.js";

export const readOnlyChannelOverwrites = (guild) => [
	{
		id: guild.roles.everyone.id,
		deny: [PermissionFlagsBits.SendMessages],
	},
	{
		id: guild.client.user.id,
		allow: [PermissionFlagsBits.SendMessages],
	},
];
