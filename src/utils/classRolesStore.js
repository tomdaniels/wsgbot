import { mkdir, readFile, writeFile } from "node:fs/promises";

const dataDirectory = new URL("../../data/", import.meta.url);
const dataFile = new URL("../../data/classRoles.json", import.meta.url);

const defaultData = {
	panels: {},
};

const ensureData = async () => {
	await mkdir(dataDirectory, { recursive: true });

	try {
		await readFile(dataFile, "utf8");
	} catch {
		await writeFile(dataFile, JSON.stringify(defaultData, null, "\t"));
	}
};

export const loadClassRolesData = async () => {
	await ensureData();

	const contents = await readFile(dataFile, "utf8");
	const data = JSON.parse(contents);

	return {
		panels: data.panels ?? {},
	};
};

export const saveClassRolesData = async (data) => {
	await ensureData();

	await writeFile(dataFile, JSON.stringify(data, null, "\t"));
};
