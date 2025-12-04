package db

import (
	"fmt"
	"pledge-backend/config"
	"pledge-backend/log"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

// InitMysql 初始化MySQL数据库连接
func InitMysql() {
	// 从配置中获取MySQL连接参数
	mysqlConf := config.Config.Mysql
	log.Logger.Info("初始化MySQL数据库连接")

	// 构建MySQL连接DSN字符串
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		mysqlConf.UserName,
		mysqlConf.Password,
		mysqlConf.Address,
		mysqlConf.Port,
		mysqlConf.DbName)

	// 使用GORM打开MySQL连接，配置MySQL驱动参数
	db, err := gorm.Open(mysql.New(mysql.Config{
		DSN:                       dsn,   // 数据源名称
		DefaultStringSize:         256,   // string类型字段默认长度
		DisableDatetimePrecision:  true,  // 禁用datetime精度，兼容MySQL 5.6之前版本
		DontSupportRenameIndex:    true,  // 重命名索引采用删除并新建方式，兼容MySQL 5.7之前版本
		DontSupportRenameColumn:   true,  // 使用`change`重命名列，兼容MySQL 8之前版本
		SkipInitializeWithVersion: false, // 根据MySQL版本自动配置
	}), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true, // 使用单数表名（禁用表名复数形式）
		},
		SkipDefaultTransaction: true, // 跳过默认事务
	})

	if err != nil {
		log.Logger.Panic(fmt.Sprintf("MySQL连接错误: %+v", err))
	}

	// 注册GORM回调函数，用于在所有数据库操作后执行
	_ = db.Callback().Create().After("gorm:after_create").Register("after_create", After)
	_ = db.Callback().Query().After("gorm:after_query").Register("after_query", After)
	_ = db.Callback().Delete().After("gorm:after_delete").Register("after_delete", After)
	_ = db.Callback().Update().After("gorm:after_update").Register("after_update", After)
	_ = db.Callback().Row().After("gorm:row").Register("after_row", After)
	_ = db.Callback().Raw().After("gorm:raw").Register("after_raw", After)

	// 自动迁移数据表（已注释，需手动启用）
	// db.AutoMigrate(&TestTable{})

	// 获取底层数据库连接池
	sqlDB, err := db.DB()
	if err != nil {
		log.Logger.Error("获取数据库连接池失败: " + err.Error())
	}

	// 配置数据库连接池参数
	sqlDB.SetMaxIdleConns(mysqlConf.MaxIdleConns)                                // 设置最大空闲连接数
	sqlDB.SetMaxOpenConns(mysqlConf.MaxOpenConns)                                // 设置最大打开连接数
	sqlDB.SetConnMaxLifetime(time.Duration(mysqlConf.MaxLifeTime) * time.Second) // 设置连接最大生存时间

	// 将数据库连接实例赋值给全局变量
	Mysql = db
}

// After GORM回调函数，在所有数据库操作后执行
// 当前实现为解释SQL语句（可用于调试，实际已注释日志输出）
func After(db *gorm.DB) {
	db.Dialector.Explain(db.Statement.SQL.String(), db.Statement.Vars...)
	// 如需记录SQL日志，可取消下面注释
	// sql := db.Dialector.Explain(db.Statement.SQL.String(), db.Statement.Vars...)
	// log.Logger.Info(sql)
}
