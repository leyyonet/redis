import {RedisClientType} from "redis";
import {CacheSetAbstract, CacheSetSecure, Id, TR} from "@leyyo/cache";
import {RedisChannelImpl} from "../channel";
import {RedisSet} from "./types";

// noinspection DuplicatedCode
export class RedisSetImpl<A extends TR, N extends Id> extends CacheSetAbstract<A, N> implements RedisSet<A, N>, CacheSetSecure<A, N> {

    private readonly native: RedisClientType;

    constructor(channel: RedisChannelImpl<A, N>) {
        super(channel);
        this.native = channel.client.native as RedisClientType;
    }

    $add(key: string, members: Array<string>): Promise<number> {
        return this.native.SADD(key, members);
    }

    $exist(key: string, member: string): Promise<boolean> {
        return this.native.SISMEMBER(key, member);
    }

    $length(key: string): Promise<number> {
        return this.native.SCARD(key);
    }

    $list(key: string): Promise<Array<string>> {
        return this.native.SMEMBERS(key);
    }

    $remove(key: string, members: Array<string>): Promise<number> {
        return this.native.SREM(key, members);
    }

}
