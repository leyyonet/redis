import {CacheFormat, Id, TR} from "@leyyo/cache";

export type RedisFormat<A extends TR, N extends Id> = CacheFormat<A, N>;