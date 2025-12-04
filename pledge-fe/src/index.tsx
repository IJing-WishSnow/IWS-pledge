/**
 * @ Author: Muniz
 * @ Create Time: 2020-06-10 09:55:59
 * @ Modified by: Muniz
 * @ Modified time: 2020-07-16 18:37:36
 * @ Description: popup.html chrome 扩展插件, 弹出框的页面展示入口
 */

import React from 'react';
import { createRoot } from 'react-dom/client'; // 修改这里：使用 React 18 的 createRoot
import { ConfigProvider } from 'antd';
import { Provider } from 'mobx-react';
import { BrowserRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';

import Routes from '_src/routes';
import rootStore from '_src/stores';
import i18n from '_utils/i18n';
import { ThemeProvider } from '_components/SwitchThemes';

// antd 组件库 多语言
import antdEnUS from 'antd/lib/locale/en_US';
import antdZhCN from 'antd/lib/locale/zh_CN';

import '_assets/themes/light.css';
import '_assets/themes/dark.css';
import '_assets/less/index.less';

// 兼容 Recoil 的类型定义（避免 children 类型报错）
const AnyRecoilRoot = RecoilRoot as React.ComponentType<any>;

// 修复箭头函数体风格
const Root = () => (
  <Provider {...rootStore}>
    <ThemeProvider>
      <ConfigProvider locale={i18n.language === 'zhCN' ? antdZhCN : antdEnUS}>
        <BrowserRouter>
          <AnyRecoilRoot>
            <Routes />
          </AnyRecoilRoot>
        </BrowserRouter>
      </ConfigProvider>
    </ThemeProvider>
  </Provider>
);

// 修复 React 18 弃用的 API 和 null 检查
const container = document.getElementById('root');

// 确保 container 存在
if (!container) {
  throw new Error('找不到 #root 元素');
}

const root = createRoot(container);
root.render(<Root />);
