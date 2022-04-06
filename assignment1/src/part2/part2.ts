import * as R from "ramda";

const stringToArray = R.split("");

/* Question 1 */
export const countLetters: (s: string) => {} =(s)=>{
   return R.countBy((s_: string)=> R.toLower(s_))(R.filter((letter)=> letter!==" ",stringToArray(s)))
};

/* Question 2 */
export const isPaired: (s: string) => boolean = R.pipe(
        (sTA: string) => {return stringToArray(sTA); },
        (find: string[]) => find.reduce((acc, cur) => cur === ')' ? (acc[0] === '(' ? R.drop(1, acc):R.concat(["F"], acc)):
            cur === ']' ? (acc[0] === '[' ? R.drop(1, acc): R.concat(["F"], acc)):
            cur === '}' ? (acc[0] === '{' ? R.drop(1, acc): R.concat(["F"], acc)):
            cur === '(' ? R.concat([cur], acc):
            cur === '[' ? R.concat([cur], acc):
            cur === '{' ? R.concat([cur], acc):
            acc, [""]),
        (toReturn: string[]) => { return toReturn.length === 1 }
    );

/* Question 3 */
export interface WordTree {
    root: string;
    children: WordTree[];
}

export const treeToSentence = (t: WordTree): string =>
	t.root + t.children.reduce(
		(sentence:string, child:WordTree) => sentence+" "+treeToSentence(child),
		""
	);

