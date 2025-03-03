import {CacheProviderAbstract} from "@leyyo/cache";
import {RedisProvider} from "./types";
import {REDIS_PROVIDER} from "../config";

class RedisProviderImpl extends CacheProviderAbstract implements RedisProvider {

    constructor() {
        super(REDIS_PROVIDER);
    }
}

export const redisProvider: RedisProvider = new RedisProviderImpl();