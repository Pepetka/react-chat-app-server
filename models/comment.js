import { v4 as createId } from "uuid";
import getCurrentDate from "../helpers/getCurrentDate.js";

function CommentModel({text, authorId, postId}) {
	this.id = createId();
	this.text = text;
	this.authorId = authorId;
	this.postId = postId;
	this.createdAt = getCurrentDate(true);
}

export default CommentModel;
