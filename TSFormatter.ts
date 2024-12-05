import { Capitalize } from "./cmm";
import { JSONify } from "./JSONFormatter";
import { RuleParser } from "./Rule";

/**
 * 转换为TS代码
 * @param table 表名
 * @param headers 表头
 * @param data 数据
 * @returns
 */
export function TSify(table: string, headers: [string[], string[], boolean[]], data: Record<number | string, any>) {
    const ctable = Capitalize(table);
    const [header2, header3, passable] = headers;
    const interfaces = ["interface ITbl" + ctable + " {"];
    for (let i = 0; i < passable.length; i++) {
        if (passable[i]) continue;
        const type = RuleParser.transform(header3[i]);
        interfaces.push(`    ${header2[i]}: ${type};`);
    }
    interfaces.push("}");
    const types = interfaces.join("\n");
    const tables = "export const Tbl" + ctable + ": Record<string, ITbl" + ctable + "> = " + JSONify(data, 4) + " as const;";
    const content = ["export " + types, tables].join("\n\n");
    return [content, types];
}
