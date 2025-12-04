// 从Redux Toolkit导入用于创建store和获取默认中间件集合的函数
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
// 导入用于将Redux状态与浏览器localStorage同步的简易工具函数
import { save, load } from 'redux-localstorage-simple';

// 导入自定义工具函数，用于获取用户此前保存的主题偏好（如深色/浅色模式）
import { getThemeCache } from '_utils/theme';
// 导入各个功能模块的reducer（归约器），每个reducer负责管理状态树的一个独立分支
import application from './application/reducer'; // 应用级全局状态（如弹窗、区块号）
// 导入一个全局动作创建函数，用于在应用启动或版本更新时派发特定动作
import { updateVersion } from './global/actions';
// 导入reducer时，一并导入它们导出的状态类型（假设你的reducer文件有导出）
import user, { UserState } from './user/reducer'; // 用户相关状态及其类型
import transactions, { TransactionState } from './transactions/reducer'; // 交易状态及其类型
import swap from './swap/reducer'; // 代币兑换相关状态
import mint from './mint/reducer'; // 添加流动性相关状态
import lists from './lists/reducer'; // 代币列表和交易对列表的状态
import burn from './burn/reducer'; // 移除流动性相关状态
import multicall from './multicall/reducer'; // 批量合约调用结果的状态
import toasts from './toasts'; // 全局Toast通知消息的状态

// 定义需要持久化存储到localStorage的状态切片（slice）名称数组
// 这里指定只持久化`user`和`transactions`两个切片，避免存储过大或敏感数据
const PERSISTED_KEYS: string[] = ['user', 'transactions'];

// *** 修复核心：定义与Reducer类型完全匹配的持久化状态接口 ***
interface PersistedState {
  user?: UserState; // 使用从reducer导入的精确类型，并设为可选
  transactions?: TransactionState; // 同上
}

// 尝试从localStorage加载之前持久化的状态，并使用新定义的精确定义类型
const loadedState = load({ states: PERSISTED_KEYS }) as PersistedState;

// 如果成功加载到`user`状态，则将其主题模式（userDarkMode）更新为最新的缓存值
// 这确保了应用重启后，UI主题能与用户最后一次的选择保持一致
// 注意：由于类型已精确，现在可以直接安全地访问和修改 `userDarkMode` 属性。
if (loadedState && loadedState.user) {
  loadedState.user.userDarkMode = getThemeCache();
}

// 使用Redux Toolkit的`configureStore`函数创建应用的中央状态仓库（store）
const store = configureStore({
  // `reducer`对象定义了状态树的结构，键名对应状态切片，键值是对应的reducer函数
  reducer: {
    application, // 管理应用级别的通用状态
    user, // 管理用户账户和设置
    transactions, // 管理所有交易的生命周期和记录
    swap, // 管理代币兑换页面的状态
    mint, // 管理流动性添加页面的状态
    burn, // 管理流动性移除页面的状态
    multicall, // 管理多合约调用（Multicall）的缓存和结果
    lists, // 管理从外部加载的代币列表和配对列表
    toasts, // 管理全局通知消息的队列和显示
  },
  // 配置store使用的中间件：保留默认中间件（但禁用Redux Thunk），并追加状态持久化中间件
  middleware: [...getDefaultMiddleware({ thunk: false }), save({ states: PERSISTED_KEYS })],
  // 将刚从localStorage加载并处理过的状态作为store的初始预加载状态
  // 现在loadedState的类型与reducer的期望类型完全兼容
  preloadedState: loadedState,
});

// 在store创建后立即派发一个“更新版本”的动作
// 这通常用于在应用启动时执行一次性的数据迁移或初始化逻辑
store.dispatch(updateVersion());

// 导出创建好的store实例，供React应用最外层的Provider使用
export default store;

// 导出从store实例推断出的两个重要TypeScript类型，以增强代码的类型安全性
// AppState: 代表整个Redux状态树的根类型，用于`useSelector`等场景
export type AppState = ReturnType<typeof store.getState>;
// AppDispatch: 代表store的`dispatch`方法的类型，用于类型化异步动作或自定义dispatch
export type AppDispatch = typeof store.dispatch;
