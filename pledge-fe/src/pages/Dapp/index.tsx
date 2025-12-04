/* eslint-disable import/no-extraneous-dependencies */

import React, { StrictMode } from 'react';
import 'firebase/firestore';
import { ResetCSS } from '@pancakeswap-libs/uikit';

import Header from '_components/Header';
import ToastListener from '_components/ToastListener';
import { WebLayout } from '_src/Layout';
import ApplicationUpdater from '_src/state/application/updater';
import ListsUpdater from '_src/state/lists/updater';
import MulticallUpdater from '_src/state/multicall/updater';
import TransactionUpdater from '_src/state/transactions/updater';
import Providers from './Providers';
import Routes from './routes';
import './index.less';

const PortfolioPage: React.FC = () => (
  <StrictMode>
    <Providers>
      <>
        <ListsUpdater />
        <ApplicationUpdater />
        <TransactionUpdater />
        <MulticallUpdater />
        <ToastListener />
      </>
      <WebLayout className="dapp-page">
        <Header />
        <div className="dapp-router-page">
          <ResetCSS />
          <Routes />
        </div>
      </WebLayout>
    </Providers>
  </StrictMode>
);
export default PortfolioPage;
