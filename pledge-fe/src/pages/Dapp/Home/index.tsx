/* eslint-disable import/no-extraneous-dependencies */ // 禁用导入外部依赖的ESLint规则
import React, { useCallback, useEffect, useMemo, useState } from 'react'; // 导入React核心hooks
import type { ColumnsType } from 'antd/es/table'; // 导入Ant Design表格列类型
import { Link, useHistory } from 'react-router-dom'; // 导入React Router的路由链接和导航hook
import { Dropdown, Menu, Popover, Progress, Table, Tabs, message } from 'antd'; // 导入Ant Design组件
import { DownOutlined } from '@ant-design/icons'; // 导入Ant Design图标
import { useWeb3React } from '@web3-react/core'; // 导入Web3 React hook用于区块链连接
import BigNumber from 'bignumber.js'; // 导入大数字处理库
import moment from 'moment'; // 导入日期处理库

import { FORMAT_TIME_STANDARD } from '_src/utils/constants'; // 导入时间格式常量
import { DappLayout } from '_src/Layout'; // 导入布局组件
import PageUrl from '_constants/pageURL'; // 导入页面URL常量
import Button from '_components/Button'; // 导入自定义按钮组件
import services from '_src/services'; // 导入API服务

import Lender1 from '_src/assets/images/Group 1843.png'; // 导入贷方图标
import Borrower from '_src/assets/images/Group 1842.png'; // 导入借方图标
import Close from '_assets/images/Close Square.png'; // 导入关闭图标

import './index.less'; // 导入样式文件

const { TabPane } = Tabs; // 解构Tabs组件中的TabPane

// 默认链 ID（56 = BSC 主网）
const DEFAULT_CHAIN_ID = 56;
const NO_VISIBLE_POPOVER_KEY = -1; // 弹窗不可见时的标识值

type StatusFilter = 'Live' | 'All' | 'Finished'; // 状态筛选器类型
type TokenTab = 'BUSD' | 'USDT' | 'DAI' | 'PLGR'; // 代币标签类型

interface ApiTokenInfo {
  tokenLogo: string; // 代币logo
  tokenName: string; // 代币名称
  tokenPrice: string | number; // 代币价格
}

interface ApiPoolItem {
  // eslint-disable-next-line camelcase
  pool_data: {
    // 池数据
    state: number; // 状态
    borrowTokenInfo: ApiTokenInfo; // 借贷代币信息
    lendTokenInfo: ApiTokenInfo; // 贷款代币信息
    maxSupply: string; // 最大供应量
    borrowSupply: string; // 已借贷量
    lendSupply: string; // 已贷款量
    settleTime: number; // 结算时间
    endTime: number; // 结束时间
    interestRate: string; // 利率
    autoLiquidateThreshold: string; // 自动清算阈值
    martgageRate: string; // 抵押率
    lendToken: string; // 贷款代币地址
    borrowToken: string; // 借贷代币地址
  };
}

interface PoolRecord {
  key: number; // 唯一键
  state: number; // 状态
  underlyingAsset: string; // 底层资产名称
  fixedRate: number; // 固定利率
  maxSupply: number; // 最大供应量
  borrowSupply: number; // 已借贷量
  lendSupply: number; // 已贷款量
  settlementDate: string; // 结算日期
  length: number; // 期限（天）
  marginRatio: number; // 保证金比率
  collateralizationRatio: number; // 抵押率
  poolName: string; // 池名称
  endTime: number; // 结束时间戳
  settleTime: number; // 结算时间戳
  logo: string; // 资产logo
  lendToken: string; // 贷款代币地址
  borrowToken: string; // 借贷代币地址
  borrowPrice: number; // 借贷代币价格
  lendPrice: number; // 贷款代币价格
}

