// 导入用户相关的后端API服务模块（如登录、获取资金池信息）
import userServer from './userServer';
// 导入Web3实例或配置，提供与区块链交互的基础能力
// import { web3 } from './web3';
// ... 依次导入其他的 server module

// 导入BSC链上质押预言机相关服务，可能用于获取链上价格、数据等
import BscPledgeOracleServer from './BscPledgeOracle';
// 导入ERC20标准代币相关服务，用于与以太坊生态ERC20代币合约交互
import ERC20Server from './ERC20Server';
// 导入借贷资金池相关服务，处理池子的核心业务逻辑
import PoolServer from './PoolServer';
// 导入IBEP20标准代币相关服务，用于与币安智能链BEP20代币合约交互
import IBEP20Server from './IBEP20Server';

// 默认导出：聚合所有服务模块，形成一个统一的服务访问入口
// 在应用中可通过 `services.userServer.getpoolBaseInfo()` 等方式调用
export default {
  userServer,
  PoolServer,
  BscPledgeOracleServer,
  ERC20Server,
  IBEP20Server,
};
