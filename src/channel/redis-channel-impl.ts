import {RedisBasic, RedisBasicImpl} from "../basic";
import {RedisHash, RedisHashImpl} from "../hash";
import {RedisSet, RedisSetImpl} from "../set";
import {RedisFormat, RedisFormatImpl} from "../format";
import {redisProvider} from "../provider";
import {CacheChannelAbstract, CacheChannelPropData, cacheHub, Id, TR} from "@leyyo/cache";
import {RedisChannel} from "./types";
import {RedisEntity} from "../entity";
import {RedisClient} from "../client";
import {RedisAlias, RedisAliasImpl} from "../alias";

// noinspection JSUnusedGlobalSymbols
export class RedisChannelImpl<A extends TR, N extends Id> extends CacheChannelAbstract<A, N> implements RedisChannel<A, N> {
    readonly format: RedisFormat<A, N>;
    readonly hash: RedisHash<A, N>;
    readonly basic: RedisBasic<A, N>;
    readonly set: RedisSet<A, N>;
    readonly alias: RedisAlias<A, N>;

    constructor(entity: RedisEntity<A>, path: string, prop: CacheChannelPropData<A>, id: string, client: RedisClient) {
        super(entity, path, prop, id, client);
        this.format = new RedisFormatImpl(this);
        this.basic = new RedisBasicImpl(this);
        this.hash = new RedisHashImpl(this);
        this.set = new RedisSetImpl(this);
        this.alias = new RedisAliasImpl(this);
    }
}

cacheHub.$secure.$setChannelCreator(redisProvider, (entity, path, prop, id, differentClient) => new RedisChannelImpl(entity as RedisEntity<TR>, path, prop, id, differentClient as RedisClient));