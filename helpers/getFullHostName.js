export const getFullHostName = ({ protocol, get, headers }) => {
	const host = headers?.host ?? get('host');
	return `${protocol || 'http'}://${host}`;
};
