import {CacheAliasAbstract, CacheAliasSecure, Id, TR} from "@leyyo/cache";
import {RedisAlias} from "./types";
import {RedisChannel} from "../channel";

export class RedisAliasImpl<A extends TR, N extends Id> extends CacheAliasAbstract<A, N> implements RedisAlias<A, N>, CacheAliasSecure<A, N> {
    constructor(channel: RedisChannel<A, N>) {
        super(channel);
    }
}
