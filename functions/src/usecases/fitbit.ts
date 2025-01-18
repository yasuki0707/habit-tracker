import { fetchActivityData } from '@/api/fitbit/activity';
import { fetchSleepData } from '@/api/fitbit/sleep';

export const fetchData = async (dateForFitbit: string, accessToken: string) => {
	const sleep = await fetchSleepData(dateForFitbit, accessToken);
	const sleepDurationInMin = sleep.summary.totalMinutesAsleep;
	// console.log('sleepDurationInMin:', sleepDurationInMin);

	const activity = await fetchActivityData(dateForFitbit, accessToken);
	const steps = activity.summary.steps;
	const totalDistance = activity.summary.distances.find(
		(d: any) => d.activity === 'total',
	).distance;
	const running = {
		steps:
			activity.activities.find((act: any) => act.name === 'Run')?.steps || 0,
		durationInMin:
			activity.activities.find((act: any) => act.name === 'Run')?.duration /
				1000 /
				60 || 0,
	};

	return { running, sleepDurationInMin, steps };
};
