export const findOrCreateRole = async (guild, { name, color }) => {
	const existing = guild.roles.cache.find((role) => role.name === name);

	if (existing) {
		await existing.setColors({
			primaryColor: color,
		});

		return existing;
	}

	return guild.roles.create({
		name,
		colors: {
			primaryColor: color,
		},
	});
};
