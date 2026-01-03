const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const discordTranscripts = require('discord-html-transcripts');

const levelSystem = require('../handles/xp/levelSystem');
const { STAFF_ROLE_ID, BOOST_XP } = require('../handles/xp/xpConfig');
const { getAllRewards } = require('../handles/xp/rewards');
const { updatejson, checkjson, checkrole } = require('../jsonupdate.js');

const BOOST_DATA_FILE = path.join(__dirname, '..', 'data', 'boosted.json');

function ensureJsonFile(filePath) {
	if (!fs.existsSync(filePath)) {
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(filePath, '{}');
	}
}

function setReceivedBoostXP(userId) {
	ensureJsonFile(BOOST_DATA_FILE);
	const data = JSON.parse(fs.readFileSync(BOOST_DATA_FILE, 'utf8'));
	data[userId] = true;
	fs.writeFileSync(BOOST_DATA_FILE, JSON.stringify(data, null, 2));
}

// a bit touched by AI - Noname 2026
// ALSO very bad / poorly coded..
// Merged old files into one single staff command-
// Huge file tho <3

module.exports = {
	data: new SlashCommandBuilder()
		.setName('staff')
		.setDescription('Staff commands: moderation, tickets, XP, rewards')
		.addSubcommand(sub =>
			sub
				.setName('givexp')
				.setDescription('Give XP to a user')
				.addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
				.addIntegerOption(opt => opt.setName('amount').setDescription('XP amount').setRequired(true))
		)
		.addSubcommand(sub =>
			sub
				.setName('removexp')
				.setDescription('Remove XP from a user')
				.addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
				.addIntegerOption(opt => opt.setName('amount').setDescription('XP amount').setRequired(true))
		)
		.addSubcommand(sub =>
			sub
				.setName('givebooster')
				.setDescription('Mark user as booster (for XP)')
				.addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
		)
		.addSubcommand(sub =>
			sub
				.setName('claim')
				.setDescription('Mark a user reward for a specific level as claimed')
				.addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
				.addIntegerOption(opt => opt.setName('level').setDescription('Level').setRequired(true))
		)
		.addSubcommand(sub =>
			sub
				.setName('check')
				.setDescription('Check if a user has claimed a reward for a specific level')
				.addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
				.addIntegerOption(opt => opt.setName('level').setDescription('Level').setRequired(true))
		)
		.addSubcommand(sub =>
			sub
				.setName('eligible')
				.setDescription('List all level rewards and claimed status for a user')
				.addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
		)
		.addSubcommand(sub =>
			sub
				.setName('ban')
				.setDescription('Ban a user by ID')
				.addStringOption(opt => opt.setName('user').setDescription('User ID to ban').setRequired(true))
				.addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false))
		)
		.addSubcommand(sub =>
			sub
				.setName('kick')
				.setDescription('Kick a member')
				.addUserOption(opt => opt.setName('user').setDescription('User to kick').setRequired(true))
				.addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false))
		)
		.addSubcommand(sub =>
			sub
				.setName('timeout')
				.setDescription('Timeout a member')
				.addUserOption(opt => opt.setName('user').setDescription('User to timeout').setRequired(true))
				.addIntegerOption(opt => opt.setName('time').setDescription('Time in minutes').setRequired(true))
				.addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false))
		)
		.addSubcommand(sub =>
			sub
				.setName('unban')
				.setDescription('Unban a user by ID')
				.addStringOption(opt => opt.setName('userid').setDescription('User ID to unban').setRequired(true))
				.addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false))
		)
		.addSubcommand(sub =>
			sub
				.setName('untimeout')
				.setDescription('Remove a member timeout')
				.addUserOption(opt => opt.setName('user').setDescription('User to untimeout').setRequired(true))
				.addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false))
		)
		.addSubcommand(sub =>
			sub
				.setName('close')
				.setDescription('Close ticket')
		)
		.addSubcommand(sub =>
			sub
				.setName('reopen')
				.setDescription('Reopen ticket')
		)
		.addSubcommand(sub =>
			sub
				.setName('delete')
				.setDescription('Delete ticket')
		)
		.addSubcommand(sub =>
			sub
				.setName('limit')
				.setDescription('Check your staff limits')
		),
	async execute(interaction, client) {
			if (!interaction.inGuild?.() || !interaction.guild) {
				return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
			}

			let member;
			try {
				member =
					interaction.guild.members?.cache?.get?.(interaction.user.id) ||
					(await interaction.guild.members.fetch(interaction.user.id));
			} catch {
				member = null;
			}

			const staffRoleIds = [
				String(gconfig?.staffAccessRoleID || '').trim(),
				String(STAFF_ROLE_ID || '').trim()
			].filter(Boolean);
			const heldStaffRoleId = !!member
				? staffRoleIds.find(roleId => member.roles.cache.has(roleId))
				: null;
			const hasStaffRole = !!heldStaffRoleId;
			const quotaRoleId = heldStaffRoleId || member?.roles?.highest?.id;

			let hasLegacyStaffRole = false;
			try {
				hasLegacyStaffRole = !!quotaRoleId && (await checkrole(quotaRoleId));
			} catch {
				hasLegacyStaffRole = false;
			}
			const staffAllowed = hasStaffRole || hasLegacyStaffRole;

			if (!staffAllowed) {
			return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
		}

		const discordClient = client || interaction.client;

		const sub = interaction.options.getSubcommand();

		// Old commands files merge starts here (2024 ones) - Noname 2026 
		const cooldownMs = 1 * 1000 * 60;
		if (!discordClient.limits) discordClient.limits = {};

		if (sub === 'ban') {
			await interaction.deferReply();
			const user = interaction.options.getString('user');
			if (interaction.guild.members.cache.some(x => x.id == user)) {
				if (!interaction.guild.members.cache.some(x => x.id == user).bannable) {
					return interaction.editReply({ content: `I cannot ban this user`, ephemeral: true });
				}
			}
			const reason = `${interaction.options.getString('reason') || 'No reason given'} | Banned by ${interaction.user.username}`;
			if (staffAllowed) {
				if (discordClient.limits[`${interaction.user.id}`] < Date.now()) delete discordClient.limits[`${interaction.user.id}`];
				if (Object.keys(discordClient.limits).includes(interaction.user.id)) {
					return interaction.editReply(
						`You have already kicked/banned/timeouted someone recently. You can use this again in <t:${Math.round(discordClient.limits[`${interaction.user.id}`] / 1000)}:R>`
					);
				}
				if (interaction.guild.members.cache.some(x => x.id == user)) {
					if (interaction.member.roles.highest.position <= interaction.guild.members.cache.some(x => x.id == user).roles.highest.position) {
						return interaction.editReply('You do not have permission to ban this person');
					}
				}
				const result = await checkjson(interaction.user.id, 'ban', quotaRoleId);
				if (result == true) return interaction.editReply('You used your "Highest Staff Role" limit for ban usage');
				try {
					await interaction.guild.bans.create(user, { reason });
					await interaction.editReply(`Banned <@${user}>\nReason: ${reason}`);
					await updatejson(interaction.user.id, 'ban', quotaRoleId, discordClient, user, reason);
					discordClient.limits[`${interaction.user.id}`] = Date.now() + cooldownMs;
				} catch (err) {
					return interaction.editReply(`There was an error:n ${err}`);
				}
				return;
			}
			return interaction.editReply('You do not have permission to run this command');
		}

		if (sub === 'kick') {
			await interaction.deferReply();
			const user = interaction.options.getUser('user');
			const member = await interaction.guild.members.fetch(user.id);
			if (!member.kickable) return interaction.editReply({ content: `I cannot kick this user`, ephemeral: true });
			const reason = `${interaction.options.getString('reason') || 'No reason given'} | Kicked by ${interaction.user.username}`;
			if (staffAllowed) {
				if (discordClient.limits[`${interaction.user.id}`] < Date.now()) delete discordClient.limits[`${interaction.user.id}`];
				if (Object.keys(discordClient.limits).includes(interaction.user.id)) {
					return interaction.editReply(
						`You have already kicked/banned/timeouted someone recently. You can use this again in <t:${Math.round(discordClient.limits[`${interaction.user.id}`] / 1000)}:R>`
					);
				}
				if (interaction.member.roles.highest.position <= member.roles.highest.position) return interaction.editReply('You do not have permission to ban this person');
				const result = await checkjson(interaction.user.id, 'kick', quotaRoleId);
				if (result == true) return interaction.editReply('You used your "Highest Staff Role" limit for kick usage');
				try {
					await updatejson(interaction.user.id, 'kick', quotaRoleId, discordClient, member, reason);
					await member.kick({ reason });
					await interaction.editReply(`Kicked <@${user.id}>\nReason: ${reason}`);
					discordClient.limits[`${interaction.user.id}`] = Date.now() + cooldownMs;
				} catch (err) {
					return interaction.editReply(`There was an error:n ${err}`);
				}
				return;
			}
			return interaction.editReply('You do not have permission to run this command');
		}

		if (sub === 'timeout') {
			await interaction.deferReply();
			const user = interaction.options.getUser('user');
			const member = await interaction.guild.members.fetch(user.id);
			if (!member.manageable) return interaction.editReply({ content: `I cannot timeout this user`, ephemeral: true });
			const reason = `${interaction.options.getString('reason') || 'No reason given'} | Timeouted by ${interaction.user.username}`;
			const timeouttime = interaction.options.getInteger('time');
			if (staffAllowed) {
				if (discordClient.limits[`${interaction.user.id}`] < Date.now()) delete discordClient.limits[`${interaction.user.id}`];
				if (Object.keys(discordClient.limits).includes(interaction.user.id)) {
					return interaction.editReply(
						`You have already kicked/banned/timeouted someone recently. You can use this again in <t:${Math.round(discordClient.limits[`${interaction.user.id}`] / 1000)}:R>`
					);
				}
				if (interaction.member.roles.highest.position <= member.roles.highest.position) return interaction.editReply('You do not have permission to timeout this person');
				const result = await checkjson(interaction.user.id, 'timeout', quotaRoleId);
				if (result == true) return interaction.editReply('You used your "Highest Staff Role" limit for timeout usage');
				try {
					await member.timeout(timeouttime * 60000, { reason });
					await updatejson(
						interaction.user.id,
						'timeout',
						quotaRoleId,
						discordClient,
						member,
						reason,
						timeouttime * 60000
					);
					await interaction.editReply(`Timeouted <@${user.id}> for ${timeouttime} minutes!\nReason: ${reason}`);
					discordClient.limits[`${interaction.user.id}`] = Date.now() + cooldownMs;
				} catch (err) {
					return interaction.editReply(`There was an error:n ${err}`);
				}
				return;
			}
			return interaction.editReply('You do not have permission to run this command');
		}

		if (sub === 'unban') {
			await interaction.deferReply();
			const user = interaction.options.getString('userid');
			const reason = `${interaction.options.getString('reason') || 'No reason given'} | Unbanned by ${interaction.user.username}`;
			if (staffAllowed) {
				if (discordClient.limits[`${interaction.user.id}`] < Date.now()) delete discordClient.limits[`${interaction.user.id}`];
				if (Object.keys(discordClient.limits).includes(interaction.user.id)) {
					return interaction.editReply(
						`You have already kicked/banned/timeouted someone recently. You can use this again in <t:${Math.round(discordClient.limits[`${interaction.user.id}`] / 1000)}:R>`
					);
				}
				const result = await checkjson(interaction.user.id, 'unban', quotaRoleId);
				if (result == true) return interaction.editReply('You used your "Highest Staff Role" limit for unban usage');
				try {
					await interaction.guild.members.unban(user);
					await updatejson(interaction.user.id, 'unban', quotaRoleId, discordClient, user, reason);
					discordClient.limits[`${interaction.user.id}`] = Date.now() + cooldownMs;
					await interaction.editReply(`Removed ban for <@${user}>\nReason: ${reason}`);
				} catch (err) {
					return interaction.editReply(`There was an error:n ${err}`);
				}
				return;
			}
			return interaction.editReply('You do not have permission to run this command');
		}

		if (sub === 'untimeout') {
			await interaction.deferReply();
			const user = interaction.options.getUser('user');
			const member = await interaction.guild.members.fetch(user.id);
			if (!member.manageable) return interaction.editReply({ content: `I cannot untimeout this user`, ephemeral: true });
			const reason = `${interaction.options.getString('reason') || 'No reason given'} | UnTimedout by ${interaction.user.username}`;
			if (staffAllowed) {
				if (discordClient.limits[`${interaction.user.id}`] < Date.now()) delete discordClient.limits[`${interaction.user.id}`];
				if (Object.keys(discordClient.limits).includes(interaction.user.id)) {
					return interaction.editReply(
						`You have already kicked/banned/timeouted someone recently. You can use this again in <t:${Math.round(discordClient.limits[`${interaction.user.id}`] / 1000)}:R>`
					);
				}
				if (interaction.member.roles.highest.position <= member.roles.highest.position) return interaction.editReply('You do not have permission to untimeout this person');
				try {
					await member.timeout(10, { reason });
					discordClient.limits[`${interaction.user.id}`] = Date.now() + cooldownMs;
					return interaction.editReply(`Removed timeout for <@${user.id}>\nReason: ${reason}`);
				} catch (err) {
					return interaction.editReply(`There was an error:n ${err}`);
				}
			}
			return interaction.editReply('You do not have permission to run this command');
		}

		if (sub === 'close' || sub === 'reopen' || sub === 'delete') {
			if (discordClient.ticketManager?.tickets?.get?.(interaction.channel.id)) {
				if (staffAllowed) {
					await interaction.reply({ content: `Closing ticket using staff access..` });
					const channel = interaction.channel;
					const attachment = await discordTranscripts.createTranscript(channel);
					const channel2 = await discordClient.channels.fetch(gconfig.ticketlogID);
					channel2.send({ files: [attachment] });
					const ticket = discordClient.ticketManager.tickets.get(interaction.channel.id);
					if (sub === 'close') await discordClient.ticketManager.closeTicket(ticket);
					if (sub === 'reopen') await discordClient.ticketManager.reOpenTicket(ticket);
					if (sub === 'delete') await discordClient.ticketManager.deleteTicket(ticket);
					return;
				}
				return interaction.reply({ content: `Please ping any avaliable staff from Trust & Safety Departament To help you ${sub} ticket!` });
			}
			return interaction.reply({ content: `Please ping any avaliable staff from Trust & Safety Departament To help you ${sub} ticket!` });
		}

		if (sub === 'limit') {
			const object = require('../times.json');
			if (staffAllowed) {
				if (!object[interaction.user.id]) {
					const a = require('../config.json').rolecooldown[quotaRoleId];
					object[interaction.user.id] = {
						bansused: a.bansperday,
						kicksused: a.kicksperday,
						timeoutsused: a.timeoutsperday,
						unbansused: a.unbansperday
					};
				}
				return interaction.reply({
					content: `
						Your limits:
						Ban: ${object[interaction.user.id].bansused} left
						Kick: ${object[interaction.user.id].kicksused} left
						Timeout: ${object[interaction.user.id].timeoutsused} left
						UnBan: ${object[interaction.user.id].unbansused} left
						UnTimeout: Non Limited (for everyone from staff)\nLimit's resetting each 24hours after bot startup
						`
				});
			}
			return interaction.reply({ content: `You dont have any staff role or permission role!` });
		}
        // END MERGE :3
		if (sub === 'givexp') {
			const user = interaction.options.getUser('user');
			const amount = interaction.options.getInteger('amount');
			const { level, xp } = levelSystem.addXP(user.id, amount);
			return interaction.reply({ content: `Added ${amount} XP to ${user}. They now have ${xp} XP (level ${level}).` });
		}

		if (sub === 'removexp') {
			const user = interaction.options.getUser('user');
			const amount = interaction.options.getInteger('amount');
			const { level, xp } = levelSystem.addXP(user.id, -Math.abs(amount));
			return interaction.reply({ content: `Removed ${amount} XP from ${user}. They now have ${xp} XP (level ${level}).` });
		}

		if (sub === 'givebooster') {
			const user = interaction.options.getUser('user');
			setReceivedBoostXP(user.id);
			levelSystem.addXP(user.id, BOOST_XP);
			return interaction.reply({ content: `${user} is now marked as a booster and received ${BOOST_XP} XP.` });
		}

		const CLAIMS_FILE = path.join(__dirname, '..', 'data', 'rewards_claims.json');
		ensureJsonFile(CLAIMS_FILE);

		if (sub === 'claim') {
			const user = interaction.options.getUser('user');
			const level = interaction.options.getInteger('level');
			const data = JSON.parse(fs.readFileSync(CLAIMS_FILE, 'utf8'));
			if (!data[user.id]) data[user.id] = {};
			data[user.id][String(level)] = { claimed: true, claimedBy: interaction.user.id, claimedAt: Date.now() };
			fs.writeFileSync(CLAIMS_FILE, JSON.stringify(data, null, 2));
			return interaction.reply({ content: `Marked reward for level ${level} as claimed for ${user.tag}.` });
		}

		if (sub === 'check') {
			const user = interaction.options.getUser('user');
			const level = interaction.options.getInteger('level');
			let claimed = false;
			let claimedBy = null;
			let claimedAt = null;
			try {
				const data = JSON.parse(fs.readFileSync(CLAIMS_FILE, 'utf8'));
				if (data[user.id]?.[String(level)]?.claimed) {
					claimed = true;
					claimedBy = data[user.id][String(level)].claimedBy;
					claimedAt = data[user.id][String(level)].claimedAt;
				}
			} catch {}

			if (claimed) {
				return interaction.reply({
					content: `Reward for level ${level} for ${user.tag} was claimed by <@${claimedBy}> at <t:${Math.floor(claimedAt / 1000)}:f>.`
				});
			}
			return interaction.reply({ content: `Reward for level ${level} for ${user.tag} has not been claimed.` });
		}

		if (sub === 'eligible') {
			const user = interaction.options.getUser('user');
			let claims = {};
			try {
				claims = JSON.parse(fs.readFileSync(CLAIMS_FILE, 'utf8'))[user.id] || {};
			} catch {
				claims = {};
			}
			const userLevel = levelSystem.getUserLevel(user.id).level;
			const rewards = getAllRewards();
			let msg = `Eligibility for ${user.tag} (level ${userLevel}):`;
			for (const r of rewards) {
				const claimed = claims[String(r.level)]?.claimed;
				const eligible = userLevel >= r.level;
				msg += `\n• Level ${r.level}: ${r.description} - ${eligible ? (claimed ? '✅ Claimed' : '🟢 Eligible') : '🔴 Not eligible'}`;
			}
			return interaction.reply({ content: msg });
		}

		return interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
	}
};
