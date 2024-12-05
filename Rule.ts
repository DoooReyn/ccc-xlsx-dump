/** 规则接口（所有规则都必须实现此接口） */
export interface IRule<RET> {
    /** 规则标识 */
    identifier: string;
    /** 规则解析器 */
    parser: (text: string, params?: string) => RET;
    /** 规则类型转换器 */
    transformer: (rule: string, params?: string) => string;
}

/**
 * 布尔解析器
 * @param text 文本
 * @example 0 => false
 * @example 1 => true
 * @returns
 */
function BooleanParser(text: string): boolean {
    return text === "1";
}

/**
 * 整数解析器
 * @param text 文本
 * @example 100
 * @returns
 */
function IntegerParser(text: string): number {
    let ret = parseInt(text);
    if (isNaN(ret)) {
        throw new Error("[I] Not a number");
    }
    return ret;
}

/**
 * 数值解析器
 * @param text 文本
 * @example 52.0
 * @returns
 */
function NumberParser(text: string): number {
    let ret = parseFloat(text);
    if (isNaN(ret)) {
        throw new Error("[N] Not a number");
    }
    return ret;
}

/**
 * 字符串解析器
 * @param text 文本
 * @example hello, world
 * @returns
 */
function StringParser(text: string): string {
    return text;
}

/**
 * 选择器解析器
 * @param text 文本
 * @param params 参数
 * @example 0|1|2
 * @example 未知|男|女
 * @returns
 */
function PickParser(text: string, params?: string): number {
    const values: Record<string, number> = {};
    params!.split(",").forEach((v, i) => {
        values[v] = i;
    });
    let ret = values[text];
    if (ret === undefined) {
        throw new Error("[OP] Not a valid option");
    }
    return ret;
}

/**
 * 数组解析器
 * @param text 文本
 * @param params 参数
 * @returns
 */
function ListParser(text: string, params?: string): any[] {
    const pk = params!.split("#")[0];
    return text.split(",").map((v) => Ruler.parse(pk, v));
}

/**
 * 布尔数值解析器
 * @param text 文本
 * @returns
 */
function ListBooleanParser(text: string): boolean[] {
    return ListParser(text, "B");
}

/**
 * 整数解析器
 * @param text 文本
 * @returns
 */
function ListIntegerParser(text: string): number[] {
    return ListParser(text, "I");
}

/**
 * 数值数组解析器
 * @param text 文本
 * @returns
 */
function ListNumberParser(text: string): number[] {
    return ListParser(text, "N");
}

/**
 * 字符串数组解析器
 * @param text 文本
 * @returns
 */
function ListStringParser(text: string): string[] {
    return ListParser(text, "S");
}

/**
 * 数组逐项解析器
 * @param text 文本
 * @param params 参数
 */
function ListItemParser(text: string, params?: string): any[] {
    const ps = params!.split("#")[0].split(",");
    return text.split(",").map((v, i) => Ruler.parse(ps[i], v));
}

/**
 * 映射表解析器
 * @param text 文本
 * @param params 参数
 * @returns
 */
function MapParser(text: string, params?: string): Record<string, any> {
    const ret: Record<string, any> = {};
    const pk = params!.split("#")[0];
    text.split(";").forEach((sub) => {
        const [k, v] = sub.split(",");
        const key = Ruler.parse("S", k);
        const val = Ruler.parse(pk, v);
        ret[key] = val;
    });
    return ret;
}

/**
 * 布尔映射解析器
 * @param text 文本
 * @returns
 */
function MapBooleanParser(text: string): Record<string, boolean> {
    return MapParser(text, "B");
}

/**
 * 整数映射解析器
 * @param text 文本
 * @returns
 */
function MapIntegerParser(text: string): Record<string, number> {
    return MapParser(text, "I");
}

/**
 * 数值映射解析器
 * @param text 文本
 * @returns
 */
function MapNumberParser(text: string): Record<string, number> {
    return MapParser(text, "N");
}

/**
 * 字符串映射解析器
 * @param text 文本
 * @returns
 */
function MapStringParser(text: string): Record<string, string> {
    return MapParser(text, "S");
}

/**
 * 统一类型映射表解析器
 * @param text 文本
 * @param params 参数
 * @returns
 */
function MapAllParser(text: string, params?: string): Record<string, any> {
    const ret: Record<string, any> = {};
    const pks = params!.split("#")[0].split(",");
    const ps = pks[0];
    text.split(",").forEach((sub, i) => {
        const key = pks[i + 1];
        const val = Ruler.parse(ps, sub);
        ret[key] = val;
    });
    return ret;
}

/**
 * 映射表逐项解析器
 * @param text 文本
 * @param params 参数
 * @returns
 */
function MapItemParser(text: string, params?: string): Record<string, any> {
    const ps = params!.split("#")[0].split(";");
    const ret: Record<string, any> = {};
    text.split(",").forEach((sub, i) => {
        const [pk, pv] = ps[i].split(",");
        const val = Ruler.parse(pv, sub);
        ret[pk] = val;
    });
    return ret;
}

/**
 * 根据规则转换类型
 * @param identifier 规则标识符
 * @param params 规则参数
 * @returns
 */
