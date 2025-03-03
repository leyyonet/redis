import {CacheSegment, TR} from "@leyyo/cache";
import {RedisClient} from "../client";
import {RedisEntity} from "../entity";

export interface RedisSegment extends CacheSegment {
    readonly client: RedisClient;

    get entities(): Array<RedisEntity<TR>>;
}
