import { Result, makeFailure, makeOk, bind, either } from "../lib/result";


/* Library code */
const findOrThrow = <T>(pred: (x: T) => boolean, a: T[]): T => {
    for (let i = 0; i < a.length; i++) {
        if (pred(a[i])) return a[i];
    }
    throw "No element found.";
}


/* Client code */
const returnSquaredIfFoundEven_v1 = (a: number[]): number => {
    try {
        const x = findOrThrow(x => x % 2 === 0, a);
        return x * x;
    } catch (e) {
        return -1;
    }
}


export const findResult = <T> (pred:(x:T)=>boolean, a:T[]):Result<T> => {

	const filteredArr = a.filter(pred);

	if (filteredArr.length > 0) return makeOk(filteredArr[0]);

	return makeFailure("No element found.");
}


const isEven = (x:number):boolean => x%2==0

export const returnSquaredIfFoundEven_v2 = (a: number[]):Result<number> => 
	bind(findResult(isEven, a), (x:number) => makeOk(x*x));


export const returnSquaredIfFoundEven_v3 = (a: number[]):number =>
	either(findResult(isEven, a), (x:number) => x*x, (x) => -1);

