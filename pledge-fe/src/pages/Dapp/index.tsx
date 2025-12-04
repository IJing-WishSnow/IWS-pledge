/* eslint-disable import/no-extraneous-dependencies */ // 禁用导入外部依赖的ESLint规则

import React, { StrictMode } from 'react'; // 导入React及其StrictMode严格模式
import 'firebase/firestore'; // 导入Firebase Firestore数据库
import { ResetCSS } from '@pancakeswap-libs/uikit'; // 导入PancakeSwap UI库的CSS重置组件

import Header from '_components/Header'; // 导入页头组件
import ToastListener from '_components/ToastListener'; // 导入Toast通知监听组件
import { WebLayout } from '_src/Layout'; // 导入Web布局组件
import ApplicationUpdater from '_src/state/application/updater'; // 导入应用状态更新器
import ListsUpdater from '_src/state/lists/updater'; // 导入列表状态更新器
import MulticallUpdater from '_src/state/multicall/updater'; // 导入多调用状态更新器
import TransactionUpdater from '_src/state/transactions/updater'; // 导入交易状态更新器
import Providers from './Providers'; // 导入应用Providers（包括Web3、Redux等）
import Routes from './routes'; // 导入路由配置
import './index.less'; // 导入全局样式

const PortfolioPage: React.FC = () => (
  // 定义PortfolioPage组件
  <StrictMode>
    {' '}
    {/* React严格模式，用于检测潜在问题 */}
    <Providers>
      {' '}
      {/* 应用Providers包裹整个应用 */}
      <>
        {' '}
        {/* React Fragment片段 */}
        <ListsUpdater /> {/* 列表状态更新器组件 */}
        <ApplicationUpdater /> {/* 应用状态更新器组件 */}
        <TransactionUpdater /> {/* 交易状态更新器组件 */}
        <MulticallUpdater /> {/* 多调用状态更新器组件 */}
        <ToastListener /> {/* Toast通知监听组件 */}
      </>
      <WebLayout className="dapp-page">
        {' '}
        {/* Web布局组件 */}
        <Header /> {/* 页头组件 */}
        <div className="dapp-router-page">
          {' '}
          {/* 路由页面容器 */}
          <ResetCSS /> {/* CSS重置组件 */}
          <Routes /> {/* 路由配置组件 */}
        </div>
      </WebLayout>
    </Providers>
  </StrictMode>
);
export default PortfolioPage; // 导出PortfolioPage组件
