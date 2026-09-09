export const findOrCreateChannel = async (
	guild,
	{ name, type, parentId = null },
) => {
	const existing = guild.channels.cache.find(
		(channel) =>
			channel.name === name &&
			channel.type === type &&
			channel.parentId === parentId,
	);

	return (
		existing ??
		guild.channels.create({
			name,
			type,
			parent: parentId,
		})
	);
};
