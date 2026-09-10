export const PLAYER_STATUS = {
	SIGNED_UP: "signed_up",
	TENTATIVE: "tentative",
	ABSENT: "absent",
};

// Keeps the signed-up pool within Discord's 25-option select menu limit,
// with headroom below the 20-a-side team cap for /roster's dropdown.
export const MAX_SIGNUPS = 20;

export const createEvent = ({ guildId, channelId, date, faction = null }) => ({
	id: crypto.randomUUID(),
	guildId,
	channelId,
	messageId: null,
	date,
	faction,
	players: {},
	roster: { assignments: {}, threadId: null },
});

export const getPlayer = (event, userId) => event.players[userId];

export const getPlayersByStatus = (event, status) =>
	Object.values(event.players).filter((player) => player.status === status);

export const isSignupFull = (event, userId, faction) =>
	getPlayersByStatus(event, PLAYER_STATUS.SIGNED_UP).filter(
		(player) => player.userId !== userId && player.faction === faction,
	).length >= MAX_SIGNUPS;

export const setPlayerSignup = (event, userId, status, className, faction = null) => {
	event.players[userId] = { userId, status, class: className, faction };

	return event.players[userId];
};
