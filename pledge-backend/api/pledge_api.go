package main

import (
	"pledge-backend/api/middlewares"
	"pledge-backend/api/models"
	"pledge-backend/api/models/kucoin"
	"pledge-backend/api/models/ws"
	"pledge-backend/api/routes"
	"pledge-backend/api/static"
	"pledge-backend/api/validate"
	"pledge-backend/config"
	"pledge-backend/db"

	"github.com/gin-gonic/gin"
)

func main() {

	//init mysql
	db.InitMysql()

	//init redis
	db.InitRedis()
	models.InitTable()

	//gin bind go-playground-validator
	validate.BindingValidator() // 一个自定义验证器的初始化调用，用于绑定到框架（如Gin）的验证器，实现对请求参数的自动验证。

	// websocket server
	go ws.StartServer()

	// get plgr price from kucoin-exchange
	go kucoin.GetExchangePrice() // 获取 KuCoin 交易所实时价格数据的函数调用，通常用于获取加密货币的当前交易价格信息。

	// gin start
	gin.SetMode(gin.ReleaseMode) // 设置Gin运行模式为发布模式（禁用调试信息）

	// 创建默认Gin应用实例（包含Logger和Recovery中间件）
	app := gin.Default()

	// 获取静态文件目录路径并设置静态文件路由
	staticPath := static.GetCurrentAbPathByCaller()
	app.Static("/storage/", staticPath)

	// 使用跨域中间件
	app.Use(middlewares.Cors())

	// 初始化应用路由
	routes.InitRoute(app)

	// 启动HTTP服务，监听配置文件中指定的端口
	_ = app.Run(":" + config.Config.Env.Port)

}

/*
 If you change the version, you need to modify the following files'
 config/init.go
*/
