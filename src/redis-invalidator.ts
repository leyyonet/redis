import {RedisClientType} from "redis";
import {CacheID, PropInvalidator, PropInvalidatorAbstract, TR} from "@leyyo/cache";

type C = RedisClientType;
export class RedisInvalidator<A extends TR, N extends CacheID> extends PropInvalidatorAbstract<A, N, C> implements PropInvalidator<A, N, C>{

    add(memberFull: string, identifiers: Array<CacheID>, prefix?: string): void {
        if (!this.prop.enabled) {
            return;
        }
        if (!Array.isArray(identifiers) || identifiers.length < 1) {
            return;
        }
        prefix = this.checkPrefix(prefix);
        identifiers.forEach(identifier => {
            const indexFull = this.fullKey(identifier, prefix);
            this.client.native.SADD(indexFull, [memberFull])
                .then()
                .catch(e => {
                    console.error(`Adding invalidator member[${indexFull}][${memberFull}] => ${e.message}`);
                });
        });
    }

    remove(identifier: CacheID, prefix?: string): void {
        if (!this.prop.enabled) {
            return;
        }
        if (!identifier) {
            return;
        }
        prefix = this.checkPrefix(prefix);
        const cli = this.client.native;
        const indexFull = this.fullKey(identifier, prefix);
        cli.SMEMBERS(indexFull)
            .then(members => {
                members = this.util.asArray(members);
                if (members.length > 0) {
                    cli.SREM(indexFull, members)
                        .then()
                        .catch(e => {
                            console.error(`Deleting invalidator index[${indexFull}] => ${e.message}`);
                        });
                    cli.UNLINK([...members, indexFull])
                        .then()
                        .catch(e => {
                            console.error(`Deleting invalidator member[${indexFull}] => ${e.message}`);
                        });
                }
                else {
                    cli.UNLINK(indexFull)
                        .then(deleted => {
                            if (deleted > 0) {
                                console.warn(`Not-cleared invalidator index[${indexFull}] => ${deleted} records`);
                            }
                        })
                        .catch(e => {
                            console.error(`Deleting invalidator index[${indexFull}] => ${e.message}`);
                        });
                }
            })
            .catch(e => {
                console.error(`Retrieving invalidator index[${indexFull}] => ${e.message}`);
            });
    }
}