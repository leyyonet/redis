import {CacheOptExpiryMode, CacheOptExpiryModeOne, CacheOptExpiryModeType} from "@leyyo/cache";
import {RedisExpirySetMode} from "./types";

export class RedisSpecImpl {
    getExpiryMode(opt: CacheOptExpiryModeOne, def?: CacheOptExpiryModeType): RedisExpirySetMode {
        const opt2 = opt as CacheOptExpiryMode;
        if (opt2.always) {
            return undefined;
        }
        if (opt2.whenAbsent) {
            return 'NX'
        }
        if (opt2.whenExists) {
            return 'XX'
        }
        if (opt2.whenGreaterThan) {
            return 'GT'
        }
        else if (opt2.whenLessThan) {
            return 'LT';
        }
        switch (def) {
            case 'always':
                return undefined;
            case 'whenAbsent':
                return 'NX'
            case 'whenExists':
                return 'XX'
            case 'whenGreaterThan':
                return 'GT'
            case 'whenLessThan':
                return 'LT';
            default:
                return undefined;
        }
    }
}

export const redisSpec = new RedisSpecImpl();