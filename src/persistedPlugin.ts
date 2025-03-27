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

/**
 * 存储配置接口，定义了与存储操作相关的属性和方法。
 * 该接口规定了存储介质、存储键以及进行存储状态获取、设置和移除的方法。
 */
interface StorageConfig {
	/**
	 * 存储介质，用于保存和读取状态数据。
	 * 默认使用浏览器的 localStorage 进行存储。
	 */
	storage?: Storage;
	/**
	 * 存储键，用于在存储介质中唯一标识存储的状态数据。
	 * 默认值为 "__VUEX_PERSIST_PLUGIN__"。
	 */
	storageKey?: string;
	/**
	 * 从指定的存储介质中根据给定的键获取状态数据的函数。
	 * @param storage - 存储介质对象，如 localStorage 或 sessionStorage。
	 * @param key - 用于检索状态数据的键。
	 * @returns 存储的状态数据对象，如果未找到则返回 null。
	 */
	getState?: (storage: Storage, key: string) => Record<string, unknown> | null;
	/**
	 * 将状态数据保存到指定存储介质中指定键的函数。
	 * @param storage - 存储介质对象，如 localStorage 或 sessionStorage。
	 * @param key - 用于存储状态数据的键。
	 * @param value - 要存储的状态数据。
	 */
	setState?: (storage: Storage, key: string, value: unknown) => void;
	/**
	 * 从指定的存储介质中移除指定键对应状态数据的函数。
	 * @param storage - 存储介质对象，如 localStorage 或 sessionStorage。
	 * @param key - 要移除状态数据的键。
	 */
	removeState?: (storage: Storage, key: string) => void;
}

/**
 * 路径配置对象接口，用于指定需要持久化的状态路径，并继承了存储配置相关属性和方法。
 * 该接口允许开发者指定要持久化的状态路径，同时复用存储配置的操作。
 */
interface Path extends StorageConfig {
	/**
	 * 要持久化的状态路径数组。
	 * 数组中的每个元素表示一个状态路径，用于指定哪些状态需要进行持久化存储。
	 */
	paths: string[];
}

/**
 * 插件选项接口，用于配置 Vuex 持久化插件的行为，继承了存储配置相关属性和方法。
 * 该接口允许开发者自定义持久化的路径、过滤 mutation 的规则以及重置状态的 mutation 类型。
 */
interface Options extends StorageConfig {
	/**
	 * 路径配置数组，可以是字符串或 Path 对象。
	 * 字符串表示简单的状态路径，Path 对象则可以包含更多的存储配置信息。
	 */
	paths: (string | Path)[];
	/**
	 * 过滤 mutation 的函数，用于决定哪些 mutation 需要触发状态保存操作。
	 * 如果该函数返回 true，则对应的 mutation 会触发状态保存；否则不触发。
	 * @param mutation - Vuex 的 mutation 负载对象。
	 * @returns 一个布尔值，表示是否允许该 mutation 触发状态保存。
	 */
	mutationFilter: (mutation: MutationPayload) => boolean;
	/**
	 * 重置状态的 mutation 类型。
	 * 当触发该类型的 mutation 时，插件会执行相应的重置状态操作。
	 */
	resetMutationType: string;
}

/**
 * 创建一个 Vuex 持久化插件
 * @param options 插件配置选项
 * @returns 一个 Vuex 插件函数
 */
export function persistedPlugin<S>(options: Partial<Options> = {}) {
	// 解构赋值获取配置选项，使用默认值填充未提供的选项
	const {
		paths = [],
		storage = DEFAULT_STORAGE,
		storageKey = DEFAULT_STORAGE_KEY,
		// 从存储中获取状态的函数，处理 JSON 解析可能的错误
		getState = (storage, key) => {
			try {
				const item = storage.getItem(key);
				return item ? JSON.parse(item) : null;
			} catch (error) {
				console.error(`Error parsing storage data for key ${key}:`, error);
				return null;
			}
		},
		// 将状态保存到存储的函数，处理存储可能的错误
		setState = (storage, key, value) => {
			try {
				storage.setItem(key, JSON.stringify(value));
			} catch (error) {
				console.error(`Error setting storage data for key ${key}:`, error);
			}
		},
		// 从存储中移除状态的函数，处理移除可能的错误
		removeState = (storage, key) => {
			try {
				storage.removeItem(key);
			} catch (error) {
				console.error(`Error removing storage data for key ${key}:`, error);
			}
		},
		// 过滤 mutation 的函数，默认允许所有 mutation
		mutationFilter = (mutation) => true,
		// 重置状态的 mutation 类型
		resetMutationType = RESET_MUTATION_TYPE,
	} = options;

	// 统一处理字符串类型的路径配置
	let unifyStringPath: Required<Path> = {
		storage,
		storageKey,
		getState,
		setState,
		removeState,
		paths: [],
	};
	// 统一处理后的路径配置数组
	let unifyPaths: Required<Path>[] = [];

	// 遍历 paths 数组，将字符串类型的路径添加到 unifyStringPath 中，将对象类型的路径合并处理
	paths.forEach((path) => {
		if (typeof path === "string") {
			// 检查 path 是否已经存在于 unifyStringPath.paths 中
			if (!unifyStringPath.paths.includes(path)) {
				unifyStringPath.paths.push(path);
			}
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
	// 将统一处理后的字符串路径配置添加到 unifyPaths 数组中
	unifyPaths.push(unifyStringPath);

	// 返回一个 Vuex 插件函数
	return (store: Store<S>) => {
		// 深克隆初始状态，用于重置状态时使用
		let initState = deepClone(store.state);

		// 从存储中获取保存的状态，并合并到一个对象中
		let saveState = unifyPaths.reduce((acc, cur) => {
			const { storage, storageKey, getState } = cur;
			return deepMerge(acc, getState(storage, storageKey!) || {});
		}, {});

		// 如果保存的状态不为空，将其合并到当前 store 的状态中
		if (!isEmpty(saveState)) {
			store.replaceState(deepMerge(store.state, saveState) as S);
		}

		// 注册一个重置状态的模块
		store.registerModule(resetMutationType, {
			mutations: {
				// 重置状态的 mutation 处理函数
				[resetMutationType](state, payload) {

				},
			},
		});

		// 订阅 store 的 mutation，当 mutation 触发时执行相应逻辑
		store.subscribe((mutation, state) => {
			if (mutation.type === resetMutationType) {
				let mutationState = deepClone(state);
				if (!mutation.payload) {
					// 如果没有提供 payload，移除所有存储的状态，并将 store 状态重置为初始状态
					unifyPaths.forEach((path) => {
						const { storage, storageKey, removeState } = path;
						removeState(storage, storageKey);
					});
					store.replaceState(deepMerge(state, initState) as S);
				} else {
					// 如果提供了 payload，根据 payload 合并状态并保存到存储中
					const mutationMergeState = deepMerge(
						mutationState,
						reducerState(initState as Record<string, unknown>, mutation.payload)
					);
					unifyPaths.forEach((path) => {
						const { storage, storageKey, getState, setState, paths } = path;
						let savedKey = getState(storage, storageKey) || {};
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

			// 如果触发的是不是重置状态的 mutation 且 mutation 通过了过滤函数
			if (mutationFilter(mutation)) {
				// 将当前状态保存到存储中
				unifyPaths.forEach((path) => {
					const { storage, storageKey, getState, setState, paths } = path;
					let savedKey = getState(storage, storageKey) || {};
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