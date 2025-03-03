import {CacheHashAbstract, CacheHashDef, CacheHashSecure, CacheResultPersist, cacheUtil, Id, TR} from "@leyyo/cache";
import {RedisClientType} from "redis";
import {RedisChannelImpl} from "../channel";
import {RedisHash} from "./types";
import {redisSpec} from "../config";
import {CacheResultGetExpiry, CacheResultSetExpiry} from "@leyyo/cache/dist/command";

export class RedisHashImpl<A extends TR, N extends Id> extends CacheHashAbstract<A, N> implements RedisHash<A, N>, CacheHashSecure<A, N> {

    private readonly native: RedisClientType;

    constructor(channel: RedisChannelImpl<A, N>) {
        super(channel);
        this.native = channel.client.native as RedisClientType;
    }

    get $flat(): CacheHashDef {
        return this as CacheHashDef;
    }

    async $delete(key: string, fields: Array<string>): Promise<number> {
        return this.native.HDEL(key, fields);
    }

    async $exists(key: string, field: string): Promise<boolean> {
        return this.native.HEXISTS(key, field);
    }

    async $existsMore(key: string, fields: Array<string>): Promise<Record<string, boolean>> {
        const values = await Promise.all(fields.map(f => this.native.HEXISTS(key, f)));
        return cacheUtil.objectFromKeys(fields, false, values);
    }

    $fields(key: string): Promise<Array<string>> {
        return this.native.HKEYS(key);
    }

    $get(key: string, fields: Array<string>): Promise<Array<string>> {
        return this.native.HMGET(key, fields);
    }

    $getAll(key: string): Promise<Record<string, string>> {
        return this.native.HGETALL(key);
    }

    $getOne(key: string, field: string): Promise<string> {
        return this.native.HGET(key, field);
    }

    $getTimestamp(key: string, fields: Array<string>): Promise<Array<CacheResultGetExpiry>> {
        return this.native.HPEXPIRETIME(key, fields);
    }

    $getTtl(key: string, fields: Array<string>): Promise<Array<CacheResultGetExpiry>> {
        return this.native.HPTTL(key, fields);
    }

    async $length(key: string): Promise<number> {
        return this.native.HLEN(key);
    }

    async $persist(key: string, fields: Array<string>): Promise<Array<CacheResultPersist>> {
        return (await this.native.HPERSIST(key, fields)) as Array<CacheResultPersist>;
    }

    async $set(key: string, record: Record<string, string>): Promise<number> {
        return this.native.HSET(key, record);
    }

    async $setTimestamp(key: string, fields: Array<string>, milliseconds: number, mode?): Promise<Array<CacheResultSetExpiry>> {
        return this.native.HPEXPIREAT(key, fields, milliseconds, redisSpec.expiryMode(mode));
    }

    async $setTtl(key: string, fields: Array<string>, milliseconds: number, mode?): Promise<Array<CacheResultSetExpiry>> {
        return this.native.HPEXPIRE(key, fields, milliseconds, redisSpec.expiryMode(mode));
    }

}
