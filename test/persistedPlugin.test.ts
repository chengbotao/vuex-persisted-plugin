/*
 * @Author: Chengbotao
 * @Contact: https://github.com/chengbotao
 */
import { createStore } from "vuex";
import { persistedPlugin } from "../src/index";
import { localStore, sessionStore } from "@manzhixing/web-storage-adapter";

const store = createStore({
	state() {
		return {
			count: 0,
		};
	},
	mutations: {
		increment(state: any) {
			state.count += 1;
		},
	},
	plugins: [
		persistedPlugin({
			paths: ["count"],
		}),
	],
});

describe("persistedPlugin", () => {
	it("持久化数据基础使用", () => {
		store.commit("increment");
		expect(store.state.count).toBe(1);
		expect(
			JSON.parse(localStorage.getItem("__VUEX_PERSIST_PLUGIN__")!).count
		).toBe(1);
	});
	it("重新实例化 Store，验证持久化数据", async () => {
		const store = createStore({
			state() {
				return {
					count: 0,
				};
			},
			mutations: {
				increment(state: any) {
					state.count += 1;
				},
			},
			plugins: [
				persistedPlugin({
					paths: ["count"],
				}),
			],
		});
		expect(store.state.count).toBe(1);
		expect(
			JSON.parse(localStorage.getItem("__VUEX_PERSIST_PLUGIN__")!).count
		).toBe(1);
	});
	it("持久化参数配置：storage", async () => {
		const store = createStore({
			state() {
				return {
					count: 0,
				};
			},
			mutations: {
				increment(state: any) {
					state.count += 1;
				},
			},
			plugins: [
				persistedPlugin({
					storage: sessionStorage,
					paths: ["count"],
				}),
			],
		});
		store.commit("increment");
		expect(store.state.count).toBe(1);
		expect(
			JSON.parse(sessionStorage.getItem("__VUEX_PERSIST_PLUGIN__")!).count
		).toBe(1);
	});
	it("持久化参数配置：storageKey", async () => {
		const store = createStore({
			state() {
				return {
					count: 0,
				};
			},
			mutations: {
				increment(state: any) {
					state.count += 1;
				},
			},
			plugins: [
				persistedPlugin({
					storage: sessionStorage,
					storageKey: "__PERSIST_PLUGIN__",
					paths: ["count"],
				}),
			],
		});
		store.commit("increment");
		expect(store.state.count).toBe(1);
		expect(
			JSON.parse(sessionStorage.getItem("__PERSIST_PLUGIN__")!).count
		).toBe(1);
	});
	it("持久化参数配置：对不同State保存在不同Storage", async () => {
		const store = createStore({
			state() {
				return {
					count: 0,
					userInfo: {
						name: "chengbotao",
						email: "chengbotao5221@163.com",
					},
				};
			},
			mutations: {
				increment(state: any) {
					state.count += 1;
				},
				updateUserInfo(state: any) {
					state.userInfo.name = "botaocheng";
				},
			},
			plugins: [
				persistedPlugin({
					storage: sessionStorage,
					storageKey: "__PERSIST_PLUGIN_1__",
					paths: [
						"count",
						{
							paths: ["userInfo.name"],
							storage: localStorage,
						},
					],
				}),
			],
		});
		store.commit("increment");
		store.commit("updateUserInfo");
		expect(store.state.count).toBe(1);
		expect(store.state.userInfo.name).toBe("botaocheng");
		expect(
			JSON.parse(sessionStorage.getItem("__PERSIST_PLUGIN_1__")!).count
		).toBe(1);
		expect(
			JSON.parse(localStorage.getItem("__PERSIST_PLUGIN_1__")!).userInfo.name
		).toBe("botaocheng");
	});
	it("持久化参数配置：getState setState removeState", async () => {
		const store = createStore({
			state() {
				return {
					count: 0,
					userInfo: {
						name: "chengbotao",
						email: "chengbotao5221@163.com",
					},
				};
			},
			mutations: {
				increment(state: any) {
					state.count += 1;
				},
				updateUserInfo(state: any) {
					state.userInfo.name = "botaocheng";
				},
			},
			plugins: [
				persistedPlugin({
					storage: localStore,
					storageKey: "__PERSIST_PLUGIN_2__",
					paths: [
						"count",
						{
							paths: ["userInfo.name"],
							storage: sessionStore,
						},
					],
					getState(storage, key) {
						return storage.get(key) as Record<string, unknown>;
					},
					setState(storage, key, value) {
						storage.set(key, value);
					},
					removeState(storage, key) {
						storage.remove(key);
					},
				}),
			],
		});
		store.commit("increment");
		store.commit("updateUserInfo");
		expect(store.state.count).toBe(1);
		expect(store.state.userInfo.name).toBe("botaocheng");
		expect(localStore.get("__PERSIST_PLUGIN_2__").count).toBe(1);
		expect(sessionStore.get("__PERSIST_PLUGIN_2__").userInfo.name).toBe(
			"botaocheng"
		);
	});
	it("持久化参数配置：__RESET_STATE__ 重置持久化状态", async () => {
		const store = createStore({
			state() {
				return {
					count: 0,
					userInfo: {
						name: "chengbotao",
						email: "chengbotao5221@163.com",
					},
				};
			},
			mutations: {
				increment(state: any) {
					state.count += 1;
				},
				updateUserInfo(state: any) {
					state.userInfo.name = "botaocheng";
				},
				updateUserInfo1(state: any) {
					state.userInfo.email = "chengbotao5221@gmail.com";
				},
			},
			plugins: [
				persistedPlugin({
					storage: localStore,
					storageKey: "__PERSIST_PLUGIN_4__",
					paths: [
						"count",
						{
							paths: ["userInfo"],
							storage: sessionStore,
						},
					],
					removeState(storage, key) {
						storage.remove(key);
					},
				}),
			]
		});
		store.commit("increment");
		store.commit("updateUserInfo");
		store.commit("updateUserInfo1");
		store.commit("__RESET_STATE__");
		expect(store.state.count).toBe(0);
		expect(store.state.userInfo.name).toBe("chengbotao");
		expect(store.state.userInfo.email).toBe("chengbotao5221@163.com");
	})
	it("持久化参数配置：__RESET_STATE__ 重置指定持久化状态", async () => {
		const store = createStore({
			state() {
				return {
					count: 0,
					userInfo: {
						name: "chengbotao",
						email: "chengbotao5221@163.com",
					},
				};
			},
			mutations: {
				increment(state: any) {
					state.count += 1;
				},
				updateUserInfo(state: any) {
					state.userInfo.name = "botaocheng";
				},
				updateUserInfo1(state: any) {
					state.userInfo.email = "chengbotao5221@gmail.com";
				},
			},
			plugins: [
				persistedPlugin({
					storage: localStore,
					storageKey: "__PERSIST_PLUGIN_4__",
					paths: [
						"count",
						{
							paths: ["userInfo"],
							storage: sessionStore,
						},
					],
					removeState(storage, key) {
						storage.remove(key);
					},
				}),
			]
		});
		store.commit("increment");
		store.commit("updateUserInfo");
		store.commit("updateUserInfo1");
		store.commit("__RESET_STATE__", ["userInfo.name"]);
		expect(store.state.count).toBe(1);
		expect(store.state.userInfo.name).toBe("chengbotao");
		expect(store.state.userInfo.email).toBe("chengbotao5221@gmail.com");
	})
});
