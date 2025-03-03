import {
    CacheBasic,
    CacheBasicAbstract,
    CacheBasicDef,
    CacheBasicSecure,
    CacheOptCopy,
    CacheResultGetExpiry,
    CacheResultPersist,
    CacheResultSetExpiry,
    CmdBasicSetBase,
    ExpiryMode,
    Id,
    TR
} from "@leyyo/cache";
import {RedisChannelImpl} from "../channel";
import {RedisClientType, SetOptions} from "redis";
import {redisSpec} from "../config";
import {RedisBasic, RedisCmdRedisSet} from "./types";

// noinspection DuplicatedCode
export class RedisBasicImpl<A extends TR, N extends Id> extends CacheBasicAbstract<A, N> implements RedisBasic<A, N>, CacheBasicSecure<A, N> {

    private readonly native: RedisClientType;

    constructor(channel: RedisChannelImpl<A, N>) {
        super(channel);
        this.native = channel.client.native as RedisClientType;
    }


    // region secure
    /** @inheritDoc */
    get $back(): CacheBasic<A, N> {
        return this as RedisBasic<A, N>;
    }

    /** @inheritDoc */
    get $secure(): CacheBasicSecure<A, N> {
        return this as CacheBasicSecure<A, N>;
    }

    /** @inheritDoc */
    get $flat(): CacheBasicDef {
        return this as CacheBasicDef;
    }

    async $copy(source: string, destination: string, opt?: CacheOptCopy): Promise<boolean> {
        return this.native.COPY(source, destination, opt);
    }

    async $delete(key: string): Promise<boolean> {
        return (await this.native.DEL(key)) > 0;
    }

    async $deleteMore(keys: Array<string>): Promise<number> {
        return this.native.DEL(keys);
    }

    async $existMore(keys: Array<string>): Promise<number> {
        return this.native.EXISTS(keys);
    }

    async $exists(key: string): Promise<boolean> {
        return (await this.native.EXISTS(key)) > 0;
    }

    async $get(key: string): Promise<string> {
        return this.native.GET(key);
    }

    async $getMore(keys: Array<string>): Promise<Array<string>> {
        return this.native.MGET(keys);
    }

    async $getTimestamp(key: string): Promise<CacheResultGetExpiry> {
        return this.native.PEXPIRETIME(key);
    }

    async $getTimestampMore(keys: Array<string>): Promise<Array<CacheResultGetExpiry>> {
        return Promise.all(keys.map(key => this.native.PEXPIRETIME(key)));
    }

    async $getTtl(key: string): Promise<CacheResultGetExpiry> {
        return this.native.PTTL(key);
    }

    async $getTtlMore(keys: Array<string>): Promise<Array<CacheResultGetExpiry>> {
        return Promise.all(keys.map(key => this.native.PTTL(key)));
    }

    async $persist(key: string): Promise<CacheResultPersist> {
        return (await this.native.PERSIST(key)) ? 1 : -2;
    }

    async $persistMore(keys: Array<string>): Promise<Array<CacheResultPersist>> {
        return (await Promise.all(keys.map(key => this.native.PERSIST(key)))).map(r => r ? 1 : -2);
    }

    async $set(key: string, value: string, opt?: CmdBasicSetBase): Promise<string> {
        if (!opt) {
            opt = {};
        }
        const rOpt = {} as RedisCmdRedisSet;
        const milliseconds = this.prop.$secure.$timestamp(opt.expiry);
        redisSpec.fillSaveMode(rOpt, opt);
        redisSpec.fillReturnType(rOpt, opt);
        redisSpec.fillExpiryTime(rOpt, opt, milliseconds);
        return this.native.SET(key, value, opt as SetOptions);
    }

    async $setMore(records: Record<string, string>): Promise<string> {
        return this.native.MSET(records);
    }

    async $setTimestamp(key: string, milliseconds: number, mode?: ExpiryMode): Promise<CacheResultSetExpiry> {
        return (await this.native.PEXPIREAT(key, milliseconds, redisSpec.expiryMode(mode))) ? 1 : -2;
    }

    async $setTimestampMore(key: Array<string>, milliseconds: number, mode?: ExpiryMode): Promise<Array<CacheResultSetExpiry>> {
        return (await Promise.all(key.map(key => this.native.PEXPIREAT(key, milliseconds, redisSpec.expiryMode(mode))))).map(k => k ? 1 : -2);
    }

    async $setTtl(key: string, milliseconds: number, mode?: ExpiryMode): Promise<CacheResultSetExpiry> {
        return (await this.native.PEXPIRE(key, milliseconds, redisSpec.expiryMode(mode))) ? 1 : -2;
    }

    async $setTtlMore(key: Array<string>, milliseconds: number, mode?: ExpiryMode): Promise<Array<CacheResultSetExpiry>> {
        return (await Promise.all(key.map(key => this.native.PEXPIRE(key, milliseconds, redisSpec.expiryMode(mode))))).map(k => k ? 1 : -2);
    }

    async $type(key: string): Promise<string> {
        return this.native.TYPE(key);
    }

    async $typeMore(keys: Array<string>): Promise<Array<string>> {
        return Promise.all(keys.map(k => this.native.TYPE(k)));
    }

    async $unlink(key: string): Promise<boolean> {
        return (await this.native.UNLINK(key)) > 0;
    }

    async $unlinkMore(keys: Array<string>): Promise<number> {
        return this.native.UNLINK(keys);
    }

    // endregion secure

}
