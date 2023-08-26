const sortByCreatedAt = (prev, next, direction = 'dawn') => {
	const prevDate = new Date(
		`${prev.createdAt.split(' ')[0]} ${prev.createdAt
			.split(' ')[1]
			.split('.')
			.reverse()
			.join('.')}`,
	).getTime();
	const nextDate = new Date(
		`${next.createdAt.split(' ')[0]} ${next.createdAt
			.split(' ')[1]
			.split('.')
			.reverse()
			.join('.')}`,
	).getTime();

	const coefficient = direction === 'dawn' ? 1 : -1;

	return coefficient * (nextDate - prevDate);
};

export default sortByCreatedAt;
