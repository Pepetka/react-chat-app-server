const getContains = (str, search) => {
	const stringArray = str.toLowerCase().split(' ');
	const searchArray = search.toLowerCase().split(' ');

	return searchArray.reduce(
		(previous, current) =>
			previous && !!stringArray.filter((word) => word.includes(current)).length,
		true,
	);
};

export default getContains;
