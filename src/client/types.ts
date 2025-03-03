import {CacheClient} from "@leyyo/cache";
import {RedisClientType} from "redis";

export interface RedisClient extends CacheClient {
    readonly native: RedisClientType;
}
