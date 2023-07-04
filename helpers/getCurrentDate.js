const withStartZero = (num) => {
	return num < 10 ? `0${num}` : `${num}`;
};

const getCurrentDate = (withSeconds = false) => {
	return `${withStartZero(new Date().getHours())}:${withStartZero(
		new Date().getMinutes(),
	)}${
		withSeconds ? `:${withStartZero(new Date().getSeconds())}` : ''
	} ${new Date().toLocaleDateString()}`;
};

export default getCurrentDate;
