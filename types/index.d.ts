import { Store, MutationPayload } from 'vuex';

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
declare function persistedPlugin<S>(options: Options): (store: Store<S>) => void;

export { persistedPlugin };
