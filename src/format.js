export const formatEventTime = (timestamp) => {
	const unix = Math.floor(timestamp / 1000);

	return `<t:${unix}:F>\n<t:${unix}:R>`;
};
