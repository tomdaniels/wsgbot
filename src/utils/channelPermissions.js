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

export const organizerOnlyChannelOverwrites = (guild, organizerRoleId) => [
	{
		id: guild.roles.everyone.id,
		deny: [PermissionFlagsBits.ViewChannel],
	},
	{
		id: organizerRoleId,
		allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
	},
];
