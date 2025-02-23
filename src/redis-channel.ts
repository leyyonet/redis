import {RedisClientType} from "redis";
import {
    CacheBasic,
    CacheBuilder,
    CacheChannel,
    CacheChannelAbstract,
    CacheClient,
    CacheHash,
    cacheHub,
    CacheID,
    CachePropChannel,
    CacheSet,
    PropInvalidator,
    TR
} from "@leyyo/cache";
import {RedisBasic} from "./redis-basic";
import {RedisHash} from "./redis-hash";
import {RedisSet} from "./redis-set";
import {RedisInvalidator} from "./redis-invalidator";
import {BuilderAny} from "@leyyo/builder";

type C = RedisClientType;
// noinspection JSUnusedGlobalSymbols
export class RedisChannel<A extends TR, N extends CacheID> extends CacheChannelAbstract<A, N, C> implements CacheChannel<A, N, C> {

    static build<A extends TR, N extends CacheID = CacheID>(native: RedisClientType, props: BuilderAny<CachePropChannel<A>> | CachePropChannel<A>): CacheChannel<A, N, C> {
        return CacheBuilder.build<A, N, C>(cacheHub.getClient(native, 'redis'), props);
    }

    // region get-set
    get basic(): CacheBasic<A, N, C> {
        if (!this._basic) {
            this._basic = new RedisBasic(this);
        }
        return this._basic;
    }

    get hash(): CacheHash<A, N, C> {
        if (!this._hash) {
            this._hash = new RedisHash(this);
        }
        return this._hash;
    }

    get set(): CacheSet<A, N, C> {
        if (!this._set) {
            this._set = new RedisSet(this);
        }
        return this._set;
    }
    get invalidator(): PropInvalidator<A, N, C> {
        if (!this._invalidator) {
            this._invalidator = new RedisInvalidator(this);
        }
        return this._invalidator;
    }

    // endregion get-set
}
cacheHub.setChannelCreator('redis', (client, prop) => new RedisChannel(client as CacheClient<RedisClientType>, prop));