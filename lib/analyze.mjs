import fs from 'fs/promises';

const json = await fs.readFile('./response.json', 'utf8');
/** @type {ResultData} */
const data = JSON.parse(json);

const [
	GIVE_BITS_TO_BROADCASTER,
	USE_BITS_ON_EXTENSION
] = [
	data.eventTypes.indexOf('GIVE_BITS_TO_BROADCASTER'),
	data.eventTypes.indexOf('USE_BITS_ON_EXTENSION')
];

const RESET = '\u001b[0m';
const WHITE = '\u001b[37;1m';
// const RED = '\u001b[31;1m';
const GREEN = '\u001b[32;1m';
const CYAN = '\u001b[36;1m';
const MAGENTA = '\u001b[35;1m';

const totalBits = data.events.reduce((p, n) => p + n.amount, 0);
let skippedEvents = 0;
let skippedBits = 0;
const totalPerChannel = data.events.reduce((p, n) => {
	if(n.channel === -1) {
		skippedEvents++;
		skippedBits += n.amount;
		return p;
	}
	const channelTotal = p[n.channel];
	p[n.channel] = channelTotal ? channelTotal + n.amount : n.amount;
	return p;
}, []);
const maxUsed = Math.max(...totalPerChannel);
const maxUsedChannels = totalPerChannel
	.reduce((p, n, i) => {
		if(n === maxUsed) {
			p.push(data.channels[i].login);
		}
		return p;
	}, []);
const badChannelSkipNote = !skippedEvents ? '' :
	format`\n\t(Skipped ${skippedEvents} events totaling ${skippedBits} Bits)`;

const extEvents = data.events.filter(n => n.type === USE_BITS_ON_EXTENSION);
const extBits = extEvents.reduce((p, n) => p + n.amount, 0);
const extChannels = new Set(extEvents.map(n => n.channel)).size;

const first = data.events[data.events.length - 1];
const last = data.events[0];

console.log(colorize(format`
Total
	- Events: ${data.totalCount}
	- Bits: ${totalBits}
	- Channels: ${data.channels.length}
Most used in a channel
	- Total: ${maxUsed}
	- Channels: ${maxUsedChannels}${badChannelSkipNote}
Extensions
	- Events: ${extEvents.length}
	- Bits: ${extBits}
	- Channels: ${extChannels}
First: ${new Date(first.usedAt)}
 Last: ${new Date(last.usedAt)}
`));

function format(strings, ...args) {
	return strings.reduce((p, n, i) => {
		let arg = args[i] || '';
		if(typeof arg === 'number') {
			arg = `${GREEN}${arg.toLocaleString()}${RESET}`;
		}
		else if(arg instanceof Date) {
			arg = `${CYAN}${arg.toLocaleString()}${RESET}`;
		}
		else if(Array.isArray(arg)) {
			arg = arg.join(', ');
		}
		return p + n + arg;
	}, '');
}

/** @param {string} text */
function colorize(text) {
	const colon = ': ';
	return text.split('\n').map(n => {
		const firstColon = n.indexOf(colon);
		if(firstColon > -1) {
			const a = n.slice(0, firstColon);
			const b = n.slice(firstColon + colon.length);
			n = `${a}: ${MAGENTA}${b}${RESET}`;
		}
		else if(!n.startsWith('\t')) {
			n = `${WHITE}${n}${RESET}`;
		}
		return n;
	}).join('\n');
}