const TOKEN_ADDRESS_MAP: Record<TokenTab, string[]> = {
  BUSD: ['0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', '0xE676Dcd74f44023b95E0E2C6436C97991A7497DA'], // BUSD代币地址
  USDT: [''], // USDT代币地址（暂空）
  DAI: ['0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', '0x490BC3FCc845d37C1686044Cd2d6589585DE9B8B'], // DAI代币地址
  PLGR: ['0x6Aa91CbfE045f9D154050226fCc830ddbA886CED'], // PLGR代币地址
};

// 工具函数：按精度缩放链上原始数值
const fromDecimals = (value: BigNumber.Value, decimals: number): number =>
  new BigNumber(value || 0).dividedBy(new BigNumber(10).pow(decimals)).toNumber(); // 将代币最小单位转换为标准单位

// 工具函数：格式化千位分隔
const toThousands = (value: BigNumber.Value): string => {
  const num = new BigNumber(value || 0);
  const [integer, decimal] = num.toFixed(6).split('.'); // 固定6位小数
  const formattedInt = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ','); // 千位分隔
  return decimal && Number(decimal) !== 0 ? `${formattedInt}.${decimal}` : formattedInt; // 保留小数部分
};

/* eslint-disable no-unused-vars */
interface CollateralActionCellProps {
  record: PoolRecord; // 当前行数据
  popoverContent: React.ReactNode; // 弹窗内容
  isPopoverVisible: boolean; // 弹窗是否可见
  // 触发弹窗时回调当前行，供父组件记录
  onDetailClick: (record: PoolRecord) => void;
  // 关闭或打开弹层时向父级同步状态
  onPopoverVisibleChange: (rowKey: number, visible: boolean) => void;
}

const CollateralActionCell: React.FC<CollateralActionCellProps> = ({
  record,
  popoverContent,
  isPopoverVisible,
  onDetailClick,
  onPopoverVisibleChange,
}) => {
  const handleVisibleChange = useCallback(
    (visible: boolean) => {
      onPopoverVisibleChange(record.key, visible); // 弹窗可见性变化回调
    },
    [onPopoverVisibleChange, record.key],
  );

  const handleDetail = useCallback(() => {
    onDetailClick(record); // 详情点击回调
  }, [onDetailClick, record]);

  return (
    <div className="collateralization-cell">
      <span>{`${record.collateralizationRatio}%`}</span> {/* 显示抵押率 */}
      <Popover
        content={popoverContent}
        title="Choose a Role"
        trigger="click"
        visible={isPopoverVisible}
        onVisibleChange={handleVisibleChange}
      >
        <Button className="detail-button" onClick={handleDetail}>
          Detail
        </Button>
      </Popover>
    </div>
  );
};

interface MobileAssetCellProps {
  record: PoolRecord;
  popoverContent: React.ReactNode;
  isPopoverVisible: boolean;
  onDetailClick: (record: PoolRecord) => void;
  onPopoverVisibleChange: (rowKey: number, visible: boolean) => void;
}
/* eslint-enable no-unused-vars */

const MobileAssetCell: React.FC<MobileAssetCellProps> = ({
  record,
  popoverContent,
  isPopoverVisible,
  onDetailClick,
  onPopoverVisibleChange,
}) => {
  const handleVisibleChange = useCallback(
    (visible: boolean) => {
      onPopoverVisibleChange(record.key, visible); // 弹窗可见性变化回调
    },
    [onPopoverVisibleChange, record.key],
  );

  const handleClick = useCallback(() => {
    onDetailClick(record); // 详情点击回调
  }, [onDetailClick, record]);

  return (
    <Popover
      content={popoverContent}
      title="Choose a Role"
      trigger="click"
      visible={isPopoverVisible}
      onVisibleChange={handleVisibleChange}
    >
      <button type="button" className="asset-trigger" onClick={handleClick}>
        <img src={record.logo} alt={record.underlyingAsset} /> {/* 资产图标 */}
        <span className="asset-trigger__label">{record.underlyingAsset}</span> {/* 资产名称 */}
      </button>
    </Popover>
  );
};

