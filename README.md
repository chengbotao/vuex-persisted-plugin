# vuex-persisted-plugin

`Vuex` 的状态持久化插件,默认是使用 `Window.Storage` 来实现,  
插件也支持自定义 `storage`, 自定义的`storage`的方法须是同步

## 安装

```sh
#PNPM
pnpm add vuex-persisted-plugin

# NPM
npm install vuex-persisted-plugin

# YARN
yarn add vuex-persisted-plugin
```

## 属性&方法

|属性|说明|
|---|---|
|`paths`||
|`storage`||
|`storageKey`||
|`getState`||
|`setState`||
|`removeState`||
|`mutationFilter`||
|`resetMutationType`||
