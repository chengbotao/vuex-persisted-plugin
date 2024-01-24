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
const RESET_MUTATION_TYPE = "__RESET_STATE__";
interface Path {
	paths: string[];
	storage?: Storage;
	storageKey?: string;
	getState?: (storage: Storage, key: string) => Record<string, unknown>;
	setState?: (storage: Storage, key: string, value: unknown) => void;
	removeState?: (storage: Storage, key: string) => void;
}
interface Options {
	paths: (string | Path)[];
	storage?: Storage;
	storageKey?: string;
	getState?: (storage: Storage, key: string) => Record<string, unknown>;
	setState?: (storage: Storage, key: string, value: unknown) => void;
	removeState?: (storage: Storage, key: string) => void;
	mutationFilter?: (mutation: MutationPayload) => boolean;
	resetMutationType?: string;
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
		removeState = (storage, key) => {
			storage.removeItem(key);
		},
		mutationFilter = (mutation) => true,
		resetMutationType = RESET_MUTATION_TYPE,
	} = options;
	let unifyStringPath: Required<Path> = {
		storage,
		storageKey,
		getState,
		setState,
		removeState,
		paths: [],
	};
	let unifyPaths: Required<Path>[] = [];
	options.paths.forEach((path) => {
		if (typeof path === "string") {
			unifyStringPath.paths.push(path);
		} else if (isPlainObject(path)) {
			unifyPaths.push(
				Object.assign(
					{},
					{ storage, storageKey, getState, setState, removeState },
					path
				)
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
		store.registerModule(resetMutationType, {
			mutations: {
				[resetMutationType](state, playload) {
					return;
				},
			},
		});
		store.subscribe((mutation, state) => {
			let mutationState = deepClone(state);
			if (mutation.type === resetMutationType) {
				if (!mutation.payload) {
					unifyPaths.forEach((path) => {
						const { storage, storageKey, removeState } = path;
						removeState(storage, storageKey);
					});
					store.replaceState(deepMerge(state, initState) as S);
				} else {
					const mutationMergeState = deepMerge(
						mutationState,
						reducerState(initState as Record<string, unknown>, mutation.payload)
					);
					unifyPaths.forEach((path) => {
						const { storage, storageKey, getState, setState, paths } = path;
						let savedKey = getState(storage, storageKey);
						setState(
							storage,
							storageKey,
							deepMerge(
								savedKey,
								reducerState(
									mutationMergeState as Record<string, unknown>,
									paths
								)
							)
						);
					});
					store.replaceState(deepMerge(state, mutationMergeState) as S);
				}
				return;
			}

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
