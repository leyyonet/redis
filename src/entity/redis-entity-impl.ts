import {CacheEntityAbstract, CacheEntityPropData, cacheHub, TR} from "@leyyo/cache";
import {redisProvider} from "../provider";
import {RedisEntity} from "./types";
import {RedisSegment} from "../segment";
import {RedisClient} from "../client";
import {RedisChannel} from "../channel";

export class RedisEntityImpl<A extends TR> extends CacheEntityAbstract<A> implements RedisEntity<A> {
    /** @inheritDoc */
    readonly segment: RedisSegment;

    /** @inheritDoc */
    readonly client: RedisClient;

    constructor(segment: RedisSegment, path: string, prop: CacheEntityPropData<A>, id: string, client: RedisClient) {
        super(segment, path, prop, id, client);
    }

    /** @inheritDoc */
    get channels(): Array<RedisChannel<A, string>> {
        return super.channels as Array<RedisChannel<A, string>>;
    }
}

cacheHub.$secure.$setEntityCreator(redisProvider, (segment, path, prop, id, differentClient) => new RedisEntityImpl(segment as RedisSegment, path, prop, id, differentClient as RedisClient));