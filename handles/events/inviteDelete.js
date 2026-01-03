module.exports = {
	name: 'inviteDelete',
	once: false,
	async execute(invite, client) {
		try {
			if (!client.inviteCache) client.inviteCache = new Map();
			const invites = await invite.guild.invites.fetch();
			client.inviteCache.set(invite.guild.id, new Map(invites.map(inv => [inv.code, inv.uses])));
		} catch {}
	}
};
