import {cacheHub, CacheSegmentAbstract, CacheSegmentPropData, TR} from "@leyyo/cache";
import {redisProvider} from "../provider";
import {RedisSegment} from "./types";
import {RedisClient} from "../client";
import {RedisEntity} from "../entity";

export class RedisSegmentImpl extends CacheSegmentAbstract implements RedisSegment {
    readonly client: RedisClient;

    constructor(client: RedisClient, path: string, prop: CacheSegmentPropData, id: string) {
        super(client, path, prop, id);
    }

    get entities(): Array<RedisEntity<TR>> {
        return super.entities as Array<RedisEntity<TR>>;
    }
}

cacheHub.$secure.$setSegmentCreator(redisProvider, (differentClient, path, prop, id) => new RedisSegmentImpl(differentClient as RedisClient, path, prop, id));