import {CacheChannel, Id, TR} from "@leyyo/cache";

export type RedisChannel<A extends TR, N extends Id> = CacheChannel<A, N>;