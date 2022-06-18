export const MISSING_KEY = '___MISSING_KEY___'
export const MISSING_TABLE_SERVICE = '___MISSING_TABLE_SERVICE___'

export type Table<T> = Readonly<Record<string, Readonly<T>>>

export type TableService<T> = {
	get(key: string): Promise<T>;
	set(key: string, val: T): Promise<void>;
	delete(key: string): Promise<void>;
}

// Q 2.1 (a)
export function makeTableService<T>(sync: (table?: Table<T>) => Promise<Table<T>>): TableService<T> {
	// optional initialization code

	const filterOutKeyFromTable = (table: Table<T>, key: string) => Object.keys(table)
		.filter(key2 => key2 !== key)
		.reduce(
			(obj, k) => Object.assign(obj, { [k]: table[k] }),
			{}
		);

	return {
		get(key: string): Promise<T> {
			return sync()
				.then(
					(table) => new Promise(
						(resolve, reject) => {
							// const item = table[key];

							if (key in table) resolve(table[key]);
							else reject(MISSING_KEY);
						}
					)
				);
		},

		set(key: string, val: T): Promise<void> {
			return sync()
				.then( 
					(table) => new Promise( 
						(resolve, reject) => {
							const tableWithoutSelectedKey = filterOutKeyFromTable(table, key);

							// console.log("HERE: " + JSON.stringify(newTable));
							
							const newTable = Object.assign({}, tableWithoutSelectedKey, { [key]: val })

							// console.log("HERE: " + JSON.stringify(newTable));

							sync(newTable).then(_ => resolve());
						}
					)
				)
		},

		delete(key: string): Promise<void> {
			return sync()
				.then(
					(table) => new Promise( 
						(resolve, reject) => {

							const handleKeyExists = (_: T) => new Promise( _ => {
									// create a new table without the deleted key
									const newTable = filterOutKeyFromTable(table, key);

									sync(newTable).then(_ => resolve());
								})

							this.get(key)
								.then( handleKeyExists ) // if key exists - effectively delete it
								.catch(err => new Promise((_, reject) => reject(err))) // if doesn't exist, throw
						}
					)
				)
		}
	}
}

// Q 2.1 (b)
export function getAll<T>(store: TableService<T>, keys: string[]): Promise<T[]> {
	// return Promise.reject('not implemented')
	return Promise.all(keys.map(key => store.get(key)));
}


// Q 2.2
export type Reference = { table: string, key: string }

export type TableServiceTable = Table<TableService<object>>

export function isReference<T>(obj: T | Reference): obj is Reference {
	return typeof obj === 'object' && 'table' in obj
}

export async function constructObjectFromTables(tables: TableServiceTable, ref: Reference) {

	
	const waitingList = []

	async function deref(ref: Reference) {
		// return Promise.reject('not implemented')

		if ( ! (ref.table in tables)) { // referenced table doesn't exist
			return Promise.reject(MISSING_TABLE_SERVICE);
		}

		const requestedObject = await tables[ref.table].get(ref.key);

		const dereferencedRequestedObject = Object.fromEntries(await Object.entries(requestedObject)
			.reduce( // used async so it would be possible to use await inside; therefore needed to use a promise as an accumulator, therefore needed to use resolve as a return statement
				async (accumulatorPromise : Promise<[string, any][]>, [key, value]) : Promise<[string,any][]> => {
					const accumulator = await accumulatorPromise;
					return Promise.resolve(accumulator.concat([[key, isReference(value) ? await deref(value) : value]]))
				},
				Promise.resolve([])
			)
		)
		
		// console.log(JSON.stringify(dereferencedRequestedObject))

		return Promise.resolve(dereferencedRequestedObject);
	}

	return deref(ref)
}

// Q 2.3

export function lazyProduct<T1, T2>(g1: () => Generator<T1>, g2: () => Generator<T2>): () => Generator<[T1, T2]> {
	return function* () {
		// const generator1 = g1();
		// const generator2 = g2();

		for (const elem1 of g1()) {
			for (const elem2 of g2()) {
				yield [elem1, elem2]
			}
		}
	}
}

export function lazyZip<T1, T2>(g1: () => Generator<T1>, g2: () => Generator<T2>): () => Generator<[T1, T2]> {
	return function* () {
		const generator1 = g1();
		const generator2 = g2();

		while (true) {
			
			const generatorInfo1 = generator1.next();
			const generatorInfo2 = generator2.next();

			if (generatorInfo1.done || generatorInfo2.done) {
				return;
			}

			yield [generatorInfo1.value, generatorInfo2.value];
		}
	}
}

// Q 2.4
export type ReactiveTableService<T> = {
	get(key: string): T;
	set(key: string, val: T): Promise<void>;
	delete(key: string): Promise<void>;
	subscribe(observer: (table: Table<T>) => void): void
}

export async function makeReactiveTableService<T>(sync: (table?: Table<T>) => Promise<Table<T>>, optimistic: boolean): Promise<ReactiveTableService<T>> {
	// optional initialization code

	const filterOutKeyFromTable = (table: Table<T>, key: string) => Object.keys(table)
		.filter(key2 => key2 !== key)
		.reduce(
			(obj, k) => Object.assign(obj, { [k]: table[k] }),
			{}
		);

	let mutationCallbacks : ((table: Table<T>) => void)[] = [];
	const callbackSubscribers = (newTable: Table<T>) => mutationCallbacks.map(callback => {
			// console.log("attempting to call: ", callback);
			callback(newTable);
		});

	let _table: Table<T> = await sync();
	
	const handleMutation = async (newTable: Table<T>) => {
		// TODO call the observer functions saved depending on the optimistic flag

		// if the optimistic flag is set, call observers with the received table, before calling sync with it
		if (optimistic) {
			// console.log("attempting to call all subs");
			callbackSubscribers(newTable);
		}
		// start editing table
		await sync(newTable)
		//end attempt at editing
			.then(
				table => {
					_table = table;
					// if the optimistic flag isn't set, and request succeeded, call observers
					// change table in storage if sync succeeded
					if ( ! optimistic) callbackSubscribers(_table = table);
				}
			)
			// if the optimistic flag is set and the sync request failed, call observers with the unedited table
			.catch(_ => {if (optimistic) callbackSubscribers(_table); throw '__EXPECTED_FAILURE__';});
	}

	return {
		get(key: string): T {
			if (key in _table) {
				return _table[key]
			} else {
				throw MISSING_KEY
			}
		},

		set(key: string, val: T): Promise<void> {
			const tableWithoutSelectedKey = filterOutKeyFromTable(_table, key);
						
			// console.log("before setting the key to val: ", JSON.stringify(tableWithoutSelectedKey))

			const updatedTable = Object.assign({}, tableWithoutSelectedKey, { [key]: val })

			// console.log("sending to mutation handling: ", JSON.stringify(updatedTable))

			return handleMutation(updatedTable)
		},

		delete(key: string): Promise<void> {
			if ( ! (key in _table)) handleMutation(null as any);

			const tableWithoutSelectedKey = filterOutKeyFromTable(_table, key);

			return handleMutation(tableWithoutSelectedKey)
		},

		subscribe(observer: (table: Table<T>) => void): void {
			// add observer to subscribers' database
			
			// console.log("before pushing new callback: ", JSON.stringify(mutationCallbacks))
			mutationCallbacks.push(observer);
			// console.log("after pushing new callback: ", JSON.stringify(mutationCallbacks))
		}
	}
}