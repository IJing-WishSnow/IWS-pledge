import React, { Suspense } from 'react';
import { Route, Switch } from 'react-router-dom';

// 导入路由URL常量定义
import pageURL from '_constants/pageURL';

// 导入Loading组件
import Loading from '_components/Loading';

// 导入Dapp相关页面组件
import MarketPool from '_src/pages/Dapp/Market_Pool';
import MarketMode from '_src/pages/Dapp/Market_Mode';
import Dex from '_src/pages/Dapp/Dex';
import PoolFinder from '_src/pages/Dapp/Dex/PoolFinder';
import AddLiquidity from '_src/pages/Dapp/Dex/AddLiquidity';
import RemoveLiquidity from '_src/pages/Dapp/Dex/RemoveLiquidity';

// 导入重定向组件
import { RedirectOldRemoveLiquidityPathStructure } from '_src/pages/Dapp/Dex/RemoveLiquidity/redirects';
import {
  RedirectDuplicateTokenIds,
  RedirectOldAddLiquidityPathStructure,
} from '_src/pages/Dapp/Dex/AddLiquidity/redirects';

// 导入Home组件（根据ESLint规则，此导入应放在重定向导入之后）
import DappHome from './Home';

// 路由配置映射表
const routeMap = [
  {
    path: pageURL.Dapp, // 首页路径
    component: DappHome, // 对应组件
    exact: true, // 精确匹配
    dynamic: false, // 是否为动态路由
  },
  {
    path: pageURL.Market, // 市场页面路径
    component: DappHome, // 对应组件
    exact: true,
    dynamic: false,
  },
  {
    path: pageURL.Market_Pool, // 市场池页面路径
    component: MarketPool, // 对应组件
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Lend_Borrow, // 借贷页面路径
    component: MarketMode, // 对应组件
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.DEX, // DEX页面路径
    component: Dex, // 对应组件
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Find, // 查找池页面路径
    component: PoolFinder, // 对应组件
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Add, // 添加流动性页面路径
    component: AddLiquidity, // 对应组件
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Add_Single, // 单币添加流动性页面路径
    component: RedirectOldAddLiquidityPathStructure, // 重定向组件
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Add_Double, // 双币添加流动性页面路径
    component: RedirectDuplicateTokenIds, // 重定向组件
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Remove_Tokens, // 移除代币页面路径
    component: RedirectOldRemoveLiquidityPathStructure, // 重定向组件
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Remove_Liquidity, // 移除流动性页面路径
    component: RemoveLiquidity, // 对应组件
    exact: true,
    dynamic: true,
  },
  {
    path: '*', // 404页面路径（通配符）
    component: DappHome, // 对应组件
    exact: true,
    dynamic: false,
  },
];

// 路由组件
const Routes = () => (
  // 使用Suspense处理组件懒加载，显示Loading组件作为回退
  <Suspense fallback={<Loading />}>
    {/* Switch组件确保只渲染第一个匹配的路由 */}
    <Switch>
      {routeMap.map((item) => (
        // 使用item.path作为key，避免使用数组索引
        <Route key={item.path} path={item.path} exact={item.exact} component={item.component} />
      ))}
    </Switch>
  </Suspense>
);

export default Routes;
