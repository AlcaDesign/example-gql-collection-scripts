interface BitsUsageHistory_Abridged {
	userId: string;
	hasNextPage: boolean;
	totalCount: number;
	events: BitsEvent[];
}

interface BitsEvent {
	__type: 'BitsEvent';
	id: string;
	type: 'GIVE_BITS_TO_BROADCASTER' | 'USE_BITS_ON_EXTENSION';
	amount: number;
	usedAt: string;
	channel: User;
}

interface User {
	__typename: 'User';
	id: string;
	login: string;
	displayName: string;
	profileImageURL: string;
}

interface BitsEvent_Abridged {
	id: BitsEvent['id'];
	type: number;
	amount: BitsEvent['amount'];
	usedAt: BitsEvent['usedAt'];
	channel: number;
}

interface ResultData {
	userId: string;
	totalCount: number;
	events: BitsEvent_Abridged[];
	eventTypes: BitsEvent['type'][];
	channels: Omit<User, '__typename'>[];
}