function HomePage() {
  const history = useHistory(); // 路由历史对象
  const { chainId } = useWeb3React(); // 当前区块链网络ID
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Live'); // 状态筛选器状态
  const [allPools, setAllPools] = useState<PoolRecord[]>([]); // 所有池数据
  const [activePopoverKey, setActivePopoverKey] = useState<number>(NO_VISIBLE_POPOVER_KEY); // 当前激活的弹窗key
  const [selectedCoin, setSelectedCoin] = useState<string>(''); // 选中的代币
  const [selectedPid, setSelectedPid] = useState<number>(0); // 选中的池ID
  const [activePoolSymbol, setActivePoolSymbol] = useState<TokenTab>('BUSD'); // 当前活跃的池代币符号

  // 获取筛选结果，避免重复 filter
  const filterByStatus = useCallback((rows: PoolRecord[], status: StatusFilter) => {
    if (status === 'All') {
      return rows; // 返回所有数据
    }
    if (status === 'Live') {
      return rows.filter((row) => row.state < 1); // 筛选进行中的池
    }
    return rows.filter((row) => row.state >= 1); // 筛选已结束的池
  }, []);

  const statusFilteredPools = useMemo(
    () => filterByStatus(allPools, statusFilter), // 状态筛选后的池数据
    [allPools, filterByStatus, statusFilter],
  );

  const filterByToken = useCallback((rows: PoolRecord[], token: TokenTab) => {
    const addresses = TOKEN_ADDRESS_MAP[token] || []; // 获取代币地址列表
    if (!addresses.length) {
      return rows; // 地址为空时返回所有
    }
    return rows.filter((row) => addresses.includes(row.lendToken)); // 筛选代币
  }, []);

  const getTargetChainId = useCallback(() => chainId ?? DEFAULT_CHAIN_ID, [chainId]); // 获取目标链ID，默认为BSC主网

  // 拉取池子数据
  const getPoolInfo = useCallback(async (targetChainId: number) => {
    try {
      const response = await services.userServer.getpoolBaseInfo(targetChainId); // 调用API获取池数据
      const mapped: PoolRecord[] = (response?.data?.data ?? []).map((item: ApiPoolItem, index: number) => {
        const { pool_data: poolData } = item;
        const maxSupply = fromDecimals(poolData.maxSupply, 18); // 转换最大供应量
        const borrowSupply = fromDecimals(poolData.borrowSupply, 18); // 转换已借贷量
        const lendSupply = fromDecimals(poolData.lendSupply, 18); // 转换已贷款量
        const collateralizationRatio = fromDecimals(poolData.martgageRate, 6); // 转换抵押率
        const marginRatio = fromDecimals(poolData.autoLiquidateThreshold, 6); // 转换保证金比率
        const fixedRate = fromDecimals(poolData.interestRate, 6); // 转换固定利率
        const settleTime = Number(poolData.settleTime) || 0; // 结算时间戳
        const endTime = Number(poolData.endTime) || 0; // 结束时间戳
        const length = Math.max(0, Math.floor((endTime - settleTime) / 86400)); // 计算期限（天）

        return {
          key: index + 1,
          state: Number(poolData.state) || 0,
          underlyingAsset: poolData.borrowTokenInfo.tokenName,
          fixedRate,
          maxSupply,
          borrowSupply,
          lendSupply,
          settlementDate: moment.unix(settleTime).format(FORMAT_TIME_STANDARD), // 格式化结算日期
          length,
          marginRatio,
          collateralizationRatio,
          poolName: poolData.lendTokenInfo.tokenName,
          endTime,
          settleTime,
          logo: poolData.borrowTokenInfo.tokenLogo,
          lendToken: poolData.lendToken,
          borrowToken: poolData.borrowToken,
          borrowPrice: Number(poolData.borrowTokenInfo.tokenPrice) || 0,
          lendPrice: Number(poolData.lendTokenInfo.tokenPrice) || 1,
        };
      });
      setAllPools(mapped); // 设置池数据
      setActivePopoverKey(NO_VISIBLE_POPOVER_KEY); // 重置弹窗key
    } catch (error) {
      message.error('获取池子信息失败，请稍后重试'); // 错误提示
    }
  }, []);

  useEffect(() => {
    history.replace('BUSD'); // 初始化路由为BUSD
  }, [history]);

  useEffect(() => {
    getPoolInfo(getTargetChainId()); // 获取池数据
  }, [getPoolInfo, getTargetChainId]);

  const handleTokenTabChange = useCallback(
    (key: string) => {
      setActivePoolSymbol(key as TokenTab); // 设置当前活跃代币
      history.push(key); // 更新路由
    },
    [history],
  );

  const handlePopoverVisibleChange = useCallback((rowKey: number, visible: boolean) => {
    setActivePopoverKey(visible ? rowKey : NO_VISIBLE_POPOVER_KEY); // 更新激活弹窗key
  }, []);

  const handleStatusMenuClick = useCallback(({ key }: { key: string }) => {
    setStatusFilter(key as StatusFilter); // 更新状态筛选器
  }, []);

  const handleDetailClick = useCallback((record: PoolRecord) => {
    setSelectedCoin(record.underlyingAsset); // 设置选中代币
    setSelectedPid(record.key - 1); // 设置选中池ID（key从1开始，pid从0开始）
    setActivePopoverKey(record.key); // 激活弹窗
  }, []);

  const closePopover = useCallback(() => {
    setActivePopoverKey(NO_VISIBLE_POPOVER_KEY); // 关闭弹窗
  }, []);

  const rolePopoverContent = useMemo(
    () => (
      <div className="choose">
        <Link
          to={PageUrl.Market_Pool.replace(
            ':pid/:pool/:coin/:mode',
            `${selectedPid}/${activePoolSymbol}/${selectedCoin}/Lender`, // 贷方路由
          )}
          style={{ color: '#FFF' }}
        >
          <div className="choose_lender">
            <img src={Lender1} alt="Lender" />
            <p>
              <span>Lender</span>
              <span> 锁定固定利率，保障收益稳定。</span>
            </p>
          </div>
        </Link>
        <Link
          to={PageUrl.Market_Pool.replace(
            ':pid/:pool/:coin/:mode',
            `${selectedPid}/${activePoolSymbol}/${selectedCoin}/Borrower`, // 借方路由
          )}
          style={{ color: '#FFF' }}
        >
          <div className="choose_borrow">
            <img src={Borrower} alt="Borrower" />
            <p>
              <span>Borrower</span>
              <span> 固定利率贷款，提前锁定借款成本。</span>
            </p>
          </div>
        </Link>
        <button type="button" className="close" onClick={closePopover}>
          <img src={Close} alt="close" />
        </button>
      </div>
    ),
    [activePoolSymbol, closePopover, selectedCoin, selectedPid],
  );

  const getTokenData = useCallback(
    (tokenKey: TokenTab) => filterByToken(statusFilteredPools, tokenKey), // 获取特定代币的池数据
    [filterByToken, statusFilteredPools],
  );

  const getPaginationConfig = useCallback((dataset: PoolRecord[]) => (dataset.length < 10 ? false : undefined), []); // 分页配置

  // 桌面端列表列配置
  const desktopColumns: ColumnsType<PoolRecord> = useMemo(
    () => [
      {
        title: 'Underlying Asset', // 底层资产
        dataIndex: 'underlyingAsset',
        key: 'underlyingAsset',
        render: (_, record) => (
          <div className="underlyingAsset">
            <img src={record.logo} alt={record.underlyingAsset} />
            <p>{record.underlyingAsset}</p>
          </div>
        ),
      },
      {
        title: 'Fixed Rate', // 固定利率
        dataIndex: 'fixedRate',
        key: 'fixedRate',
        sorter: {
          compare: (a, b) => a.fixedRate - b.fixedRate,
          multiple: 3,
        },
        render: (value: number) => <span>{`${value}%`}</span>,
      },
      {
        title: 'Available To Lend', // 可贷款额度
        dataIndex: 'lendSupply',
        key: 'availableToLend',
        sorter: {
          compare: (a, b) => a.lendSupply - b.lendSupply,
          multiple: 2,
        },
        render: (_, record) => {
          const utilization = record.maxSupply > 0 ? (record.lendSupply / record.maxSupply) * 100 : 0; // 利用率
          const borrowCapacityRaw =
            record.maxSupply > 0
              ? Math.floor(
                  ((record.borrowSupply * record.borrowPrice) / record.lendPrice / record.collateralizationRatio) *
                    10000,
                ) / record.maxSupply
              : 0; // 借贷能力原始值
          const borrowCapacityPercent = Math.min(100, Math.max(0, borrowCapacityRaw)); // 借贷能力百分比
          const borrowValueDisplay =
            (record.borrowSupply * record.borrowPrice) / record.lendPrice / record.collateralizationRatio; // 显示借贷值

          return (
            <div className="totalFinancing">
              <Progress
                percent={Math.min(100, Math.max(0, utilization))}
                showInfo={false}
                strokeColor="#5D52FF"
                success={{ percent: Math.min(100, Math.max(0, borrowCapacityPercent)) }} // 双进度条
              />
              <div className="totalFinancing__footer">
                <span className="totalFinancing__headline">
                  <span className="totalFinancing__borrow">
                    {toThousands(Math.floor(borrowValueDisplay * 100) / 100)} {/* 借贷值 */}
                  </span>
                  <span className="totalFinancing__separator">/</span>
                  <span className="totalFinancing__lend">
                    {toThousands(Math.floor(record.lendSupply * 100) / 100)}
                  </span>{' '}
                  {/* 贷款值 */}
                </span>
                <span className="totalFinancing__max">{toThousands(record.maxSupply)}</span> {/* 最大值 */}
              </div>
            </div>
          );
        },
      },
      {
        title: 'Settlement Date', // 结算日期
        dataIndex: 'settlementDate',
        key: 'settlementDate',
        sorter: {
          compare: (a, b) => a.settleTime - b.settleTime,
          multiple: 1,
        },
      },
      {
        title: 'Length', // 期限
        dataIndex: 'length',
        key: 'length',
        sorter: {
          compare: (a, b) => a.length - b.length,
          multiple: 5,
        },
        render: (value: number) => <span>{`${value} day`}</span>,
      },
      {
        title: 'Margin Ratio', // 保证金比率
        dataIndex: 'marginRatio',
        key: 'marginRatio',
        sorter: {
          compare: (a, b) => a.marginRatio - b.marginRatio,
          multiple: 6,
        },
        render: (value: number) => <span>{`${value + 100}%`}</span>, // 显示为100+value%
      },
      {
        title: 'Collateralization Ratio', // 抵押率
        dataIndex: 'collateralizationRatio',
        key: 'collateralizationRatio',
        sorter: {
          compare: (a, b) => a.collateralizationRatio - b.collateralizationRatio,
          multiple: 7,
        },
        render: (_, record) => (
          <CollateralActionCell
            record={record}
            popoverContent={rolePopoverContent}
            isPopoverVisible={activePopoverKey === record.key}
            onDetailClick={handleDetailClick}
            onPopoverVisibleChange={handlePopoverVisibleChange}
          />
        ),
      },
    ],
    [activePopoverKey, handleDetailClick, handlePopoverVisibleChange, rolePopoverContent],
  );

  // 移动端精简列配置
  const mobileColumns: ColumnsType<PoolRecord> = useMemo(
    () => [
      {
        title: 'Underlying Asset',
        dataIndex: 'underlyingAsset',
        key: 'underlyingAsset',
        render: (_, record) => (
          <MobileAssetCell
            record={record}
            popoverContent={rolePopoverContent}
            isPopoverVisible={activePopoverKey === record.key}
            onDetailClick={handleDetailClick}
            onPopoverVisibleChange={handlePopoverVisibleChange}
          />
        ),
      },
      {
        title: 'Fixed Rate',
        dataIndex: 'fixedRate',
        key: 'fixedRate',
        sorter: {
          compare: (a, b) => a.fixedRate - b.fixedRate,
          multiple: 3,
        },
        render: (value: number) => <span>{`${value}%`}</span>,
      },
      {
        title: 'Settlement Date',
        dataIndex: 'settlementDate',
        key: 'settlementDate',
        sorter: {
          compare: (a, b) => a.settleTime - b.settleTime,
          multiple: 1,
        },
      },
    ],
    [activePopoverKey, handleDetailClick, handlePopoverVisibleChange, rolePopoverContent],
  );

  const statusMenu = useMemo(
    () => (
      <Menu onClick={handleStatusMenuClick}>
        <Menu.Item key="Live" className="menutab">
          Live
        </Menu.Item>
        <Menu.Item key="All" className="menutab">
          All
        </Menu.Item>
        <Menu.Item key="Finished" className="menutab">
          Finished
        </Menu.Item>
      </Menu>
    ),
    [handleStatusMenuClick],
  );

  const renderDesktopTab = useCallback(
    (tokenKey: TokenTab) => {
      const dataset = getTokenData(tokenKey); // 获取该代币的数据
      return (
        <TabPane tab={tokenKey} key={tokenKey}>
          <Table
            pagination={getPaginationConfig(dataset)} // 分页
            columns={desktopColumns} // 桌面列
            dataSource={dataset} // 数据源
            rowClassName={() => 'pool-row'} // 行样式
            rowKey="key"
          />
        </TabPane>
      );
    },
    [desktopColumns, getPaginationConfig, getTokenData],
  );

  const renderMobileTab = useCallback(
    (tokenKey: TokenTab) => {
      const dataset = getTokenData(tokenKey); // 获取该代币的数据
      return (
        <TabPane tab={tokenKey} key={tokenKey}>
          <Table
            pagination={getPaginationConfig(dataset)} // 分页
            columns={mobileColumns} // 移动列
            dataSource={dataset} // 数据源
            rowClassName={() => 'pool-row'} // 行样式
            rowKey="key"
          />
        </TabPane>
      );
    },
    [getPaginationConfig, getTokenData, mobileColumns],
  );

  const desktopTabs: TokenTab[] = chainId === 97 ? ['BUSD', 'USDT', 'DAI'] : ['BUSD', 'USDT', 'PLGR']; // 根据链ID确定桌面标签

  return (
    <div className="dapp_home_page">
      <DappLayout title="Market Pool" className="trust_code">
        <Dropdown overlay={statusMenu} trigger={['click']} className="dropdown">
          <button type="button" className="ant-dropdown-link dropdown-trigger-button">
            {statusFilter} {/* 当前状态筛选器 */}
            <DownOutlined />
          </button>
        </Dropdown>
        <Tabs defaultActiveKey="BUSD" onChange={handleTokenTabChange} className="all_tab">
          {desktopTabs.map((tab) => renderDesktopTab(tab))} {/* 渲染桌面标签页 */}
        </Tabs>
        <Tabs defaultActiveKey="BUSD" onChange={handleTokenTabChange} className="media_tab">
          {['BUSD', 'USDT', 'DAI'].map((tab) => renderMobileTab(tab as TokenTab))} {/* 渲染移动标签页 */}
        </Tabs>
      </DappLayout>
    </div>
  );
}

export default HomePage;
