import {RedisClientType} from "redis";
import {redisSpec} from "./redis-spec";
import {RedisSetOptions, RedisType} from "./types";
import {
    CacheBaseKeys,
    CacheBasicAbstract,
    CacheCmdCopy,
    CacheCmdExpire,
    CacheCmdExpireAt,
    CacheCmdSet,
    CacheCmdTtl,
    CacheID,
    CacheInvalidator,
    CacheKey,
    dummyInvalidator,
    invalidator,
    TR
} from "@leyyo/cache";

type C = RedisClientType;
export class RedisBasic<A extends TR, N extends CacheID> extends CacheBasicAbstract<A, N, C> {

    // region get
    /** @inheritDoc */
    async get(key: CacheKey<A>): Promise<A> {
        // 2.0.0
        if (!this.prop.enabled) {
            return null;
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return null;
        }
        return this.util.parseOne(await this.client.native.GET(full));
    }

    /** @inheritDoc */
    async getMore(keys: Array<CacheKey<A>>): Promise<Record<CacheID, A>> {
        // 2.0.0
        if (!this.prop.enabled) {
            return {};
        }
        const {fulls, shorts} = this._checkKeys(keys);
        if (fulls.length < 1) {
            return {};
        }
        const list = this.util.parseArray(this.util.asArray(await this.client.native.MGET(fulls))) as Array<A>;
        return this.util.objectFromKeys(shorts, null, list);
    }
    // endregion get

    // region set
    /** @inheritDoc */
    async set(v1: CacheKey<A>|A, v2:A|CacheCmdSet, v3?: Omit<CacheCmdSet, 'key'>): Promise<CacheInvalidator<A, N, C, A|boolean>> {
        let key: CacheKey<A>;
        let value: A;
        let opt: CacheCmdSet;
        let fullKey: string;

        // with key
        if (v3 !== undefined) {
            key = v1 as  CacheKey<A>;
            value = v2 as A;
            opt = v3 as CacheCmdSet;
        }
        // without key
        else {
            value = v1 as A;
            opt = v2 as CacheCmdSet;
        }

        if (!this.prop.enabled || !value) {
            return dummyInvalidator<A, N, C>().getFalse(this.channel);
        }
        if (!opt) {
            opt = {};
        }
        if (key) {
            // key in parameters
            fullKey = this._checkKey(key).full;
        }
        if (!fullKey) {
            if (opt.key) {
                // key in options
                fullKey = this._checkKey(opt.key).full;
            }
            if (!fullKey) {
                // retrieve key from data
                fullKey = this._checkKey(value[this.prop.property] as string).full;
            }
        }
        if (!fullKey) {
            return dummyInvalidator<A, N, C>().getFalse(this.channel);
        }
        const o2 = {} as RedisSetOptions;
        if (opt.afterSec !== undefined) {
            o2.EX = (opt.afterSec > 0) ? opt.afterSec : this.prop.expiryAs('seconds');
        }
        else if (opt.afterMS !== undefined) {
            o2.PX = (opt.afterMS > 0) ? opt.afterMS : this.prop.expiryAs('milliseconds');
        }
        else if (opt.afterMin !== undefined) {
            o2.EX = ((opt.afterMin > 0) ? opt.afterMin : this.prop.expiryAs('minutes')) * 60;
        }
        else if (opt.expiresAtSec !== undefined) {
            o2.EXAT = ((opt.expiresAtSec > 0) ? opt.expiresAtSec : this.prop.expiryAs('seconds')) + Math.floor(new Date().getTime()/1_000);
        }
        else if (opt.expiresAtMS !== undefined) {
            o2.PXAT = ((opt.expiresAtMS > 0) ? opt.expiresAtMS : this.prop.expiryAs('milliseconds')) + new Date().getTime();
        }
        else if (opt.expiresAtMin !== undefined) {
            o2.EXAT = (((opt.expiresAtMin > 0) ? opt.expiresAtMin : this.prop.expiryAs('minutes')) * 60) + Math.floor(new Date().getTime()/1_000);
        }
        else if (opt.keepTtl === true) {
            o2.KEEPTTL = true;
        }
        if (opt.whenAbsent !== undefined) {
            o2.NX = true;
        }
        else if (opt.whenExists !== undefined) {
            o2.XX = true;
        }
        if (opt.returnPrevious !== undefined) {
            o2.GET = true;
        }
        const result = await this.client.native.SET(fullKey, this.util.jsonOne(value), o2);
        if (opt.returnPrevious !== undefined) {
            return invalidator<A, N, C, A|boolean>(this.channel, [fullKey], this.util.parseOne(result));
        }
        return invalidator<A, N, C, A|boolean>(this.channel, [fullKey], true);
    }
    /** @inheritDoc */
    async setMore(value: Array<A> | Record<CacheID, A>): Promise<CacheInvalidator<A, N, C, boolean>> {
        // 2.0.0
        if (!this.prop.enabled) {
            return dummyInvalidator<A, N, C>().getFalse(this.channel);
        }
        const formatted = {} as Record<string, string>;
        const keys = {fulls: [], shorts: []} as CacheBaseKeys;

        if (Array.isArray(value)) {
            value.forEach(item => {
                const oneKey = this._checkKey(item[this.prop.property] as string);
                if (oneKey.full) {
                    formatted[oneKey.full] = this.util.jsonOne(item);
                    keys.fulls.push(oneKey.full);
                    keys.shorts.push(oneKey.short);
                }
            });
        }
        else {
            value = this.util.asObject(value);
            for (const [key, item] of Object.entries(value)) {
                const oneKey = this._checkKey(key);
                if (oneKey.full) {
                    formatted[oneKey.full] = this.util.jsonOne(item);
                    keys.fulls.push(oneKey.full);
                    keys.shorts.push(oneKey.short);
                }
            }
        }
        if (keys.fulls.length < 1) {
            return dummyInvalidator<A, N, C>().getFalse(this.channel);
        }
        const result = await this.client.native.MSET(formatted);
        return invalidator<A, N, C, boolean>(this.channel, keys.fulls, result === 'OK');
    }
    // endregion set

