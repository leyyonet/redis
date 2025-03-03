import {CacheClientAbstract, cacheHub} from "@leyyo/cache";
import {RedisClientType} from "redis";
import {redisProvider} from "../provider";
import {RedisClient} from "./types";

export class RedisClientImpl extends CacheClientAbstract implements RedisClient {
    /** @inheritDoc */
    readonly native: RedisClientType;

    constructor(native: RedisClientType, description?: string) {
        super(native, redisProvider, description);

    }

    /** @inheritDoc */
    async getId(): Promise<number> {
        this._lastId = await this.native.CLIENT_ID();
        return this._lastId;
    }

    /** @inheritDoc */
    async getInfo(): Promise<unknown> {
        this._lastInfo = await this.native.CLIENT_INFO();
        return this._lastInfo;
    }

    /** @inheritDoc */
    async getName(): Promise<string> {
        this._lastName = await this.native.CLIENT_GETNAME();
        return this._lastName;
    }

    /** @inheritDoc */
    async setName(name: string): Promise<boolean> {
        name = name ?? this.description;
        await this.native.CLIENT_SETNAME(name);
        this._lastName = name;
        return true;
    }

}

cacheHub.$secure.$setClientCreator(redisProvider, (native, description) => new RedisClientImpl(native as RedisClientType, description));