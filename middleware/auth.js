import jwt from "jsonwebtoken";

const verificationAuth = (req, res, next) => {
	if (req.originalUrl === '/login' || req.originalUrl === '/register') {
		return next();
	}

	const token = req.headers.authorization?.split(' ')?.[1];

	if (!token) {
		return res.status(401).json({ message: 'Access Denied / AUTH ERROR' });
	}

	try {
		const verifiedUser = jwt.verify(token, process.env.SECRET_KEY);

		if (!verifiedUser) {
			return res.status(401).json({ message: 'Unauthorized request' })
		}

		req.user = verifiedUser;
		return next();
	} catch (e) {
		console.log(e)
		return res.status(400).json({ message: 'Invalid Token' });
	}
};

export default verificationAuth;
