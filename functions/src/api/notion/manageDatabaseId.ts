import { firestore } from 'firebase-admin';

const COLLECTION_PATH = process.env.COLLECTION_PATH || '';
const NOTION_DOC_ID = process.env.NOTION_DOC_ID || '';

export const fetchNotionDatabaseId = async () => {
	const collection = await firestore().collection(`${COLLECTION_PATH}`); // .doc(docId).set(t);

	const data = (await collection.doc(NOTION_DOC_ID).get()).data();
	if (!data) {
		console.error(
			`Document '${NOTION_DOC_ID}'is not included in Firestore: '${COLLECTION_PATH}'`,
		);
		return null;
	}
	const databaseId = data['databaseId'];
	if (!databaseId) {
		console.error(
			`Field 'databaseId' is not included in Firestore: '${COLLECTION_PATH}/${NOTION_DOC_ID}'`,
		);
		return null;
	}
	return databaseId as string;
};

export const storeDatabaseId = async (newDatabaseId: string) => {
	await firestore()
		.collection(`${COLLECTION_PATH}`)
		.doc(NOTION_DOC_ID)
		.set({ databaseId: newDatabaseId });
};
