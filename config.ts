/**
 * 合并方式
 */
export enum MergeType {
    TEXT,
    BIN,
}

/**
 * 基础配置
 */
export const CFG = {
    /** 输入：表格目录 */
    TABLE: "table",
    /** 输出类型：.json 所在目录 */
    JSON: "json",
    /** 输出类型：.ts 所在目录 */
    TS: "ts",
    /** 输出类型：.bin 所在目录 */
    BIN: "bin",
    /** 输出目标（用,分隔） */
    TARGETS: "TS,JSON,BIN",
    /** 合并目录 */
    MINIFIED: "minified",
    /** 合并名称 */
    MERGE_AS: "excel-dumper"
} as const;
