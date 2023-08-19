import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const filesDir = join(__dirname, 'uploads');

const storage = multer.memoryStorage({
	destination: function (req, file, cb) {
		cb(null, filesDir);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		cb(null, `${file.fieldname}-${uniqueSuffix}${file.originalname}`);
	},
});

export const saveImage = async ({
	buffer,
	originalname,
	fieldname,
	name,
	file,
}) => {
	const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
	let ref;

	if (buffer) {
		ref = `${fieldname}-${uniqueSuffix}${originalname}.webp`;
		await sharp(buffer).webp({ quality: 20 }).toFile(join(filesDir, ref));
	} else {
		ref = `images-${uniqueSuffix}${name}.webp`;
		await sharp(file).webp({ quality: 20 }).toFile(join(filesDir, ref));
	}

	return ref;
};

export const upload = multer({ storage });
