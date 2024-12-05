import * as zipson from "zipson";
import pako from "pako";

/** JSON 自定义序列化、反序列化工具 */
export class RSON {
    /** 将对象序列化为字符串 */
    public static encode(input: any): string {
        return zipson.stringify(input);
    }
    /** 将对象序列化为字符串并处理为二进制 */
    public static encodeAsU8(input: any): Uint8Array {
        return pako.deflate(zipson.stringify(input));
    }
    /** 将字符串反序列化为对象 */
    public static decode(input: string): any {
        return zipson.parse(input);
    }
    /** 从二进制还原字符串并反序列化为对象 */
    public static decodeFromU8(input: Uint8Array): any {
        return zipson.parse(pako.inflate(input, { to: "string" }));
    }
}
