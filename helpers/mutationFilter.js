export function mutationFilter(cb) {
	for (let l = this.length - 1; l >= 0; l -= 1) {
		if (!cb(this[l])) this.splice(l, 1);
	}

	return this;
}
