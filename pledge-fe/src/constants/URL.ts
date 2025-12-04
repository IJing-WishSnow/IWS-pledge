// URL配置文件
const URLSource = {
  info: {
    poolBaseInfo: '/poolBaseInfo', // 资金池基础信息接口
    poolDataInfo: '/poolDataInfo', // 资金池数据信息接口
  },
};

// 各环境基础URL配置
const baseUrl = {
  // development: 'https://dev-v2-backend.pledger.finance',
  development: 'https://pledge.rcc-tec.xyz', // 开发环境
  production: 'https://pro.test.com/api', // 生产环境
  v22: 'https://v2-backend.pledger.finance/api/v22', // v22环境
  // v21: 'https://dev-v2-backend.pledger.finance/api/v21',
  // v21: 'https://pledge.rcc-tec.xyz/api/v22', // v21环境
  v21: 'https://127.0.0.1/api/v22', // v21环境
};

// Proxy处理器，用于动态生成URL
const handler: ProxyHandler<typeof URLSource> = {
  // get拦截器，当访问URL属性时触发
  get(target: any, key: string | symbol) {
    // 获取目标值
    const value = target[key];
    const nowHost = window.location.hostname;

    try {
      // 尝试返回代理，实现深层属性代理
      return new Proxy(value, handler);
    } catch (err) {
      // 如果值是字符串，则根据当前域名动态选择基础URL
      if (typeof value === 'string') {
        let base = baseUrl.v21;

        if (nowHost.includes('127.0.0.1') || nowHost.includes('localhost')) {
          base = baseUrl.v21; // 本地环境使用v21
        }
        if (nowHost.includes('dev-v2-pledger')) {
          base = baseUrl.v21; // 开发环境使用v21
        }
        if (nowHost.includes('v2-pldeger')) {
          base = baseUrl.v22; // 生产环境使用v22
        }

        return base + value; // 返回完整的URL
      }

      // 确保函数始终有返回值
      return undefined;
    }
  },

  // set拦截器，防止URL配置被意外修改
  set() {
    // 阻止对URL配置文件的修改，保持只读属性
    // 不接收参数，直接返回true表示设置成功（实际上不执行设置）
    return true;
  },
};

// 创建代理对象，用于动态生成URL
const URL = new Proxy(URLSource, handler);

export default URL;
