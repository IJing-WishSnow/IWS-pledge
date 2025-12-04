// 导入React核心库
import React from 'react';
// 从@web3-react/core导入创建Web3React根上下文和Web3React提供者组件
import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core';
// 导入Redux的提供者组件，用于将Redux store注入React应用
import { Provider } from 'react-redux';
// 导入PancakeSwap UI Kit的模态框提供者组件，用于管理应用中的弹窗
import { ModalProvider } from '@pancakeswap-libs/uikit';
// 导入网络上下文名称常量，通常用于区分不同的Web3上下文
import { NetworkContextName } from '_src/constants';
// 导入Redux store实例，包含应用的所有状态
import store from '_src/state';
// 导入获取Web3库的函数，用于初始化Web3提供者
import getLibrary from '_src/utils/getLibrary';
// 导入自定义主题上下文提供者，用于管理应用主题
import { ThemeContextProvider } from './ThemeContext';

// 创建一个独立的Web3React根上下文，专门用于网络数据读取
// 使用NetworkContextName作为上下文标识，这样可以通过指定上下文名称来访问不同的Web3实例
const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName);

// 定义Providers组件的属性接口
// children属性是可选的React节点，代表被包裹的子组件
interface ProvidersProps {
  children?: React.ReactNode;
}

// 将ModalProvider强制转换为any类型的React组件类型
// 这样做通常是为了解决TypeScript类型不匹配的问题，确保组件能接受任意props
const AnyModalProvider = ModalProvider as React.ComponentType<any>;

// Providers组件定义：这是一个函数式组件，接收children作为props
// 该组件将所有必要的上下文提供者嵌套在一起，为整个应用提供所需的各种上下文
const Providers = ({ children }: ProvidersProps) => (
  // 主Web3React提供者：管理用户主动连接的Web3上下文（如MetaMask连接）
  // getLibrary属性用于初始化Web3库，将标准的EIP-1193提供者转换为库需要的格式
  <Web3ReactProvider getLibrary={getLibrary}>
    {/* 独立网络Web3React提供者：专门用于读取区块链公共数据，即使用户未连接钱包也能工作 */}
    {/* 通过createWeb3ReactRoot创建，使用NetworkContextName作为上下文键，避免与主上下文冲突 */}
    <Web3ProviderNetwork getLibrary={getLibrary}>
      {/* Redux提供者：将Redux store注入React应用，使所有子组件都能访问全局状态 */}
      <Provider store={store}>
        {/* 主题上下文提供者：管理应用主题（如深色/浅色模式） */}
        <ThemeContextProvider>
          {/* 模态框提供者：管理应用中所有弹窗的显示和状态 */}
          <AnyModalProvider>{children}</AnyModalProvider>
        </ThemeContextProvider>
      </Provider>
    </Web3ProviderNetwork>
  </Web3ReactProvider>
);

// 设置Providers组件的默认props
// 将children默认值设为null，防止未传递children时出现undefined错误
Providers.defaultProps = {
  children: null,
};

// 导出Providers组件，作为应用的根提供者
export default Providers;
