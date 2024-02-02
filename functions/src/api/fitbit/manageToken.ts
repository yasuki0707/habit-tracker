import { firestore } from 'firebase-admin';

const COLLECTION_PATH = process.env.COLLECTION_PATH || '';
const FITBIT_DOC_ID = process.env.FITBIT_DOC_ID || '';
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';

export const retrieveRefreshToken = async () => {
  const collection = await firestore().collection(`${COLLECTION_PATH}`); // .doc(docId).set(t);

  const data = (await collection.doc(FITBIT_DOC_ID).get()).data();

  if (!data) {
    console.error(`Document ${FITBIT_DOC_ID} is not included in Firestore:${COLLECTION_PATH}`);
    return null;
  }
  const refreshToken = data['refreshToken'];
  if (!refreshToken) {
    console.error(`Field 'refreshToken' is not included in Firestore:${COLLECTION_PATH}/${FITBIT_DOC_ID}`);
    return null;
  }
  return refreshToken as string;
};

export const issueTokenPair = async (refreshToken: string) => {
  const url = `https://api.fitbit.com/oauth2/token?grant_type=refresh_token&refresh_token=${refreshToken}`;
  const basicToken = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const data = await response.json();

  // NOTE: failed の時のみ success = false が返ってくる
  if ('success' in data && !data.success) {
    console.error(`Failed to fetch refresh token from firestore: ${data.errors[0].message}`);
    return null;
  }
  const newAccessToken = data['access_token'];
  const newRefreshToken = data['refresh_token'];
  if (!newAccessToken || !newRefreshToken) {
    console.error(`newAccessToken: ${newAccessToken}, newRefreshToken: ${newRefreshToken}`);
    return null;
  }
  storeRefreshToken(newRefreshToken);

  return newAccessToken as string;
};

export const storeRefreshToken = async (newRefreshToken: string) => {
  await firestore().collection(`${COLLECTION_PATH}`).doc(FITBIT_DOC_ID).set({ refreshToken: newRefreshToken });
};
