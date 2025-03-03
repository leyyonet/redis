import {CacheHash, Id, TR} from "@leyyo/cache";

export type RedisHash<A extends TR, N extends Id> = CacheHash<A, N>;
