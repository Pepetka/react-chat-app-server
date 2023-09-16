import jwt from 'jsonwebtoken';

const verificationAuth = (req, res, next) => {
	if (
		req.originalUrl === '/login' ||
		req.originalUrl === '/register' ||
		req.originalUrl === '/relogin' ||
		req.originalUrl.includes('/images/')
	) {
		return next();
	}

	const token = req.headers.authorization?.split(' ')?.[1];

	if (!token) {
		return res.status(401).json({ message: 'Access Denied / AUTH ERROR' });
	}

	try {
		const verifiedUser = jwt.verify(token, process.env.SECRET_KEY);

		if (!verifiedUser) {
			return res.status(401).json({ message: 'Unauthorized request' });
		}

		req.user = verifiedUser;
		return next();
	} catch (e) {
		console.log(e);
		return res.status(401).json({ message: 'Invalid token' });
	}
};

const verificationAuthSocket = (socket, next) => {
	const token = socket.handshake.auth.token;

	if (!token) {
		return next(new Error('Access Denied / AUTH ERROR'));
	}

	try {
		const verifiedUser = jwt.verify(token, process.env.SECRET_KEY);

		if (!verifiedUser) {
			return next(new Error('Unauthorized request'));
		}

		socket.user = verifiedUser;
		return next();
	} catch (e) {
		console.log(e);
		return next(new Error('Invalid token'));
	}
};

export { verificationAuth, verificationAuthSocket };
