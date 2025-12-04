package routes

import (
	"pledge-backend/api/controllers"
	"pledge-backend/api/middlewares"
	"pledge-backend/config"

	"github.com/gin-gonic/gin"
)

// InitRoute 初始化应用路由
func InitRoute(e *gin.Engine) *gin.Engine {

	// version group / 版本分组路由
	v2Group := e.Group("/api/v" + config.Config.Env.Version)

	// pledge-defi backend / 质押DeFi后端接口
	poolController := controllers.PoolController{}
	v2Group.GET("/poolBaseInfo", poolController.PoolBaseInfo)                                   //pool base information / 资金池基础信息
	v2Group.GET("/poolDataInfo", poolController.PoolDataInfo)                                   //pool data information / 资金池数据信息
	v2Group.GET("/token", poolController.TokenList)                                             //pool token information / 资金池代币信息
	v2Group.POST("/pool/debtTokenList", middlewares.CheckToken(), poolController.DebtTokenList) //pool debtTokenList / 债务代币列表（需令牌验证）
	v2Group.POST("/pool/search", middlewares.CheckToken(), poolController.Search)               //pool search / 资金池搜索（需令牌验证）

	// plgr-usdt price / PLGR-USDT价格接口
	priceController := controllers.PriceController{}
	v2Group.GET("/price", priceController.NewPrice) //new price on ku-coin-exchange / 获取KuCoin交易所最新价格

	// pledge-defi admin backend / 质押DeFi管理后台接口
	multiSignPoolController := controllers.MultiSignPoolController{}
	v2Group.POST("/pool/setMultiSign", middlewares.CheckToken(), multiSignPoolController.SetMultiSign) //multi-sign set / 设置多重签名（需令牌验证）
	v2Group.POST("/pool/getMultiSign", middlewares.CheckToken(), multiSignPoolController.GetMultiSign) //multi-sign get / 获取多重签名（需令牌验证）

	userController := controllers.UserController{}
	v2Group.POST("/user/login", userController.Login)                             // login / 用户登录
	v2Group.POST("/user/logout", middlewares.CheckToken(), userController.Logout) // logout / 用户登出（需令牌验证）

	return e
}
