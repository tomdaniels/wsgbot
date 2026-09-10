import { getPlayersByStatus, PLAYER_STATUS } from "./wargame.js";

export const getEligiblePool = (event, faction) =>
	getPlayersByStatus(event, PLAYER_STATUS.SIGNED_UP).filter(
		(player) => player.faction === faction,
	);

export const getRosterIds = (event, faction) =>
	event.roster?.[faction]?.rosterIds ?? [];

export const setRosterSelection = (event, faction, selectedUserIds) => {
	const poolIds = new Set(getEligiblePool(event, faction).map((player) => player.userId));
	const rosterIds = selectedUserIds.filter((userId) => poolIds.has(userId));

	event.roster = {
		...(event.roster ?? {}),
		[faction]: { ...(event.roster?.[faction] ?? {}), rosterIds },
	};

	return rosterIds;
};

export const resetRoster = (event, faction) => {
	event.roster = {
		...(event.roster ?? {}),
		[faction]: { ...(event.roster?.[faction] ?? {}), rosterIds: [] },
	};
};

export const setRosterThread = (event, threadId) => {
	event.roster = { ...(event.roster ?? {}), threadId };
};

export const setRosterMessageId = (event, faction, messageId) => {
	event.roster = {
		...(event.roster ?? {}),
		[faction]: { ...(event.roster?.[faction] ?? {}), messageId },
	};
};

export const getRosterSplit = (event, faction) => {
	const pool = getEligiblePool(event, faction);
	const rosterIds = new Set(getRosterIds(event, faction));

	const roster = pool.filter((player) => rosterIds.has(player.userId));
	const bench = pool.filter((player) => !rosterIds.has(player.userId));

	return { roster, bench };
};
