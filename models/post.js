import { v4 as createId } from "uuid";
import getCurrentDate from "../helpers/getCurrentDate.js";

function PostModel({authorId, text, img}) {
	this.authorId = authorId;
	this.text = text;
	this.img = img;
	this.createdAt = getCurrentDate();
	this.id = createId();
}

export default PostModel;
