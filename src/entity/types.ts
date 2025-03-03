import {CacheEntity, TR} from "@leyyo/cache";
import {RedisSegment} from "../segment";
import {RedisClient} from "../client";
import {RedisChannel} from "../channel";

export interface RedisEntity<A extends TR> extends CacheEntity<A> {
    readonly segment: RedisSegment;
    readonly client: RedisClient;

    get channels(): Array<RedisChannel<A, string>>;
}
