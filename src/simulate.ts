import {createClient, RedisClientType} from "redis";
import {CacheBuilder, TR} from "@leyyo/cache";
import {RedisChannel} from "./redis-channel";

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
export const cacheClient: RedisClientType = createClient({ url: `redis://${e.REDIS_HOST}:${e.REDIS_PORT}` });
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

type Skills = 'java'|'php'|'node'|'asp';
interface Person extends TR {
    name: string;
    married: boolean;
    age: number;
    recordDate: Date;
}
const person: Person = {name: 'Mustafa', married: false, age: 45, recordDate: new Date()};

const channel = RedisChannel.build<Person, Skills>(cacheClient, CacheBuilder.prop()
    .enabled(true)
    .expiryUnit('seconds').prefix('aa').property('id').expirySet('after').expiryMode('whenAbsent'));

channel.basic.get('a').then(a => console.log(a));
channel.basic.set('name', person, {afterMin:1, afterMS:2}).then(a => {a.add('a'); console.log(a);})
channel.hash.getOne('a', 'age');
channel.hash.setOne('a', 'age', 40);
channel.set.add('a', ['asp','php'])
channel.set.remove('a', ['asp'])