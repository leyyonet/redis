import {MaximumOneOf} from "@leyyo/cache";

export type RedisExpirySetMode = 'NX'|'XX'|'GT'|'LT';
export type RedisType = 'string'|'list'|'set'|'zset'|'hash'|'stream';

type SetTTL = MaximumOneOf<{
    EX: number;
    PX: number;
    EXAT: number;
    PXAT: number;
    KEEPTTL: true;
}>;
type SetGuards = MaximumOneOf<{
    NX: true;
    XX: true;
}>;
interface SetCommonOptions {
    GET?: true;
}
export type RedisSetOptions = SetTTL & SetGuards & SetCommonOptions;

