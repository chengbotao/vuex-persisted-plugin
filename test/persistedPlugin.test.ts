/*
 * @Author: Chengbotao
 * @Contact: https://github.com/chengbotao
 */
import { createStore } from "vuex";
import { persistedPlugin } from "../src/index";

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
	plugins:[persistedPlugin({
		paths: ["count"]
	})]
});

describe("persistedPlugin", () => {
	it("should persist state to local storage", async () => {
		store.commit("increment");
		expect(store.state.count).toBe(1);
		expect(JSON.parse(localStorage.getItem("__VUEX_PERSIST_PLUGIN__")!).count).toBe(1);
	});
	it("should restore state from local storage", async () => {
		const store1 = createStore({
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
			plugins:[persistedPlugin({
				paths: ["count"]
			})]
		});
		expect(store1.state.count).toBe(1);
		expect(JSON.parse(localStorage.getItem("__VUEX_PERSIST_PLUGIN__")!).count).toBe(1);
	})
});
