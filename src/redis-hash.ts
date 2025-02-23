import {
    CacheCmdExpire,
    CacheCmdExpireAt,
    CacheCmdInc,
    CacheCmdTtl,
    CacheField,
    CacheFieldIn,
    CacheFieldMap,
    CacheFieldPartial,
    CacheFieldPartialIn,
    CacheFields,
    CacheFieldsIn,
    CacheFieldTuples,
    CacheFieldValue,
    CacheFieldValues,
    CacheHash,
    CacheHashAbstract,
    CacheHashExpireResult,
    CacheID,
    CacheInvalidator,
    CacheKey,
    CacheOptIncDataType,
    CacheOptIncDirType,
    dummyInvalidator,
    invalidator,
    TR
} from "@leyyo/cache";
import {RedisClientType} from "redis";
import {redisSpec} from "./redis-spec";

type C = RedisClientType;
export class RedisHash<A extends TR, N extends CacheID> extends CacheHashAbstract<A, N, C> implements CacheHash<A, N, C> {


    // region get
    async getAll(key: CacheKey<A>): Promise<CacheFieldPartial<A>> {
        // 2.0.0
        if (!this.prop.enabled) {
            return {};
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return {};
        }
        return this.util.asObject(await this.client.native.HGETALL(full));
    }
    async getOne(key: CacheKey<A>, field: CacheFieldIn<A>): Promise<CacheFieldValue<A>> {
        // v-2.0.0
        if (!this.prop.enabled) {
            return null;
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return null;
        }
        const checkedField = this._checkField(field);
        if (!checkedField) {
            return null;
        }
        return await this.client.native.HGET(full, checkedField);
    }
    async getMore(key: CacheKey<A>, fields: CacheFieldsIn<A>): Promise<CacheFieldPartial<A>> {
        if (!this.prop.enabled) {
            return {};
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return {};
        }
        const {items} = this._checkFields(fields);
        if (items.length < 1) {
            return {};
        }
        const values = this.util.asArray(await this.client.native.HMGET(full, items));
        return this.util.objectFromKeys(items, null, values);
    }
    // endregion get

    // region set
    async setOne(key: CacheKey<A>, field: CacheFieldIn<A>, value: CacheFieldValue<A>): Promise<CacheInvalidator<A, N, C, number>> {
        if (!this.prop.enabled) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        const checkField = this._checkField(field);
        if (!checkField) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        return invalidator(this.channel, [full], await this.client.native.HSET(full, checkField, this._checkValue(value) as string));
    }
    async setMore(key: CacheKey<A>, values: CacheFieldPartialIn<A>|CacheFieldMap<A>|CacheFieldTuples<A>): Promise<CacheInvalidator<A, N, C, number>> {
        if (!this.prop.enabled) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        const valueDoc = this._checkValueDoc(this.util.asObject(values));
        if (!valueDoc) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        return invalidator(this.channel, [full], await this.client.native.HSET(full, valueDoc as Record<string, string>));
    }
    // endregion set

    // region delete
    async deleteOne(key: CacheKey<A>, field: CacheFieldIn<A>): Promise<CacheInvalidator<A, N, C, number>> {
        return this.deleteMore(key, [field]);
    }
    async deleteMore(key: CacheKey<A>, fields: CacheFieldsIn<A>): Promise<CacheInvalidator<A, N, C, number>> {
        // v-2.0.0
        if (!this.prop.enabled) {
            return dummyInvalidator<A, N, C>().getNumber(this.channel, -1);
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return dummyInvalidator<A, N, C>().getNumber(this.channel, -1);
        }
        const {items} = this._checkFields(fields);
        if (items.length < 1) {
            return dummyInvalidator<A, N, C>().getNumber(this.channel, -1);
        }
        return invalidator(this.channel, [full], await this.client.native.HDEL(full, items));
    }
    // endregion delete

