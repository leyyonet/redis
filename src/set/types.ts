import {CacheSet, Id, TR} from "@leyyo/cache";

export type RedisSet<A extends TR, N extends Id> = CacheSet<A, N>;
