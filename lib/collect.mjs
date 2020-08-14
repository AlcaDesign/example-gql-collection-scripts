import fetch from 'node-fetch';
import fs from 'fs/promises';

import { oauth, clientId, hash, operationName, gqlURL } from '../variables.mjs';
const first = 100;

if([ oauth, clientId, hash, operationName, gqlURL ].some(n => !n)) {
	console.log('Missing a variable. Please set up variables.mjs');
	process.exit(0);
}

/** @returns {BitsUsageHistory_Abridged} */
async function getData(after = 0) {
	const res = await fetch(gqlURL, {
		method: 'POST',
		headers: { Authorization: `OAuth ${oauth}`, 'Client-Id': clientId },
		body: JSON.stringify({
			extensions: { persistedQuery: { sha256Hash: hash, version: 1 } },
			operationName,
			variables: { after: after.toString(), filters: {}, first }
		})
	});
	const { errors, data } = await res.json();
	if(errors) {
		if(Array.isArray(errors) && errors.length === 1) {
			throw errors[0];
		}
		throw errors;
	}
	const {
		currentUser: {
			id: userId,
			bitsEvents: {
				pageInfo: { hasNextPage },
				totalCount,
				edges
			}
		}
	} = data;
	const events = edges.map(n => n.node);
	return { userId, hasNextPage, totalCount, events };
}

/** @type {ResultData} */
const data = {
	userId: '',
	totalCount: 0,
	events: [],
	eventTypes: [],
	channels: []
};

/** @param {BitsEvent['type']} type */
const getEventTypeEnum = type => {
	const index = data.eventTypes.indexOf(type);
	return index > -1 ? index : data.eventTypes.push(type) - 1;
};
/** @param {User} channel */
const getChannelEnum = channel => {
	if(!channel || typeof channel !== 'object') {
		return -1;
	}
	delete channel.__typename;
	const index = data.channels.findIndex(n => n.id === channel.id);
	return index > -1 ? index : data.channels.push(channel) - 1;
};

let hasNextPage = false;
let after = 0;

do {
	try {
		console.log('Getting data...', after);
		const res = await getData(after);
		({ hasNextPage } = res);
		const { events, totalCount, userId } = res;
		if(!data.totalCount) {
			console.log('User ID:', userId);
			console.log('Total events:', totalCount);
		}
		data.totalCount = totalCount;
		data.userId = userId;
		console.log('Got', events.length, 'new events');
		const abrEvents = events.map(({ type, channel, __type, ...rest }) => ({
			type: getEventTypeEnum(type),
			channel: getChannelEnum(channel),
			...rest
		}));
		data.events.push(...abrEvents);
		after += first;
	} catch(err) {
		console.error(err);
		process.exit();
		// Recognize certain temporary errors and continue?
		// break;
	}
} while(hasNextPage);

await fs.writeFile('./response.json', JSON.stringify(data, null, '\t'));

console.log('Done, wrote to response.json');
console.log('Use: npm run analyze');