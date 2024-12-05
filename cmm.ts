
/**
 * 字符串首字母大写
 * @param str 字符串
 * @returns
 */
export function Capitalize(str: string) {
    return str.replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * 退出
 * @param code 退出码
 * @param msg 提示内容
 */
export function Exit(code: number, msg?: string) {
    if (code != 0 && msg) {
        console.error(msg);
    }
    process.exit(code);
}