    // region exists
    async hasField(key: CacheKey<A>, field: CacheFieldIn<A>): Promise<boolean> {
        // v-2.0.0
        if (!this.prop.enabled) {
            return false;
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return false;
        }
        const checkField = this._checkField(field);
        if (!checkField) {
            return false;
        }
        return this.client.native.HEXISTS(full, checkField);
    }
    async hasFields(key: CacheKey<A>, fields: CacheFieldsIn<A>): Promise<Record<string, boolean>> {
        if (!this.prop.enabled) {
            return {};
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return {};
        }
        const {items} = this._checkFields(fields);
        if (items.length < 1) {
            return {};
        }
        const result = {};
        for (const field of items) {
            result[field] = await this.hasField(key, field);
        }
        return result;
    }
    // endregion exists

    // region expire
    async expire(key: CacheKey<A>, fields: CacheFieldsIn<A>, opt?: CacheCmdExpire): Promise<Record<string, CacheHashExpireResult>> {
        if (!this.prop.enabled) {
            return {};
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return {};
        }
        const {items} = this._checkFields(fields);
        if (items.length < 1) {
            return {};
        }
        if (!opt) {
            opt = {};
        }
        const {value, unit} = this.util.getExpireRec(opt, this.prop.expiryUnit, (u) => this.prop.expiryAs(u));
        if (value < 1) {
            return {};
        }
        const mode = redisSpec.getExpiryMode(opt, this.prop.expiryMode);

        let status: Array<CacheHashExpireResult>;
        if (unit === 'seconds') {
            status = await this.client.native.HEXPIRE(full, items, value, mode);
        }
        else if (unit === 'milliseconds') {
            status = await this.client.native.HPEXPIRE(full, items, value, mode);
        }
        else {
            // timeUnit === 'minutes'
            status = await this.client.native.HEXPIRE(full, items, value * 60, mode);
        }
        return this.util.objectFromKeys(items, 0, status);
    }
    async expireAt(key: CacheKey<A>, fields: CacheFieldsIn<A>, opt?: CacheCmdExpireAt): Promise<Record<string, CacheHashExpireResult>> {
        if (!this.prop.enabled) {
            return {};
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return {};
        }
        const {items} = this._checkFields(fields);
        if (items.length < 1) {
            return {};
        }

        if (!opt) {
            opt = {};
        }
        const {value, unit} = this.util.getExpireAtRec(opt, this.prop.expiryUnit, (u) => this.prop.expiryAs(u));
        if (value < 1) {
            return {};
        }
        const mode = redisSpec.getExpiryMode(opt, this.prop.expiryMode);

        let status: Array<CacheHashExpireResult>;
        if (unit === 'seconds') {
            status = await this.client.native.HEXPIREAT(full, items, value, mode);
        }
        else if (unit === 'milliseconds') {
            status = await this.client.native.HPEXPIREAT(full, items, value, mode);
        }
        else {
            // timeUnit === 'minutes'
            status = await this.client.native.HEXPIREAT(full, items, value * 60, mode);
        }
        return this.util.objectFromKeys(items, 0, status);
    }
    async expireTime(key: CacheKey<A>, fields: CacheFieldsIn<A>, opt?: CacheCmdTtl): Promise<Record<string, number>> {
        if (!this.prop.enabled) {
            return {};
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return {};
        }
        const {items} = this._checkFields(fields);
        if (items.length < 1) {
            return {};
        }

        const unit = this.util.getExpireUnit(opt, this.prop.expiryUnit);

        let times = await ((unit !== 'milliseconds') ? this.client.native.HPEXPIRETIME(full, items) : this.client.native.HEXPIRETIME(full, items));
        if (unit == 'minutes') {
            times = times.map(t => t / 1_000);
        }
        return this.util.objectFromKeys(items, 0, times);
    }
    async ttl(key: CacheKey<A>, fields: CacheFieldsIn<A>, opt?: CacheCmdTtl): Promise<Record<string, number>> {
        if (!this.prop.enabled) {
            return {};
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return {};
        }
        const {items} = this._checkFields(fields);
        if (items.length < 1) {
            return {};
        }

        const unit = this.util.getExpireUnit(opt, this.prop.expiryUnit);

        let times = await ((unit !== 'milliseconds') ? this.client.native.HPTTL(full, items) : this.client.native.HTTL(full, items));
        if (unit === 'minutes') {
            times = times.map(t => t / 1_000);
        }
        return this.util.objectFromKeys(items, 0, times);
    }
    async persist(key: CacheKey<A>, fields: CacheFieldsIn<A>): Promise<Record<string, number>> {
        if (!this.prop.enabled) {
            return {};
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return {};
        }
        const {items} = this._checkFields(fields);
        if (items.length < 1) {
            return {};
        }

        const times = await this.client.native.HPERSIST(full, items);
        return this.util.objectFromKeys(items, 0, times);
    }
    // endregion expire

