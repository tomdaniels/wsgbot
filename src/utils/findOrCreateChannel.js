export const findOrCreateChannel = async (
	guild,
	{ name, type, parentId = null, permissionOverwrites },
) => {
	const existing = guild.channels.cache.find(
		(channel) =>
			channel.name === name &&
			channel.type === type &&
			channel.parentId === parentId,
	);

	if (existing) {
		return existing;
	}

	return guild.channels.create({
		name,
		type,
		parent: parentId,
		permissionOverwrites,
	});
};
