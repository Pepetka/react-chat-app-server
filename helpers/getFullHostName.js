export const getFullHostName = ({ get, headers }) => {
	const host = headers?.host ?? get('host');
	return `https://${host}`;
};
