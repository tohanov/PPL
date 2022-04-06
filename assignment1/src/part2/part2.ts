import * as R from "ramda";

const stringToArray = R.split("");

/* Question 1 */
export const countLetters: (s: string) => {} = undefined

/* Question 2 */
export const isPaired: (s: string) => boolean = undefined

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

