const sortByTime = (prev, current, direction = 'dawn') => {
	const prevMinutes = +prev.split(':')[1];
	const currentMinutes = +current.split(':')[1];

	const prevHours = +prev.split(':')[0];
	const currentHours = +current.split(':')[0];

	let prevSeconds = 0;
	let currentSeconds = 0;

	if (prev.split.length === 3) {
		prevSeconds = +prev.split(':')[2];
		currentSeconds = +current.split(':')[2];
	}

	const coefficient = direction === 'dawn' ? 1 : -1;

	return (
		coefficient *
		(currentHours - prevHours === 0
			? currentMinutes - prevMinutes === 0
				? currentSeconds - prevSeconds
				: currentMinutes - prevMinutes
			: currentHours - prevHours)
	);
};

export default sortByTime;