    // region exists
    /** @inheritDoc */
    async existsMore(keys: Array<CacheKey<A>>): Promise<number> {
        if (!this.prop.enabled) {
            return 0;
        }
        const {fulls} = this._checkKeys(keys);
        if (fulls.length < 1) {
            return 0;
        }
        return this.client.native.EXISTS(fulls);
    }
    /** @inheritDoc */
    async exists(key: CacheKey<A>): Promise<boolean> {
        return (await this.existsMore([key])) > 0;
    }
    // endregion exists

    // region delete
    /** @inheritDoc */
    async deleteMore(keys: Array<CacheKey<A>>): Promise<CacheInvalidator<A, N, C, number>> {
        if (!this.prop.enabled) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        const {fulls} = this._checkKeys(keys);
        if (fulls.length < 1) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        const result = await this.client.native.DEL(fulls);
        return invalidator<A, N, C, number>(this.channel, fulls, result);
    }
    /** @inheritDoc */
    async delete(key: CacheKey<A>): Promise<CacheInvalidator<A, N, C, number>> {
        return this.deleteMore([key]);
    }
    /** @inheritDoc */
    async unlinkMore(keys: Array<CacheKey<A>>): Promise<CacheInvalidator<A, N, C, number>> {
        if (!this.prop.enabled) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        const {fulls} = this._checkKeys(keys);
        if (fulls.length < 1) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        const result = await this.client.native.UNLINK(fulls);
        return invalidator<A, N, C, number>(this.channel, fulls, result);
    }
    /** @inheritDoc */
    async unlink(key: CacheKey<A>): Promise<CacheInvalidator<A, N, C, number>> {
        return this.unlinkMore([key]);
    }
    // endregion delete

