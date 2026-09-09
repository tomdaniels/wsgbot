export const PLAYER_STATUS = {
	SIGNED_UP: "signed_up",
	TENTATIVE: "tentative",
	ABSENT: "absent",
};

export const createEvent = ({ guildId, channelId, date }) => ({
	id: crypto.randomUUID(),
	guildId,
	channelId,
	messageId: null,
	date,
	players: {},
});

export const getPlayer = (event, userId) => event.players[userId];

export const getPlayersByStatus = (event, status) =>
	Object.values(event.players).filter((player) => player.status === status);

export const setPlayerSignup = (event, userId, status, className) => {
	const existing = event.players[userId];

	event.players[userId] = {
		userId,
		status,
		class: className,
		rosterStatus: existing?.rosterStatus ?? "pending",
	};

	return event.players[userId];
};
