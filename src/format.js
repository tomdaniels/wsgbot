export const formatEventTime = (timestamp) => {
	const unix = Math.floor(timestamp / 1000);

	return `<t:${unix}:F>\n<t:${unix}:R>`;
};

export const formatEventDateShort = (timestamp) =>
	new Date(timestamp).toISOString().slice(0, 16).replace("T", " ");
