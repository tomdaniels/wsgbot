import { getPlayersByStatus, PLAYER_STATUS } from "./wargame.js";

export const getEligiblePool = (event) =>
	getPlayersByStatus(event, PLAYER_STATUS.SIGNED_UP);

export const getRosterIds = (event) => event.roster?.rosterIds ?? [];

export const setRosterSelection = (event, selectedUserIds) => {
	const poolIds = new Set(getEligiblePool(event).map((player) => player.userId));
	const rosterIds = selectedUserIds.filter((userId) => poolIds.has(userId));

	event.roster = { ...(event.roster ?? {}), rosterIds };

	return rosterIds;
};

export const resetRoster = (event) => {
	event.roster = { ...(event.roster ?? {}), rosterIds: [] };
};

export const setRosterThread = (event, threadId) => {
	event.roster = { ...(event.roster ?? {}), threadId };
};

export const getRosterSplit = (event) => {
	const pool = getEligiblePool(event);
	const rosterIds = new Set(getRosterIds(event));

	const roster = pool.filter((player) => rosterIds.has(player.userId));
	const bench = pool.filter((player) => !rosterIds.has(player.userId));

	return { roster, bench };
};
