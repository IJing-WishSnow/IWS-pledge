/* eslint-disable import/no-extraneous-dependencies */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { Link, useHistory } from 'react-router-dom';
import { Dropdown, Menu, Popover, Progress, Table, Tabs, message } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useWeb3React } from '@web3-react/core';
import BigNumber from 'bignumber.js';
import moment from 'moment';

import { FORMAT_TIME_STANDARD } from '_src/utils/constants';
import { DappLayout } from '_src/Layout';
import PageUrl from '_constants/pageURL';
import Button from '_components/Button';
import services from '_src/services';

import Lender1 from '_src/assets/images/Group 1843.png';
import Borrower from '_src/assets/images/Group 1842.png';
import Close from '_assets/images/Close Square.png';

import './index.less';

const { TabPane } = Tabs;

// 默认链 ID（56 = BSC 主网）
const DEFAULT_CHAIN_ID = 56;
const NO_VISIBLE_POPOVER_KEY = -1;

type StatusFilter = 'Live' | 'All' | 'Finished';
type TokenTab = 'BUSD' | 'USDT' | 'DAI' | 'PLGR';

interface ApiTokenInfo {
  tokenLogo: string;
  tokenName: string;
  tokenPrice: string | number;
}

interface ApiPoolItem {
  // eslint-disable-next-line camelcase
  pool_data: {
    state: number;
    borrowTokenInfo: ApiTokenInfo;
    lendTokenInfo: ApiTokenInfo;
    maxSupply: string;
    borrowSupply: string;
    lendSupply: string;
    settleTime: number;
    endTime: number;
    interestRate: string;
    autoLiquidateThreshold: string;
    martgageRate: string;
    lendToken: string;
    borrowToken: string;
  };
}

interface PoolRecord {
  key: number;
  state: number;
  underlyingAsset: string;
  fixedRate: number;
  maxSupply: number;
  borrowSupply: number;
  lendSupply: number;
  settlementDate: string;
  length: number;
  marginRatio: number;
  collateralizationRatio: number;
  poolName: string;
  endTime: number;
  settleTime: number;
  logo: string;
  lendToken: string;
  borrowToken: string;
  borrowPrice: number;
  lendPrice: number;
}

const TOKEN_ADDRESS_MAP: Record<TokenTab, string[]> = {
  BUSD: ['0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', '0xE676Dcd74f44023b95E0E2C6436C97991A7497DA'],
  USDT: [''],
  DAI: ['0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', '0x490BC3FCc845d37C1686044Cd2d6589585DE9B8B'],
  PLGR: ['0x6Aa91CbfE045f9D154050226fCc830ddbA886CED'],
};

// 工具函数：按精度缩放链上原始数值
const fromDecimals = (value: BigNumber.Value, decimals: number): number =>
  new BigNumber(value || 0).dividedBy(new BigNumber(10).pow(decimals)).toNumber();

// 工具函数：格式化千位分隔
const toThousands = (value: BigNumber.Value): string => {
  const num = new BigNumber(value || 0);
  const [integer, decimal] = num.toFixed(6).split('.');
  const formattedInt = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimal && Number(decimal) !== 0 ? `${formattedInt}.${decimal}` : formattedInt;
};

/* eslint-disable no-unused-vars */
interface CollateralActionCellProps {
  record: PoolRecord;
  popoverContent: React.ReactNode;
  isPopoverVisible: boolean;
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
      onPopoverVisibleChange(record.key, visible);
    },
    [onPopoverVisibleChange, record.key],
  );

  const handleDetail = useCallback(() => {
    onDetailClick(record);
  }, [onDetailClick, record]);

  return (
    <div className="collateralization-cell">
      <span>{`${record.collateralizationRatio}%`}</span>
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
      onPopoverVisibleChange(record.key, visible);
    },
    [onPopoverVisibleChange, record.key],
  );

  const handleClick = useCallback(() => {
    onDetailClick(record);
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
        <img src={record.logo} alt={record.underlyingAsset} />
        <span className="asset-trigger__label">{record.underlyingAsset}</span>
      </button>
    </Popover>
  );
};

