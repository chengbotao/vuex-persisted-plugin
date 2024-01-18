/*
 * @Author: Chengbotao
 * @Contact: https://github.com/chengbotao
 */
import type { Store, MutationPayload } from "vuex";
import {
	deepClone,
	deepMerge,
	reducerState,
	isEmpty,
	isPlainObject,
} from "./utils";

const DEFAULT_STORAGE = localStorage;
const DEFAULT_STORAGE_KEY = "__VUEX_PERSIST_PLUGIN__";
interface Path {
	paths: string[];
	storage?: Storage;
	storageKey?: string;
	getState?: (storage: Storage, key: string) => Record<string, unknown>;
	setState?: (storage: Storage, key: string, value: unknown) => void;
}
interface Options {
	paths: (string | Path)[];
	storage?: Storage;
	storageKey?: string;
	getState?: (storage: Storage, key: string) => Record<string, unknown>;
	setState?: (storage: Storage, key: string, value: unknown) => void;
	mutationFilter?: (mutation: MutationPayload) => boolean;
}
export function persistedPlugin<S>(options: Options) {
	const {
		storage = DEFAULT_STORAGE,
		storageKey = DEFAULT_STORAGE_KEY,
		getState = (storage, key) => {
			return storage.getItem(key) && JSON.parse(storage.getItem(key)!);
		},
		setState = (storage, key, value) => {
			storage.setItem(key, JSON.stringify(value));
		},
		mutationFilter = (mutation) => true,
	} = options;
	let unifyStringPath: Required<Path> = {
		storage,
		storageKey,
		getState,
		setState,
		paths: [],
	};
	let unifyPaths: Required<Path>[] = [];
	options.paths.forEach((path) => {
		if (typeof path === "string") {
			unifyStringPath.paths.push(path);
		} else if (isPlainObject(path)) {
			unifyPaths.push(
				Object.assign({}, { storage, storageKey, getState, setState }, path)
			);
		}
	});
	unifyPaths.push(unifyStringPath);

	return (store: Store<S>) => {
		let initState = deepClone(store.state);

		let saveState = unifyPaths.reduce((acc, cur) => {
			const { storage, storageKey, getState } = cur;
			return deepMerge(acc, getState(storage, storageKey!));
		}, {});
		if (!isEmpty(saveState)) {
			store.replaceState(deepMerge(store.state, saveState) as S);
		}
		store.subscribe((mutation, state) => {
			let mutationState = deepClone(state);
			
			if (mutationFilter(mutation)) {
				unifyPaths.forEach((path) => {
					const { storage, storageKey, getState, setState, paths } = path;
					let savedKey = getState(storage, storageKey);
					setState(
						storage,
						storageKey,
						deepMerge(
							savedKey,
							reducerState(state as Record<string, unknown>, paths)
						)
					);
				});
			}
		});
	};
}
