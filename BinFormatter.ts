import { RSON } from "./rson";

export function BINify(data: Record<number | string, any>) {
    return RSON.encodeAsU8(data);
}
