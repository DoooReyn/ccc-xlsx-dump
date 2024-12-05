type IRule<RET> = (text: string, params?: string) => RET;
type IRuleType = (key: string, params: string) => string;

/**
 * 布尔解析器
 * @param text 文本
 * @example 0
 * @example 1
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
    return text.split(",").map((v) => RuleParser.parse(pk, v));
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
    return text.split(",").map((v, i) => RuleParser.parse(ps[i], v));
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
        const key = RuleParser.parse("S", k);
        const val = RuleParser.parse(pk, v);
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
        const val = RuleParser.parse(ps, sub);
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
        const val = RuleParser.parse(pv, sub);
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
export class RuleParser {
    private static _rules: Map<string, [IRule<any>, IRuleType]> = new Map();

    public static initialize() {
        this.register<boolean>("B", [BooleanParser, BasicTypeTransformer]);
        this.register<number>("I", [IntegerParser, BasicTypeTransformer]);
        this.register<number>("N", [NumberParser, BasicTypeTransformer]);
        this.register<string>("S", [StringParser, BasicTypeTransformer]);
        this.register<number>("P", [PickParser, BasicTypeTransformer]);
        this.register<boolean[]>("LB", [ListBooleanParser, BasicTypeTransformer]);
        this.register<number[]>("LI", [ListIntegerParser, BasicTypeTransformer]);
        this.register<number[]>("LN", [ListNumberParser, BasicTypeTransformer]);
        this.register<string[]>("LS", [ListStringParser, BasicTypeTransformer]);
        this.register<Record<string, boolean>>("MB", [MapBooleanParser, BasicTypeTransformer]);
        this.register<Record<string, number>>("MI", [MapIntegerParser, BasicTypeTransformer]);
        this.register<Record<string, number>>("MN", [MapNumberParser, BasicTypeTransformer]);
        this.register<Record<string, string>>("MS", [MapStringParser, BasicTypeTransformer]);
        // 高级内容
        this.register<any[]>("L", [ListParser, BasicTypeTransformer]);
        this.register<any[]>("LE", [ListItemParser, BasicTypeTransformer]);
        this.register<Record<string, any>>("M", [MapParser, BasicTypeTransformer]);
        this.register<Record<string, any>>("MA", [MapAllParser, BasicTypeTransformer]);
        this.register<Record<string, any>>("ME", [MapItemParser, BasicTypeTransformer]);
    }

    /**
     * 注册规则
     * @param identifier 规则标识
     * @param parser 规则解析器
     */
    public static register<RET>(identifier: string, parser: [IRule<RET>, IRuleType]) {
        this._rules.set(identifier, parser);
    }

    /**
     * 根据规则解析文本
     * @param rule 规则文本
     * @param text 待解析文本
     * @returns
     */
    public static parse(rule: string, text: string) {
        const [key, params] = rule.split("=");
        const ruler = this._rules.get(key);
        if (ruler) {
            return ruler[0](text, params);
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
        const [key, params] = rule.split("=");
        const ruler = this._rules.get(key);
        if (ruler) {
            return ruler[1](key, params);
        } else {
            throw new Error("未注册的规则转换器：" + rule);
        }
    }
}
