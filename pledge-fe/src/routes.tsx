import React, { Suspense } from 'react'; // 导入React及其Suspense组件，用于处理懒加载时的加载状态
import { Route, Switch } from 'react-router-dom'; // 导入React Router的路由和切换组件，用于定义路由和匹配规则

import pageURL from '_constants/pageURL'; // 导入页面URL常量，集中管理所有路由路径
import Landing from '_src/pages/Dapp'; // 导入Landing组件，作为多个路由的共用页面组件

// 路由映射配置数组，定义所有路由路径、对应组件及匹配规则
const routeMap = [
  {
    path: pageURL.Dapp, // Dapp页面路径
    component: Landing, // 使用的组件
    exact: true, // 精确匹配路径
    dynamic: false, // 标识是否为动态路由（此处为静态路由）
  },
  {
    path: pageURL.Market, // 市场页面路径
    component: Landing,
    exact: true,
    dynamic: false,
  },
  {
    path: pageURL.Market_Pool, // 市场资金池页面路径
    component: Landing,
    exact: true,
    dynamic: false,
  },
  {
    path: pageURL.Lend_Borrow, // 借贷页面路径
    component: Landing,
    exact: true,
    dynamic: false,
  },
  {
    path: pageURL.DEX_Swap, // 去中心化交易所兑换页面路径
    component: Landing,
    exact: true,
    dynamic: false,
  },
  {
    path: pageURL.DEX_Pool, // 去中心化交易所资金池页面路径
    component: Landing,
    exact: true,
    dynamic: false,
  },
  {
    path: pageURL.Find, // 查找页面路径
    component: Landing,
    exact: true,
    dynamic: false,
  },
  {
    path: pageURL.Add, // 添加页面路径（通用）
    component: Landing,
    exact: true,
    dynamic: true, // 标识为动态路由（可能包含参数）
  },
  {
    path: pageURL.Add_Single, // 单币添加页面路径
    component: Landing,
    exact: true,
    dynamic: false,
  },
  {
    path: pageURL.Add_Double, // 双币添加页面路径
    component: Landing,
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Remove_Tokens, // 移除代币页面路径
    component: Landing,
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Remove_Liquidity, // 移除流动性页面路径
    component: Landing,
    exact: true,
    dynamic: true,
  },
  {
    path: '*', // 通配符路径，用于匹配所有未定义的路由，显示404页面
    component: () => <div>404</div>, // 内联函数组件，渲染简单的404提示
    exact: true,
    dynamic: false,
  },
];

// 定义主路由组件，使用Suspense包裹以实现懒加载时的优雅降级
const Routes = () => (
  <Suspense fallback={null}>
    {' '}
    {/* 懒加载时的回退内容为null，即不显示任何加载指示 */}
    <Switch>
      {' '}
      {/* 使用Switch组件只渲染第一个匹配的路由 */}
      {routeMap.map(
        (
          item, // 遍历路由配置数组，为每个路由创建Route组件
        ) => (
          <Route key={item.path} path={item.path} exact={item.exact} component={item.component} />
        ),
      )}
    </Switch>
  </Suspense>
);

export default Routes; // 导出路由组件供应用使用
