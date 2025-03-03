import {CacheAlias, Id, TR} from "@leyyo/cache";

export type RedisAlias<A extends TR, N extends Id> = CacheAlias<A, N>;
