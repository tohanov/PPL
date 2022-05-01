import {  Exp, Program, Binding, CExp, DefineExp, makeProgram, makeDefineExp, LetPlusExp } from "./L31-ast";
import { Result, makeFailure, makeOk } from "../shared/result";
import { map } from "ramda";


/*
Purpose: Transform L31 AST to L3 AST
Signature: l31ToL3(l31AST)
Type: [Exp | Program] => Result<Exp | Program>
*/
export const L31ToL3 = (exp: Exp | Program): Result<Exp | Program> =>
(exp.tag === "Program")? makeOk(changeLetPlusProgram(exp))
: makeOk(changeLetPlusExp(exp))

const changeLetPlusProgram = (program: Program): Program => makeProgram(changeLetPlusExpArray(program.exps))

const changeLetPlusExpArray = (exp: Exp[]): Exp[] => map(changeLetPlusExp, exp)

const changeLetPlusExp = (exp: Exp): Exp => 
(exp.tag === "DefineExp")? changeDefineExp(exp)
: changeLetPlusCExp(exp)

const changeLetPlusCExp = (exp: CExp): CExp => 
(exp.tag === "AppExp")? ({tag: "AppExp", rator: changeLetPlusCExp(exp.rator), rands: changeLetPlusCExpArray(exp.rands)})
: (exp.tag === "IfExp")? ({tag: "IfExp", test: changeLetPlusCExp(exp.test), then: changeLetPlusCExp(exp.then), alt: changeLetPlusCExp(exp.alt)}) 
: (exp.tag === "ProcExp")? ({tag: "ProcExp", args: exp.args, body: changeLetPlusCExpArray(exp.body)})
: (exp.tag === "LetExp")? ({tag: "LetExp", bindings: changeBindingExpArray(exp.bindings), body: changeLetPlusCExpArray(exp.body)})
: (exp.tag === "LetPlusExp")? letPLusToLet(exp)
: exp

const letPLusToLet = (exp: LetPlusExp): CExp =>
(changeBindingExpArray(exp.bindings).length == 1)? ({tag: "LetExp", bindings: [changeBindingExpArray(exp.bindings)[0]], body: exp.body})
: (changeBindingExpArray(exp.bindings).length == 0)? ({tag: "LetExp", bindings: [], body: exp.body})
: ({tag: "LetExp", bindings: [changeBindingExpArray(exp.bindings)[0]], body: [letPLusToLet({tag: "LetPlusExp", bindings: exp.bindings.slice(1), body:exp.body})]})

const changeLetPlusCExpArray = (exp: CExp[]): CExp[] => map(changeLetPlusCExp, exp)

const changeDefineExp = (exp: Exp): Exp => 
(exp.tag === "DefineExp")? makeDefineExp(exp.var, changeLetPlusCExp(exp.val))
: exp

const changeBindingExp = (binding: Binding): Binding => 
(binding.tag === "Binding")? ({tag: "Binding", var: binding.var, val: changeLetPlusCExp(binding.val)})
: binding

const changeBindingExpArray = (binding: Binding[]): Binding[] => map(changeBindingExp, binding)
