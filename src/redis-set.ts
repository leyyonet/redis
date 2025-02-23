import {RedisClientType} from "redis";
import {
    CacheID,
    CacheInvalidator,
    CacheKey,
    CacheSet,
    CacheSetAbstract,
    dummyInvalidator,
    invalidator,
    TR
} from "@leyyo/cache";

type C = RedisClientType;
export class RedisSet<A extends TR, N extends CacheID = string> extends CacheSetAbstract<A, N, C> implements CacheSet<A, N, C> {

    // region add
    async add(key: CacheKey<A>, members: Array<N>): Promise<CacheInvalidator<A, N, C, number>> {
        if (!this.prop.enabled) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }

        const {full} = this._checkKey(key);
        if (!full) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        const {items} = this._checkMembers(members);
        if (items.length < 1) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        return invalidator(this.channel, [full], await this.client.native.SADD(full, items));
    }
    // endregion add

    // region remove
    async remove(key: CacheKey<A>, members: Array<N>): Promise<CacheInvalidator<A, N, C, number>> {
        if (!this.prop.enabled) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        const {items} = this._checkMembers(members);
        if (items.length < 1) {
            return dummyInvalidator<A, N, C>().getZero(this.channel);
        }
        return invalidator(this.channel, [full], await this.client.native.SREM(full, items));
    }
    // endregion remove

    // region members
    async members(key: CacheKey<A>): Promise<Array<string>> {
        if (!this.prop.enabled) {
            return [];
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return [];
        }
        return this.util.asArray(await this.client.native.SMEMBERS(full));
    }
    async length(key: CacheKey<A>): Promise<number> {
        if (!this.prop.enabled) {
            return 0;
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return 0;
        }
        return this.client.native.SCARD(full);
    }
    // endregion members

    // region exists
    async isMember(key: CacheKey<A>, member: N): Promise<boolean> {
        // v-2.0.0
        if (!this.prop.enabled) {
            return false;
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return false;
        }
        const checkedMember = this._checkMember(member);
        if (!checkedMember) {
            return false;
        }
        return this.client.native.SISMEMBER(full, checkedMember);
    }
    async areMembers(key: CacheKey<A>, members: Array<N>): Promise<Record<string, boolean>> {
        if (!this.prop.enabled) {
            return {};
        }
        const {full} = this._checkKey(key);
        if (!full) {
            return {};
        }
        const {items} = this._checkMembers(members);
        if (items.length < 1) {
            return {};
        }
        const values = this.util.asArray(await this.client.native.SMISMEMBER(full, items));
        return this.util.objectFromKeys(items, false, values);
    }
    // endregion exists

}