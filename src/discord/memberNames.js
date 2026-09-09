export const getMemberName = async (guild, userId) => {
	try {
		const member = await guild.members.fetch(userId);

		return member.displayName;
	} catch {
		return `<@${userId}>`;
	}
};
