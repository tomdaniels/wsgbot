import { mkdir, readFile, writeFile } from "node:fs/promises";

const dataDirectory = new URL("../../data/", import.meta.url);
const dataFile = new URL("../../data/wargame.json", import.meta.url);

const defaultData = {
	events: {},
};

const ensureData = async () => {
	await mkdir(dataDirectory, { recursive: true });

	try {
		await readFile(dataFile, "utf8");
	} catch {
		await writeFile(dataFile, JSON.stringify(defaultData, null, "\t"));
	}
};

export const loadWargameData = async () => {
	await ensureData();

	const contents = await readFile(dataFile, "utf8");

	return JSON.parse(contents);
};

export const saveWargameData = async (data) => {
	await ensureData();

	await writeFile(dataFile, JSON.stringify(data, null, "\t"));
};
