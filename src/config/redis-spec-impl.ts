import {CacheOptSaveMode, ExpiryMode} from "@leyyo/cache";
import {RedisOptExpiry, RedisOptExpiryMode, RedisOptSaveMode, RedisOptSetReturn} from "../basic";
import {CacheOptReturnPrevious, CacheOptSaveSpan} from "@leyyo/cache/dist/command/types";

export class RedisSpecImpl {
    expiryMode(mode: ExpiryMode): RedisOptExpiryMode {
        switch (mode) {
            case 'always':
                return undefined;
            case 'absent':
                return 'NX'
            case 'exists':
                return 'XX'
            case 'greater':
                return 'GT'
            case 'less':
                return 'LT';
            default:
                return undefined;
        }
    }

    // RedisOptSetReturn
    fillExpiryTime(opt: RedisOptExpiry, org: CacheOptSaveSpan, milliseconds: number): boolean {
        if (org.span === 'keep-ttl') {
            opt.KEEPTTL = true;
            return true;
        }
        if (milliseconds > 0) {
            switch (org.span) {
                case "ttl":
                    opt.PX = milliseconds;
                    return true;
                case "timestamp":
                    opt.PXAT = milliseconds;
                    return true;
            }
        }
        return false;
    }

    fillReturnType(opt: RedisOptSetReturn, org: CacheOptReturnPrevious): boolean {
        if (org.returnPrevious) {
            opt.GET = true;
            return true;
        }
        return false;
    }

    fillSaveMode(opt: RedisOptSaveMode, org: CacheOptSaveMode): boolean {
        switch (org.mode) {
            case 'always':
                return false;
            case 'absent':
                opt.NX = true;
                return true;
            case 'exists':
                opt.XX = true;
                return true;
            default:
                return false;
        }
    }
}

export const redisSpec = new RedisSpecImpl();