    // region increment
    async increment(key: CacheKey<A>, field: CacheFieldIn<A>, opt: CacheCmdInc): Promise<CacheInvalidator<A, N, C, number>> {
        if (!this.prop.enabled) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        const checkField = this._checkField(field);
        if (!checkField) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        if (!opt) {
            opt = {};
        }
        let num: number;
        let dir: CacheOptIncDirType;
        let data: CacheOptIncDataType;
        if (opt.increment !== undefined) {
            num = opt.increment;
            dir = 'increment';
        }
        else if (opt.decrement !== undefined) {
            num = opt.decrement;
            dir = 'decrement';
        }
        if (opt.integer !== undefined) {
            data = 'integer';
        }
        else if (opt.float !== undefined) {
            data = 'float';
        }
        else {
            data = this.prop.incrementData;
        }
        if (num === undefined) {
            num = this.prop.incrementValue;
            if (dir === undefined) {
                dir = this.prop.incrementDir;
            }
        }
        if (dir === 'decrement') {
            num *= -1;
        }
        let result: number;
        if (data === "integer") {
            if (Number.isInteger(num)) {
                num = Math.floor(num);
            }
            result = await this.client.native.HINCRBY(full, checkField, num);
        }
        else {
            result = await this.client.native.HINCRBYFLOAT(full, checkField, num);
        }

        return invalidator(this.channel, [full], result);
    }
    // endregion increment

    // region field-values
    async fields(key: CacheKey<A>): Promise<CacheFields<A>> {
        if (!this.prop.enabled) {
            return [];
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return [];
        }
        return this.util.asArray(await this.client.native.HKEYS(full));
    }
    async length(key: CacheKey<A>): Promise<number> {
        if (!this.prop.enabled) {
            return 0;
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return 0;
        }
        return await this.client.native.HLEN(full);
    }
    async values(key: CacheKey<A>, fields: CacheFieldsIn<A>): Promise<CacheFieldValues<A>> {
        if (!this.prop.enabled) {
            return [];
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return [];
        }
        const {items} = this._checkFields(fields);
        if (items.length < 1) {
            return [];
        }
        return this.util.asArray(await this.client.native.HMGET(full, items));
    }
    async allValues(key: CacheKey<A>): Promise<CacheFieldValues<A>> {
        if (!this.prop.enabled) {
            return [];
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return [];
        }
        return this.util.asArray(await this.client.native.HVALS(full));
    }
    // endregion field-values

    // region random
    async randomOne(key: CacheKey<A>): Promise<CacheField<A>> {
        if (!this.prop.enabled) {
            return null;
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return null;
        }
        return await this.client.native.HRANDFIELD(full);
    }
    async randomMore(key: CacheKey<A>, count: number): Promise<CacheFields<A>> {
        if (!this.prop.enabled) {
            return [];
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return [];
        }
        return this.util.asArray(await this.client.native.HRANDFIELD_COUNT(full, count));
    }
    async randomValues(key: CacheKey<A>, count: number): Promise<CacheFieldPartial<A>> {
        if (!this.prop.enabled) {
            return {};
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return {};
        }
        return this.util.asObject(await this.client.native.HRANDFIELD_COUNT_WITHVALUES(full, count));
    }
    // endregion random

}