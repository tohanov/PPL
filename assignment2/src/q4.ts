import { Exp, Program ,isBoolExp,isNumExp,isStrExp,isLitExp,isVarRef
,isProcExp,isIfExp,isAppExp,isPrimOp,isLetExp,isDefineExp
,isProgram,LitExp,ProcExp,LetExp,Binding,VarDecl,AppExp} from '../imp/L3-ast';
import { map,append } from "ramda";
import { Value ,isClosure,isSymbolSExp,isEmptySExp
,isCompoundSExp,CompoundSExp,Closure} from '../imp/L3-value';
import {isNumber, isArray, isString } from "../shared/type-predicates";
import { Result, makeOk} from "../shared/result";
import { CExp, DefineExp } from './L31-ast';



/*
Purpose: Transform L3 AST to JavaScript program string
Signature: l30ToJS(l2AST)
Type: [EXP | Program] => Result<string>
*/

export const l30ToJS = (exp: Exp | Program): Result<string>  => 
makeOk(rewriteExp(exp))

const rewriteExp = (exp: Program | Exp): string =>
(exp.tag === "BoolExp")? rewriteValue(exp.val) :
(exp.tag === "NumExp")? rewriteValue(exp.val) :
(exp.tag === "StrExp")? rewriteValue(exp.val) :
(exp.tag === "LitExp")? rewriteLitExp(exp) :
(exp.tag === "VarRef")? exp.var :
(exp.tag === "ProcExp")? rewriteProcExp(exp) :
(exp.tag === "AppExp")? rewriteAppExp(exp) :
(exp.tag === "LetExp")? rewriteLetExp(exp) :
(exp.tag === "DefineExp")? rewriteDefineExp(exp) :
isIfExp(exp)? `(${rewriteExp (exp.test)} ? ${rewriteExp (exp.then)} : ${rewriteExp (exp.alt)})` :
isPrimOp(exp)? ((["number?","boolean?","symbol?","string?"].includes(exp.op))? 
"((x) => (typeof (x) === " + exp.op.substring(0,exp.op.length-1) + "))" : exp.op) :
isProgram(exp)? `${map((e: Exp) =>(rewriteLExps([e])),exp.exps).join(`;\n`)}` :
exp;

const rewriteDefineExp = (exp: Exp): string => 
(exp.tag === "DefineExp")? "const " + exp.var.var + " = " + rewriteExp (exp.val)
: ""

const rewriteValue = (val: Value): string =>
isString(val) ? `\"` + val + `\"`
: isNumber(val) ?  val.toString() 
: val === true ? "true" 
: val === false ? "false" 
: isEmptySExp(val) ? "()" 
: isClosure(val) ? rewriteClosure(val) 
: isPrimOp(val) ? val.op 
: isSymbolSExp(val) ? val.val 
: isCompoundSExp(val) ? convertCompoundToString(val) 
: val

const rewriteClosure = (c: Closure): string =>
`<Closure ${c.params} ${c.body}>`

const rewriteAppExp = (apEx: AppExp): string => {
    let op :string = rewriteExp(apEx.rator);
    let toReturn: string = (op === "or" )? "(" + map((e: Exp) => rewriteLExps([e]),apEx.rands).join(`||`) + ")"
    : (op === "and")? "(" + map((e: Exp) => rewriteLExps([e]),apEx.rands).join(`&&`) + ")"
    : (op === "not")? "(!" + map((e: Exp) => rewriteLExps([e]),apEx.rands) + ")" 
    : (["+", "-", "/", "*", ">", "<"].includes(op))? "(" + map((e: Exp) => rewriteLExps([e]),apEx.rands).join(" " + rewriteExp(apEx.rator) + " ") + ")"
    : (["=","eq","string=?"].includes(op))? `(${map((e: Exp) => rewriteLExps([e]),apEx.rands).join(` === `)})`
    : (["number?","boolean?","symbol?","string?"].includes(op))? 
    "((x) => (typeof (x) === " + op.substring(0,op.length-1) + "))"
    : "" + rewriteExp (apEx.rator) + "(" + map((e: Exp) => rewriteLExps([e]),apEx.rands).join(",") + ")"
    return toReturn;
}

const rewriteLitExp = (le: LitExp): string =>
isEmptySExp(le.val) ? `Symbol.for("()")` 
: isCompoundSExp(le.val) ? `'Symbol.for("${rewriteValue(le.val)}")` 
: isSymbolSExp(le.val) ? `Symbol.for("${rewriteValue(le.val)}")`
: "" + le.val

const rewriteLExps = (les: Exp[]): string =>
map(rewriteExp, les).join(" ");

const rewriteProcExp = (pe: ProcExp): string => 
(pe.body.length ===1 )?
    "((" + map((p: VarDecl) => p.var, pe.args).join(",") + ") => " + rewriteLExps(pe.body) + ")"
: "((" + map((p: VarDecl) => p.var, pe.args).join(",") + ") => {" + switchOccurrence(map((cexp) => rewriteLExps([cexp]),pe.body).join(`; `),`;`,`; return`) + ";})"

const switchOccurrence = (str:string,char:string,subStr:string):string=>
str.substring(0,str.lastIndexOf(char)) + subStr + str.substring(str.lastIndexOf(char)+1,str.length)

const rewriteLetExp = (le: LetExp) : string => 
"((" + map((b: Binding) => b.var.var, le.bindings).join(",") + ") => " + rewriteLExps(le.body) + ")(" + map((b: Binding) => rewriteExp(b.val), le.bindings).join(",") + ")"

const convertCompoundToString = (cs: CompoundSExp, css = convertCmpoundToArray(cs, [])): string => 
isArray(css) ? "(" + css.join(" ") + ")" :
"(" + css.s1.join(" ") + " . " + css.s2 + ")"

const convertCmpoundToArray = (cs: CompoundSExp, res: string[]): string[] | { s1: string[], s2: string } =>
isEmptySExp(cs.val2) ? append(rewriteValue(cs.val1), res) :
isCompoundSExp(cs.val2) ? convertCmpoundToArray(cs.val2, append(rewriteValue(cs.val1), res)) :
({ s1: append(rewriteValue(cs.val1), res), s2: rewriteValue(cs.val2)})
