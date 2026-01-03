const fs = require('fs');
const path = require('path');

const pendingFile = path.join(__dirname, '..', '..', 'data', 'invite_pending.json');

function getPendingInviteXpForUser(userId) {
	if (!fs.existsSync(pendingFile)) return [];
	const pending = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
	const now = Date.now();
	return Object.entries(pending)
		.filter(([memberId, entry]) => entry.inviter === userId && !entry.left && !entry.granted)
		.map(([memberId, entry]) => ({
			memberId,
			grantAt: entry.grantAt,
			msLeft: Math.max(0, entry.grantAt - now)
		}));
}

module.exports = { getPendingInviteXpForUser };
