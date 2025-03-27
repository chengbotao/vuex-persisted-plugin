import { Store, MutationPayload } from 'vuex';

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
declare function persistedPlugin<S>(options?: Partial<Options>): (store: Store<S>) => void;

export { persistedPlugin };
