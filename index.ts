import fs from "fs";
import path from "path";
import { CFG } from "./config";
import { XLSXDumper } from "./XLSXDumper";
import { Ruler } from "./Rule";
import { Capitalize, Exit } from "./cmm";
import { RSON } from "./rson";

/**
 * 导出配置
 */
function dump() {
    Ruler.initialize();
    console.log(Ruler.parse("M=B", "a,1;b,2"));
    console.log(Ruler.transform("M=B"));
    const dirPath = path.join(__dirname, CFG.TABLE);
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        if (file.endsWith(".xlsx") && !file.startsWith("~$")) {
            XLSXDumper(path.join(dirPath, file));
        }
    }
}

/**
 * 合并配置
 */
function merge() {
    mergeAllJSON();
    mergeAllTS();
    mergeAllDTS();
}

/**
 * 合并所有JSON
 */
function mergeAllJSON() {
    const all: Record<string, string> = {};
    const dirPath = path.join(__dirname, CFG.JSON);
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        if (file.endsWith(".json")) {
            const json = JSON.parse(fs.readFileSync(path.join(dirPath, file), "utf-8"));
            all[path.basename(file, ".json")] = json;
        }
    }
    const MINIFIED_AT = path.join(__dirname, CFG.MINIFIED);
    const JSON_AT = path.join(MINIFIED_AT, CFG.MERGE_AS + ".json");
    const BIN_AT = path.join(MINIFIED_AT, CFG.MERGE_AS + ".bin");
    if (!fs.existsSync(MINIFIED_AT)) {
        fs.mkdirSync(path.dirname(MINIFIED_AT));
    }
    const json = JSON.stringify(all, null, 0);
    const bin = RSON.encodeAsU8(all);
    fs.writeFileSync(JSON_AT, json, "utf-8");
    fs.writeFileSync(BIN_AT, bin, "utf-8");
}

/**
 * 合并所有TS
 */
function mergeAllTS() {
    const all = [];
    const dirPath = path.join(__dirname, CFG.TS);
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        if (file.endsWith(".ts")) {
            const ts = fs.readFileSync(path.join(dirPath, file), "utf-8");
            all.push(ts);
        }
    }
    const MINIFIED_AT = path.join(__dirname, CFG.MINIFIED);
    const TS_AT = path.join(MINIFIED_AT, CFG.MERGE_AS + ".ts");
    if (!fs.existsSync(MINIFIED_AT)) {
        fs.mkdirSync(path.dirname(MINIFIED_AT));
    }
    const ts = all.join("\n\n");
    fs.writeFileSync(TS_AT, ts, "utf-8");
}

/**
 * 合并所有DTS
 */
function mergeAllDTS() {
    const all = [];
    const dirPath = path.join(__dirname, "types");
    const files = fs.readdirSync(dirPath);
    const tables = ["    type Tables = {"];
    for (const file of files) {
        if (file.endsWith(".d.ts")) {
            const name = path.basename(file, ".d.ts");
            tables.push("        " + name + ": ITbl" + Capitalize(name) + ";");
            let dts = fs.readFileSync(path.join(dirPath, file), "utf-8");
            dts = dts
                .split("\n")
                .map((line) => "    " + line)
                .join("\n");
            all.push(dts);
        }
    }
    tables.push("    }");
    all.push(tables.join("\n"));
    const MINIFIED_AT = path.join(__dirname, CFG.MINIFIED);
    const TS_AT = path.join(MINIFIED_AT, CFG.MERGE_AS + ".d.ts");
    if (!fs.existsSync(MINIFIED_AT)) {
        fs.mkdirSync(path.dirname(MINIFIED_AT));
    }
    const name = Capitalize(CFG.MERGE_AS);
    const dts = all.join("\n\n");
    const content = [
        `export = ${name};`,
        `export as namespace ${CFG.MERGE_AS};\n`,
        `declare namespace ${name} {`,
        dts,
        "}",
    ].join("\n");
    fs.writeFileSync(TS_AT, content, "utf-8");
}

/**
 * 解析BIN文件
 * @param bin BIN文件路径
 */
function extractBin(bin: string) {
    if (fs.existsSync(bin)) {
        const data = fs.readFileSync(bin);
        const json = RSON.decodeFromU8(new Uint8Array(data.buffer));
        console.log(json);
    } else {
        Exit(-1, "请输入正确的BIN文件路径");
    }
}

/**
 * 主程序
 */
const exe = process.argv[2];
switch (exe) {
    case "-e":
    case "--extract":
        extractBin(process.argv[3]);
        break;
    case "-m":
    case "--merge":
        merge();
        break;
    case undefined:
    case "-d":
    case "--dump":
        dump();
        break;
    case "-h":
    case "--help":
    default:
        console.log("-d/--dump              导出表格配置");
        console.log("-e/--extract <bin>     解析BIN文件");
        console.log("-m/--merge             合并所有输出");
        console.log("-h/--help              查看帮助");
        break;
}
