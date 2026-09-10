import { memberHasRole } from "../domain/classes.js";
import { getRosterSplit, resetRoster, setRosterSelection, setRosterThread } from "../domain/roster.js";
import { formatEventDateShort } from "../utils/datetime.js";
import { loadWargameData, saveWargameData } from "../utils/wargameStore.js";
import { buildRosterAnnouncement, buildRosterDraftView } from "../ui/rosterPanel.js";

export const prefix = "roster";

const requireOrganizer = async (interaction) => {
	const member = await interaction.guild.members.fetch(interaction.user.id);

	if (!memberHasRole(member, "Organizer")) {
		await interaction.reply({
			content: "Only organizers can manage the roster.",
			flags: 64,
		});

		return false;
	}

	return true;
};

const loadEvent = async (interaction) => {
	const data = await loadWargameData();
	const event = data.events[interaction.guildId];

	if (!event) {
		await interaction.reply({
			content: "There isn't an active wargame.",
			flags: 64,
		});

		return null;
	}

	return { data, event };
};

const handlePick = async (interaction) => {
	if (!(await requireOrganizer(interaction))) {
		return;
	}

	const loaded = await loadEvent(interaction);

	if (!loaded) {
		return;
	}

	const { data, event } = loaded;

	setRosterSelection(event, interaction.values);
	await saveWargameData(data);

	await interaction.update(await buildRosterDraftView(event, interaction.guild));
};

const handleReset = async (interaction) => {
	if (!(await requireOrganizer(interaction))) {
		return;
	}

	const loaded = await loadEvent(interaction);

	if (!loaded) {
		return;
	}

	const { data, event } = loaded;

	resetRoster(event);
	await saveWargameData(data);

	await interaction.update(await buildRosterDraftView(event, interaction.guild));
};

const handleSubmit = async (interaction) => {
	if (!(await requireOrganizer(interaction))) {
		return;
	}

	const loaded = await loadEvent(interaction);

	if (!loaded) {
		return;
	}

	const { data, event } = loaded;
	const { roster } = getRosterSplit(event);

	if (roster.length === 0) {
		await interaction.reply({
			content: "Pick at least one player for the roster before submitting.",
			flags: 64,
		});

		return;
	}

	const channel = await interaction.guild.channels.fetch(event.channelId);
	const signupMessage = await channel.messages.fetch(event.messageId);

	const thread = event.roster.threadId
		? await channel.threads.fetch(event.roster.threadId).catch(() => null)
		: null;

	const activeThread =
		thread ??
		(await signupMessage.startThread({
			name: `Roster – ${formatEventDateShort(event.date)}`,
		}));

	if (!event.roster.threadId) {
		setRosterThread(event, activeThread.id);
		await saveWargameData(data);
	}

	await activeThread.send(await buildRosterAnnouncement(event, interaction.guild));

	await interaction.update({
		content: `Roster posted to ${activeThread}.`,
		components: [],
	});
};

export const handle = async (interaction) => {
	if (interaction.isStringSelectMenu() && interaction.customId.startsWith("roster:pick:")) {
		await handlePick(interaction);
		return;
	}

	if (interaction.isButton() && interaction.customId.startsWith("roster:reset:")) {
		await handleReset(interaction);
		return;
	}

	if (interaction.isButton() && interaction.customId.startsWith("roster:submit:")) {
		await handleSubmit(interaction);
	}
};
