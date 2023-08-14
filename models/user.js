import { v4 as generateId } from 'uuid';

function UserModel({
	username,
	password,
	firstname,
	lastname,
	email,
	age,
	avatar,
	token,
}) {
	this.username = username;
	this.password = password;
	this.id = generateId();
	this.firstname = firstname;
	this.lastname = lastname;
	this.email = email;
	this.age = age;
	this.createdAt = new Date().toLocaleDateString();
	this.avatar = avatar;
	this.token = token;
}

function UserMiniModel({ id, avatar, name }) {
	this.id = id;
	this.name = name;
	this.avatar = avatar;
}

export { UserModel, UserMiniModel };
