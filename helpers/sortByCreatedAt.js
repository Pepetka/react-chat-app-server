const sortByCreatedAt = (prevPost, nextPost) => {
	const prevDate = new Date(
		`${prevPost.createdAt.split(' ')[0]} ${prevPost.createdAt
			.split(' ')[1]
			.split('.')
			.reverse()
			.join('.')}`,
	).getTime();
	const nextDate = new Date(
		`${nextPost.createdAt.split(' ')[0]} ${nextPost.createdAt
			.split(' ')[1]
			.split('.')
			.reverse()
			.join('.')}`,
	).getTime();

	return nextDate - prevDate;
};

export default sortByCreatedAt;
