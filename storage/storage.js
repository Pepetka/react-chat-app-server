import multer from 'multer';
import {dirname, join, extname} from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url))
export const filesDir = join(__dirname, 'uploads');

const storage = multer.memoryStorage({
	destination: function (req, file, cb) {
		cb(null, filesDir);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		cb(null, `${file.fieldname}-${uniqueSuffix}${file.originalname}`);
	},
});

export const upload = multer({ storage });