function BasicTypeTransformer(identifier: string, params?: string) {
    let type: string = "";
    switch (identifier) {
        case "B":
            type = "boolean";
            break;
        case "I":
        case "N":
            type = "number";
            break;
        case "P":
            type = params!
                .split("#")[0]
                .split(",")
                .map((v, i) => i)
                .join("|");
            break;
        case "S":
            type = "string";
            break;
        case "LB":
            type = "Array<boolean>";
            break;
        case "LI":
        case "LN":
            type = "Array<number>";
            break;
        case "LS":
            type = "Array<string>";
            break;
        case "MB":
            type = "Record<string, boolean>";
            break;
        case "MI":
        case "MN":
            type = "Record<string, number>";
            break;
        case "MS":
            type = "Record<string, string>";
            break;
        case "L":
            {
                const t = BasicTypeTransformer(params!.split("#")[0]);
                type = `Array<${t}>`;
            }
            break;
        case "LE":
            {
                const ts = params!.split("#")[0].split(",");
                const tbl = [];
                for (let i = 0; i < ts.length; i++) {
                    tbl.push(BasicTypeTransformer(ts[i]));
                }
                type = `[${tbl.join(", ")}]`;
            }
            break;
        case "M":
            {
                const t = BasicTypeTransformer(params!.split("#")[0]);
                type = `Record<string, ${t}>`;
            }
            break;
        case "MA":
            {
                const map = [];
                const ts = params!.split("#")[0].split(",");
                const t1 = BasicTypeTransformer(ts[0]);
                for (let i = 1; i < ts.length; i++) {
                    const t2 = ts[i];
                    map.push(`${t2}: ${t1}`);
                }
                type = `{ ${map.join("; ")} }`;
            }
            break;
        case "ME":
            {
                const map = [];
                const ts = params!.split("#")[0].split(";");
                for (let i = 0; i < ts.length; i++) {
                    const [k, v] = ts[i].split(",");
                    const t = BasicTypeTransformer(v);
                    map.push(`${k}: ${t}`);
                }
                type = `{ ${map.join("; ")} }`;
            }
            break;
    }

    return type;
}

/**
 * 规则解析器
 */
export class Ruler {
    private static _rules: Map<string, IRule<any>> = new Map();

    public static initialize() {
        this.register<boolean>({ identifier: "B", parser: BooleanParser, transformer: BasicTypeTransformer });
        this.register<number>({ identifier: "I", parser: IntegerParser, transformer: BasicTypeTransformer });
        this.register<number>({ identifier: "N", parser: NumberParser, transformer: BasicTypeTransformer });
        this.register<string>({ identifier: "S", parser: StringParser, transformer: BasicTypeTransformer });
        this.register<number>({ identifier: "P", parser: PickParser, transformer: BasicTypeTransformer });
        this.register<any[]>({ identifier: "L", parser: ListParser, transformer: BasicTypeTransformer });
        this.register<any[]>({ identifier: "LE", parser: ListItemParser, transformer: BasicTypeTransformer });
        this.register<boolean[]>({ identifier: "LB", parser: ListBooleanParser, transformer: BasicTypeTransformer });
        this.register<number[]>({ identifier: "LI", parser: ListIntegerParser, transformer: BasicTypeTransformer });
        this.register<number[]>({ identifier: "LN", parser: ListNumberParser, transformer: BasicTypeTransformer });
        this.register<string[]>({ identifier: "LS", parser: ListStringParser, transformer: BasicTypeTransformer });
        this.register<Record<string, any>>({ identifier: "M", parser: MapParser, transformer: BasicTypeTransformer });
        this.register<Record<string, boolean>>({
            identifier: "MB",
            parser: MapBooleanParser,
            transformer: BasicTypeTransformer,
        });
        this.register<Record<string, number>>({
            identifier: "MI",
            parser: MapIntegerParser,
            transformer: BasicTypeTransformer,
        });
        this.register<Record<string, number>>({ identifier: "MN", parser: MapNumberParser, transformer: BasicTypeTransformer });
        this.register<Record<string, string>>({ identifier: "MS", parser: MapStringParser, transformer: BasicTypeTransformer });
        this.register<Record<string, any>>({ identifier: "MA", parser: MapAllParser, transformer: BasicTypeTransformer });
        this.register<Record<string, any>>({ identifier: "ME", parser: MapItemParser, transformer: BasicTypeTransformer });
    }

    /**
     * 注册规则
     * @param rule 规则
     * @param replace 是否替换原规则（默认否）
     */
    public static register<RET>(rule: IRule<RET>, replace: boolean = false) {
        if (replace || !this._rules.has(rule.identifier)) {
            this._rules.set(rule.identifier, rule);
        } else {
            throw new Error("规则已存在，如需替换，请将 replace 置为真：" + rule.identifier);
        }
    }

    /**
     * 根据规则解析文本
     * @param rule 规则文本
     * @param text 待解析文本
     * @returns
     */
    public static parse(rule: string, text: string) {
        const [identifier, params] = rule.split("=");
        const ruler = this._rules.get(identifier);
        if (ruler) {
            return ruler.parser(text, params);
        } else {
            throw new Error("未注册的规则解析器：" + rule);
        }
    }

    /**
     * 根据规则转换文本类型
     * @param rule 规则文本
     * @returns
     */
    public static transform(rule: string) {
        const [identifier, params] = rule.split("=");
        const ruler = this._rules.get(identifier);
        if (ruler) {
            return ruler.transformer(identifier, params);
        } else {
            throw new Error("未注册的规则转换器：" + rule);
        }
    }
}
