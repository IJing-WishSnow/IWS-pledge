import URL from '_constants/URL';
import axios from './dataProxy';

/**
 * 用户服务模块
 */
const userServer = {
  /**
   * 获取资金池基础信息
   * @param chainId - 区块链网络ID
   */
  getpoolBaseInfo(chainId: number) {
    return axios.get(`${URL.info.poolBaseInfo}?chainId=${chainId}`);
  },

  /**
   * 获取资金池数据信息
   * @param chainId - 区块链网络ID
   */
  getpoolDataInfo(chainId: number) {
    return axios.get(`${URL.info.poolDataInfo}?chainId=${chainId}`);
  },
};

export default userServer;
