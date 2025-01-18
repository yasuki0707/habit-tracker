export const fetchActivityData = async (
	dateString: string,
	accessToken: string,
) => {
	const url = `https://api.fitbit.com/1/user/-/activities/date/${dateString}.json`;
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});
	const data = await response.json();
	return data;
};
