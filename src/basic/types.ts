import {CacheBasic, CmdBasicInfoResult, Id, TR} from "@leyyo/cache";
import {SetOptions} from "redis";

export type RedisBasic<A extends TR, N extends Id> = CacheBasic<A, N>;

export type RedisCmdBasicInfoResult = CmdBasicInfoResult;
export type RedisOptExpiryMode = 'NX' | 'XX' | 'GT' | 'LT';
export type RedisExpirySaveMode = 'NX' | 'XX';
export type RedisType = 'string' | 'list' | 'set' | 'zset' | 'hash' | 'stream';

export interface RedisOptExpiry {
    EX?: number;
    PX?: number;
    EXAT?: number;
    PXAT?: number;
    KEEPTTL?: true;
}

export interface RedisOptSaveMode {
    NX?: true;
    XX?: true;
}

export interface RedisOptSetReturn {
    GET?: true;
}

export type RedisCmdRedisSet = RedisOptExpiry & RedisOptSaveMode & RedisOptSetReturn & SetOptions;
