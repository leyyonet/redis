import {createClient, RedisClientType} from "redis";
import {cacheHub} from "@leyyo/cache";
import {redisProvider} from "../provider";

process.on('SIGINT', () => console.log('Receiving SIGINT signal'));
process.on('SIGTERM', () => console.log('Receiving SIGTERM signal'));
process.on('SIGNAAL', () => console.log('Receiving SIGNAAL signal'));
process.on('SIGHUP', () => console.log('Receiving SIGHUP signal'));
export const kill = (source: string): void => {
    setTimeout(() => {
        console.log('Exiting.');
        console.log(`Exiting by ${source}`);
        process.exit(0);
    }, 100);

    // kill the process with pid and signal = 'SIGINT'
    process.kill(process.pid, 'SIGINT');
}

const e = process.env;
export const cacheClient: RedisClientType = createClient({url: `redis://${e.REDIS_HOST}:${e.REDIS_PORT}`});
cacheClient.on('error', (err) => console.error(err.message, err));

// Connect to Redis
cacheClient.connect()
    .then(c => {
        console.info(c);
    })
    .catch(e => {
        console.error(e.message, e);
        kill('redis');
    });

// noinspection JSUnusedLocalSymbols
type Skills = 'java' | 'php' | 'node' | 'asp';

interface Person {
    name: string;
    married: boolean;
    age: number;
    recordDate: Date;
}

const person: Person = {name: 'Mustafa', married: false, age: 45, recordDate: new Date()};

const redisClient = cacheHub.registerClient(redisProvider, cacheClient);
const segment = cacheHub.newSegment(redisClient, 'ms1', c => c.expiryMode('absent'));
const entity = segment.newEntity('Person', c => c.expirySpan('ttl'));
const entityId = entity.newChannel<Person>('id', c => c.milliseconds(100));

entityId.basic.getDoc('a').then(a => console.log(a));
entityId.basic.setDoc('name', person, {span: 'ttl', expiry: [1000, "milliseconds"]}).then(a => {
    a.add('a');
    console.log(a);
})
entityId.hash.getValue('a', 'age').then();
entityId.hash.setValue('a', 'age', 40).then();
entityId.set.add('a', ['asp', 'php']).then()
entityId.set.remove('a', ['asp']).then()