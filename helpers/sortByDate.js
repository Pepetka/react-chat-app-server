import dateToMilliseconds from "./dateToMilliseconds.js";

const sortByDate = (prev, current, direction = 'dawn') => {
	const prevDate = dateToMilliseconds(prev);
	const currentDate = dateToMilliseconds(current);

	const coefficient = direction === 'dawn' ? 1 : -1;

	return coefficient * (currentDate - prevDate);
};

export default sortByDate;
