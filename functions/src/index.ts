import './fix-ts-paths';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { DayjsDate } from '@/util/day';
import { retrieveRefreshToken, issueTokenPair, storeRefreshToken } from '@/fitbit/api/manageToken';

import { fetchData } from '@/fitbit/usecases';
import { updateDBPage } from '@/notion/usecases';

// Pub/Sub Topic名
const PUBSUB_TOPIC_NAME = 'habit-tracker-pubsub-topic';

const { onMessagePublished } = require('firebase-functions/v2/pubsub');

const firebase = initializeApp();

exports.habitTrackerPubsub = onMessagePublished(PUBSUB_TOPIC_NAME, async (event: any) => {
  // Pub/sub メッセージが来た時点の日付の前日をとる
  const targetDate = new DayjsDate().jt().dayBefore(1);
  // console.log('targetDate:', targetDate);

  const dateForFitbit = targetDate.format('YYYY-MM-DD');
  // const dateForFitbit = '2024-01-04';
  // console.log('dateForFitbit:', dateForFitbit);

  const oldRefreshToken = await retrieveRefreshToken();
  if (!oldRefreshToken) {
    console.error("Couldn't retrieve refresh token");
    return;
  }

  const accessToken = await issueTokenPair(oldRefreshToken);
  if (!accessToken) {
    console.error('Access token is not valid');
    return;
  }

  const { running, sleepDurationInMin, steps } = { ...(await fetchData(dateForFitbit, accessToken)) };

  await updateDBPage(targetDate.format('DD'), running.durationInMin, sleepDurationInMin, steps);
});
