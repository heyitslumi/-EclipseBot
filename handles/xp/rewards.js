const rewards = [
	{ level: 1, description: '$0.25 credit' },
	{ level: 10, description: '$0.25 credit' },
	{ level: 20, description: '$0.25 credit' },
	{ level: 25, description: '$10 credit' },
	{ level: 30, description: 'Voucher (10%) for a product order of your choice\\*¹' },
	{ level: 30, description: '$0.25 credit' },
	{ level: 35, description: '1 month free for a new order (max. $25)\\*¹ ²' },
	{ level: 40, description: '1 month free for a renewal (max. $25)\\*¹ ²' },
	{ level: 40, description: '$0.25 credit' },
	{ level: 50, description: 'Personal discount voucher (10%)' },
	{ level: 50, description: '$0.25 credit' }
];

for (let lvl = 60; lvl <= 100; lvl += 10) {
	rewards.push({ level: lvl, description: '$0.25 credit' });
}

function getRewardForLevel(level) {
	return rewards.find(r => r.level === level);
}

function getAllRewards() {
	return rewards;
}

module.exports = {
	getRewardForLevel,
	getAllRewards
};
