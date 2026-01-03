const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'levels.json');

function ensureDataFile() {
	if (!fs.existsSync(DATA_FILE)) {
		fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
		fs.writeFileSync(DATA_FILE, '{}');
	}
}

function loadLevels() {
	ensureDataFile();
	return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveLevels(data) {
	fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getXPForLevel(level) {
	return 100 * level;
}

function addXP(userId, amount) {
	const data = loadLevels();
	if (!data[userId]) data[userId] = { xp: 0, level: 0 };
	data[userId].xp += amount;
	if (data[userId].xp < 0) data[userId].xp = 0;

	let leveledUp = false;
	let nextLevelXP = getXPForLevel(data[userId].level + 1);
	while (data[userId].xp >= nextLevelXP) {
		data[userId].level++;
		leveledUp = true;
		nextLevelXP = getXPForLevel(data[userId].level + 1);
	}

	while (data[userId].level > 0 && data[userId].xp < getXPForLevel(data[userId].level)) {
		data[userId].level--;
		leveledUp = false;
	}

	saveLevels(data);
	return { ...data[userId], leveledUp };
}

function getUserLevel(userId) {
	const data = loadLevels();
	return data[userId] || { xp: 0, level: 0 };
}

function getLeaderboard(top = 10) {
	const data = loadLevels();
	return Object.entries(data)
		.map(([userId, stats]) => ({ userId, ...stats }))
		.sort((a, b) => b.xp - a.xp)
		.slice(0, top);
}

module.exports = {
	addXP,
	getUserLevel,
	getLeaderboard,
	getXPForLevel
};
