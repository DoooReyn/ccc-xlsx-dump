/**
 * JSON序列化
 * @param data 数据
 * @param indent 缩进
 * @returns
 */
export function JSONify(data: Record<number | string, any>, indent: number = 4) {
    return JSON.stringify(data, null, indent);
}
