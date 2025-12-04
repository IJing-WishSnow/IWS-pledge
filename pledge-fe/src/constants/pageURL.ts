/**
 * @ Author: Muniz
 * @ Create Time: 2020-06-09 19:27:48
 * @ Modified by: Muniz
 * @ Modified time: 2020-07-22 18:09:27
 * @ Description: 路由定义, 配置文件
 */

const pageURL = {
  /** 首页 */
  Dapp: '/',
  /** 市场页面，动态参数 pool */
  Market: '/:pool',
  /** 借贷页面，动态参数 mode */
  Lend_Borrow: '/Market/:mode',
  /** 市场池详情页面，包含多个动态参数 */
  Market_Pool: '/:pid/:pool/:coin/:mode',
  /** DEX交易页面（添加缺失的DEX路由） */
  DEX: '/DEX',
  /** DEX交易-Swap页面 */
  DEX_Swap: '/DEX/Swap',
  /** DEX交易-Pool页面 */
  DEX_Pool: '/DEX/Pool',
  /** 添加流动性页面 */
  Add: '/add',
  /** 查找流动性池页面 */
  Find: '/DEX/find',
  /** 单币种添加流动性页面，动态参数 currencyIdA */
  Add_Single: '/add/:currencyIdA',
  /** 双币种添加流动性页面，动态参数 currencyIdA 和 currencyIdB */
  Add_Double: '/add:currencyIdA/:currencyIdB',
  /** 移除代币页面，动态参数 tokens */
  Remove_Tokens: '/remove/:tokens',
  /** 移除流动性页面，动态参数 currencyIdA 和 currencyIdB */
  Remove_Liquidity: '/remove/:currencyIdA/:currencyIdB',
};

export default pageURL;
