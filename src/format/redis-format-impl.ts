import {CacheFormatAbstract, Id, TR} from "@leyyo/cache";
import {RedisFormat} from "./types";
import {RedisChannel} from "../channel";

export class RedisFormatImpl<A extends TR, N extends Id> extends CacheFormatAbstract<A, N> implements RedisFormat<A, N> {

    constructor(channel: RedisChannel<A, N>) {
        super(channel);
    }

    protected _fullValue(delim: string, short: string): string {
        return `${delim}${this.channel.full}${short}`;
    }
}