import xlsx from "node-xlsx";
import fs from "fs";
import path from "path";
import { Ruler } from "./Rule";
import { CFG } from "./config";
import { JSONify } from "./JSONFormatter";
import { TSify } from "./TSFormatter";
import { BINify } from "./BinFormatter";
import { ExtraSpace } from "./cmm";

/**
 * 合并表头
 * @param header1 表头1
 * @param header2 表头2
 * @param header3 表头3
 * @returns
 */
function ZipHeaders(header1: string[], header2: string[], header3: string[]) {
    let headers: string[] = [];
    for (let i = 0; i < header1.length; i++) {
        if (!!header2[i]) {
            let h1 = ExtraSpace(header1[i], 16);
            let h2 = ExtraSpace(header2[i], 24);
            let h3 = header3[i];
            headers.push("      " + h2 + h1 + "\t" + h3);
        }
    }
    return headers.join("\n");
}

/**
 * 检测表头的空字段
 * @param header 表头
 * @returns
 */
function Passable(header: string[]) {
    const passable = [];
    for (let i = 0; i < header.length; i++) {
        passable[i] = typeof header[i] == "undefined";
    }
    return passable;
}

/**
 * 导出配置
 * @param filePath 文件路径
 */
export function XLSXDumper(filePath: string) {
    console.log("准备解析配置：" + filePath);
    const data = fs.readFileSync(filePath);
    const sheets = xlsx.parse(data);
    for (let i = 0; i < sheets.length; i++) {
        parseSheet(sheets[i]);
    }
}

/**
 * 解析表格
 * @param sheet 表格信息
 */
function parseSheet(sheet: { name: string; data: any[] }) {
    if (sheet.name.startsWith("#")) return;
    if (sheet.name.startsWith("@")) {
        parseVSheet(sheet); // 竖向表格
    } else {
        parseHSheet(sheet); // 横向表格
    }
}

/**
 * 解析横向表格
 * @param sheet 表格信息
 */
function parseHSheet(sheet: { name: string; data: any[] }) {
    let data: Record<number | string, any> = {};
    let valid = false;
    let table = sheet.name.split("#")[0];
    let header1 = sheet.data[0];
    let header2 = sheet.data[1];
    let header3 = sheet.data[2];
    let passable = Passable(header2);
    let rowLen = passable.length;
    console.log("  正在解析横向表格：" + table);
    console.log("    字段：\n" + ZipHeaders(header1, header2, header3));
    for (let l = 3; l < sheet.data.length; l++) {
        let row = sheet.data[l];
        if (row.length == 0) continue;
        let item: Record<string, any> = {};
        let primary: string | number | undefined = undefined;
        for (let i = 0; i < rowLen; i++) {
            if (!passable[i]) {
                item[header2[i]] = Ruler.parse(header3[i], row[i]);
                if (primary == undefined) {
                    primary = item[header2[i]];
                }
            }
        }
        if (primary) {
            data[primary] = item;
            valid = true;
        }
    }
    if (valid) {
        SaveSheet(table, header2, header3, passable, data);
    }
}

/**
 * 解析竖向表格
 * @param sheet 表格信息
 */
function parseVSheet(sheet: { name: string; data: any[] }) {
    let data: Record<string, any> = {};
    let table = sheet.name.split("#")[0].replace("@", "");
    console.log("  正在解析竖向表格：" + table);
    const count = sheet.data.length;
    if (count == 0) return console.warn("表格为空");
    const width = sheet.data[0].length;
    if (width == 4) {
        const header1 = [];
        const header2 = [];
        const header3 = [];
        const passable = [];
        for (let i = 0; i < count; i++) {
            let [key, name, identifier, value] = sheet.data[i];
            passable[i] = false;
            header1.push(key);
            header2.push(name);
            header3.push(identifier);
            data[name] = Ruler.parse(identifier, value);
        }
        console.log("    字段：\n" + ZipHeaders(header1, header2, header3));
        SaveSheet(table, header2, header3, passable, data);
    } else {
        console.warn("竖向表格格式错误");
    }
}

/**
 * 保存表格
 * @param table 表名
 * @param header2 表头2
 * @param header3 表头3
 * @param passable 跳过字段
 * @param data 数据
 */
function SaveSheet(table: string, header2: string[], header3: string[], passable: boolean[], data: Record<string, any>) {
    const targets = CFG.TARGETS.split(",");
    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        // @ts-ignore
        const dirname = CFG[target];
        switch (target) {
            case "JSON":
                Save(dirname, ".json", table, JSONify(data));
                break;
            case "TS":
                {
                    const [ts, dts] = TSify(table, [header2, header3, passable], data);
                    Save(dirname, ".ts", table, ts);
                    Save("types", ".d.ts", table, dts);
                }
                break;
            case "BIN":
                Save(dirname, ".bin", table, BINify(data));
                break;
        }
    }
}

/**
 * 保存表格
 * @param dirname 输出目录
 * @param ext 扩展名
 * @param table 表格名称
 * @param content 表格内容
 */
function Save(dirname: string, ext: string, table: string, content: string | Uint8Array) {
    const at = path.join(__dirname, dirname, table + ext);
    const dir = path.dirname(at);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    console.log("    表格导出到：" + at);
    fs.writeFileSync(at, content, { encoding: "utf-8" });
}
