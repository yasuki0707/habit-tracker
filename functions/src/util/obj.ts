export const getNested = (obj: any, ...args: any) => {
	const arr = [];
	for (let i = 0; i < args.length; i++) {
		if (!obj || !obj.hasOwnProperty(args[i])) {
			console.error(`${arr.join('.')} doesn't have a key:'${args[i]}'`);
			return undefined;
		}
		arr.push(args[i]);
		obj = obj[args[i]];
	}
	return obj;
};