    // region expire
    /** @inheritDoc */
    async expire(key: CacheKey<A>, opt?: CacheCmdExpire): Promise<boolean> {
        if (!this.prop.enabled) {
            return false;
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return false;
        }
        if (!opt) {
            opt = {};
        }
        const {value, unit} = this.util.getExpireRec(opt, this.prop.expiryUnit, (u) => this.prop.expiryAs(u));
        if (value < 1) {
            return false;
        }
        const mode = redisSpec.getExpiryMode(opt, this.prop.expiryMode);

        if (unit === 'seconds') {
            return this.client.native.EXPIRE(full, value, mode);
        }
        else if (unit === 'milliseconds') {
            return this.client.native.PEXPIRE(full, value, mode);
        }
        // timeUnit === 'minutes'
        return this.client.native.EXPIRE(full, value * 60, mode);
    }
    /** @inheritDoc */
    async expireAt(key: CacheKey<A>, opt?: CacheCmdExpireAt): Promise<boolean> {
        if (!this.prop.enabled) {
            return false;
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return false;
        }
        if (!opt) {
            opt = {};
        }
        const {value, unit} = this.util.getExpireAtRec(opt, this.prop.expiryUnit, (u) => this.prop.expiryAs(u));
        if (value < 1) {
            return false;
        }
        const mode = redisSpec.getExpiryMode(opt, this.prop.expiryMode);

        if (unit === 'seconds') {
            return this.client.native.EXPIREAT(full, value, mode);
        }
        else if (unit === 'milliseconds') {
            return this.client.native.PEXPIREAT(full, value, mode);
        }
        // timeUnit === 'minutes'
        return this.client.native.EXPIREAT(full, value * 60, mode);
    }
    /** @inheritDoc */
    async expireTime(key: CacheKey<A>, opt?: CacheCmdTtl): Promise<number> {
        if (!this.prop.enabled) {
            return 0;
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return 0;
        }
        if (!opt) {
            opt = {};
        }
        const unit = this.util.getExpireUnit(opt, this.prop.expiryUnit);

        const result = await ((unit !== 'milliseconds') ? this.client.native.PEXPIRETIME(full) : this.client.native.EXPIRETIME(full));
        if (unit !== 'minutes') {
            return result;
        }
        return Math.floor(result / 1_000);
    }
    /** @inheritDoc */
    async ttl(key: CacheKey<A>, opt?: CacheCmdTtl): Promise<number> {
        if (!this.prop.enabled) {
            return 0;
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return 0;
        }
        if (!opt) {
            opt = {};
        }
        const unit = this.util.getExpireUnit(opt, this.prop.expiryUnit);

        const result = await ((unit !== 'milliseconds') ? this.client.native.PTTL(full) : this.client.native.TTL(full));
        if (unit !== 'minutes') {
            return result;
        }
        return Math.floor(result / 1_000);
    }
    /** @inheritDoc */
    async persist(key: CacheKey<A>): Promise<boolean> {
        if (!this.prop.enabled) {
            return false;
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return false;
        }
        return this.client.native.PERSIST(full);
    }
    // endregion expire

    // region other
    /** @inheritDoc */
    async copy(source: CacheKey<A>, destination: CacheKey<A>, opt?: CacheCmdCopy): Promise<boolean> {
        if (!this.prop.enabled) {
            return false;
        }
        const sourceKey = this._checkKey(source);
        const destinationKey = this._checkKey(destination);
        if (!sourceKey.full || !destinationKey.full) {
            return false;
        }
        return this.client.native.COPY(sourceKey.full, destinationKey.full, opt);
    }

    /** @inheritDoc */
    async type(key: CacheKey<A>): Promise<RedisType> {
        if (!this.prop.enabled) {
            return null;
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return null;
        }
        const result = await this.client.native.TYPE(full);
        if (result !== 'none') {
            return null;
        }
        return result as RedisType;
    }
    // endregion other

}
