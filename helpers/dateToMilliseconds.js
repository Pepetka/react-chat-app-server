const dateToMilliseconds = (date) => {
	return new Date(date.split('.').reverse().join('.')).getTime();
};

export default dateToMilliseconds;