function HomePage() {
  const history = useHistory();
  const { chainId } = useWeb3React();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Live');
  const [allPools, setAllPools] = useState<PoolRecord[]>([]);
  const [activePopoverKey, setActivePopoverKey] = useState<number>(NO_VISIBLE_POPOVER_KEY);
  const [selectedCoin, setSelectedCoin] = useState<string>('');
  const [selectedPid, setSelectedPid] = useState<number>(0);
  const [activePoolSymbol, setActivePoolSymbol] = useState<TokenTab>('BUSD');

  // 获取筛选结果，避免重复 filter
  const filterByStatus = useCallback((rows: PoolRecord[], status: StatusFilter) => {
    if (status === 'All') {
      return rows;
    }
    if (status === 'Live') {
      return rows.filter((row) => row.state < 1);
    }
    return rows.filter((row) => row.state >= 1);
  }, []);

  const statusFilteredPools = useMemo(
    () => filterByStatus(allPools, statusFilter),
    [allPools, filterByStatus, statusFilter],
  );

  const filterByToken = useCallback((rows: PoolRecord[], token: TokenTab) => {
    const addresses = TOKEN_ADDRESS_MAP[token] || [];
    if (!addresses.length) {
      return rows;
    }
    return rows.filter((row) => addresses.includes(row.lendToken));
  }, []);

  const getTargetChainId = useCallback(() => chainId ?? DEFAULT_CHAIN_ID, [chainId]);

  // 拉取池子数据
  const getPoolInfo = useCallback(async (targetChainId: number) => {
    try {
      const response = await services.userServer.getpoolBaseInfo(targetChainId);
      const mapped: PoolRecord[] = (response?.data?.data ?? []).map((item: ApiPoolItem, index: number) => {
        const { pool_data: poolData } = item;
        const maxSupply = fromDecimals(poolData.maxSupply, 18);
        const borrowSupply = fromDecimals(poolData.borrowSupply, 18);
        const lendSupply = fromDecimals(poolData.lendSupply, 18);
        const collateralizationRatio = fromDecimals(poolData.martgageRate, 6);
        const marginRatio = fromDecimals(poolData.autoLiquidateThreshold, 6);
        const fixedRate = fromDecimals(poolData.interestRate, 6);
        const settleTime = Number(poolData.settleTime) || 0;
        const endTime = Number(poolData.endTime) || 0;
        const length = Math.max(0, Math.floor((endTime - settleTime) / 86400));

        return {
          key: index + 1,
          state: Number(poolData.state) || 0,
          underlyingAsset: poolData.borrowTokenInfo.tokenName,
          fixedRate,
          maxSupply,
          borrowSupply,
          lendSupply,
          settlementDate: moment.unix(settleTime).format(FORMAT_TIME_STANDARD),
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
      setAllPools(mapped);
      setActivePopoverKey(NO_VISIBLE_POPOVER_KEY);
    } catch (error) {
      message.error('获取池子信息失败，请稍后重试');
    }
  }, []);

  useEffect(() => {
    history.replace('BUSD');
  }, [history]);

  useEffect(() => {
    getPoolInfo(getTargetChainId());
  }, [getPoolInfo, getTargetChainId]);

  const handleTokenTabChange = useCallback(
    (key: string) => {
      setActivePoolSymbol(key as TokenTab);
      history.push(key);
    },
    [history],
  );

  const handlePopoverVisibleChange = useCallback((rowKey: number, visible: boolean) => {
    setActivePopoverKey(visible ? rowKey : NO_VISIBLE_POPOVER_KEY);
  }, []);

  const handleStatusMenuClick = useCallback(({ key }: { key: string }) => {
    setStatusFilter(key as StatusFilter);
  }, []);

  const handleDetailClick = useCallback((record: PoolRecord) => {
    setSelectedCoin(record.underlyingAsset);
    setSelectedPid(record.key - 1);
    setActivePopoverKey(record.key);
  }, []);

  const closePopover = useCallback(() => {
    setActivePopoverKey(NO_VISIBLE_POPOVER_KEY);
  }, []);

  const rolePopoverContent = useMemo(
    () => (
      <div className="choose">
        <Link
          to={PageUrl.Market_Pool.replace(
            ':pid/:pool/:coin/:mode',
            `${selectedPid}/${activePoolSymbol}/${selectedCoin}/Lender`,
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
            `${selectedPid}/${activePoolSymbol}/${selectedCoin}/Borrower`,
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
    (tokenKey: TokenTab) => filterByToken(statusFilteredPools, tokenKey),
    [filterByToken, statusFilteredPools],
  );

  const getPaginationConfig = useCallback((dataset: PoolRecord[]) => (dataset.length < 10 ? false : undefined), []);

  // 桌面端列表列配置
  const desktopColumns: ColumnsType<PoolRecord> = useMemo(
    () => [
      {
        title: 'Underlying Asset',
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
        title: 'Available To Lend',
        dataIndex: 'lendSupply',
        key: 'availableToLend',
        sorter: {
          compare: (a, b) => a.lendSupply - b.lendSupply,
          multiple: 2,
        },
        render: (_, record) => {
          const utilization = record.maxSupply > 0 ? (record.lendSupply / record.maxSupply) * 100 : 0;
          const borrowCapacityRaw =
            record.maxSupply > 0
              ? Math.floor(
                  ((record.borrowSupply * record.borrowPrice) / record.lendPrice / record.collateralizationRatio) *
                    10000,
                ) / record.maxSupply
              : 0;
          const borrowCapacityPercent = Math.min(100, Math.max(0, borrowCapacityRaw));
          const borrowValueDisplay =
            (record.borrowSupply * record.borrowPrice) / record.lendPrice / record.collateralizationRatio;

          return (
            <div className="totalFinancing">
              <Progress
                percent={Math.min(100, Math.max(0, utilization))}
                showInfo={false}
                strokeColor="#5D52FF"
                success={{ percent: Math.min(100, Math.max(0, borrowCapacityPercent)) }}
              />
              <div className="totalFinancing__footer">
                <span className="totalFinancing__headline">
                  <span className="totalFinancing__borrow">
                    {toThousands(Math.floor(borrowValueDisplay * 100) / 100)}
                  </span>
                  <span className="totalFinancing__separator">/</span>
                  <span className="totalFinancing__lend">{toThousands(Math.floor(record.lendSupply * 100) / 100)}</span>
                </span>
                <span className="totalFinancing__max">{toThousands(record.maxSupply)}</span>
              </div>
            </div>
          );
        },
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
      {
        title: 'Length',
        dataIndex: 'length',
        key: 'length',
        sorter: {
          compare: (a, b) => a.length - b.length,
          multiple: 5,
        },
        render: (value: number) => <span>{`${value} day`}</span>,
      },
      {
        title: 'Margin Ratio',
        dataIndex: 'marginRatio',
        key: 'marginRatio',
        sorter: {
          compare: (a, b) => a.marginRatio - b.marginRatio,
          multiple: 6,
        },
        render: (value: number) => <span>{`${value + 100}%`}</span>,
      },
      {
        title: 'Collateralization Ratio',
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
      const dataset = getTokenData(tokenKey);
      return (
        <TabPane tab={tokenKey} key={tokenKey}>
          <Table
            pagination={getPaginationConfig(dataset)}
            columns={desktopColumns}
            dataSource={dataset}
            rowClassName={() => 'pool-row'}
            rowKey="key"
          />
        </TabPane>
      );
    },
    [desktopColumns, getPaginationConfig, getTokenData],
  );

  const renderMobileTab = useCallback(
    (tokenKey: TokenTab) => {
      const dataset = getTokenData(tokenKey);
      return (
        <TabPane tab={tokenKey} key={tokenKey}>
          <Table
            pagination={getPaginationConfig(dataset)}
            columns={mobileColumns}
            dataSource={dataset}
            rowClassName={() => 'pool-row'}
            rowKey="key"
          />
        </TabPane>
      );
    },
    [getPaginationConfig, getTokenData, mobileColumns],
  );

  const desktopTabs: TokenTab[] = chainId === 97 ? ['BUSD', 'USDT', 'DAI'] : ['BUSD', 'USDT', 'PLGR'];

  return (
    <div className="dapp_home_page">
      <DappLayout title="Market Pool" className="trust_code">
        <Dropdown overlay={statusMenu} trigger={['click']} className="dropdown">
          <button type="button" className="ant-dropdown-link dropdown-trigger-button">
            {statusFilter}
            <DownOutlined />
          </button>
        </Dropdown>
        <Tabs defaultActiveKey="BUSD" onChange={handleTokenTabChange} className="all_tab">
          {desktopTabs.map((tab) => renderDesktopTab(tab))}
        </Tabs>
        <Tabs defaultActiveKey="BUSD" onChange={handleTokenTabChange} className="media_tab">
          {['BUSD', 'USDT', 'DAI'].map((tab) => renderMobileTab(tab as TokenTab))}
        </Tabs>
      </DappLayout>
    </div>
  );
}

export default HomePage;
