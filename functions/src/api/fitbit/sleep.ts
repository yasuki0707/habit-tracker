export const fetchSleepData = async (dateString: string, accessToken: string) => {
  const url = `https://api.fitbit.com/1.2/user/-/sleep/date/${dateString}.json`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await response.json();
  return data;
};
