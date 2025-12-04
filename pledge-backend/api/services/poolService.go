package services

import (
	"pledge-backend/api/common/statecode"
	"pledge-backend/api/models"
	"pledge-backend/log"
)

// poolService 资金池服务结构体
type poolService struct{}

// NewPool 创建资金池服务实例
func NewPool() *poolService {
	return &poolService{}
}

// PoolBaseInfo 获取资金池基础信息服务
func (s *poolService) PoolBaseInfo(chainId int, result *[]models.PoolBaseInfoRes) int {
	// 调用模型层方法获取资金池基础信息
	err := models.NewPoolBases().PoolBaseInfo(chainId, result)
	if err != nil {
		// 数据库查询失败，记录错误并返回服务端错误状态码
		log.Logger.Error(err.Error())
		return statecode.CommonErrServerErr
	}
	// 成功获取数据，返回成功状态码
	return statecode.CommonSuccess
}

// PoolDataInfo 获取资金池数据信息服务
func (s *poolService) PoolDataInfo(chainId int, result *[]models.PoolDataInfoRes) int {
	// 调用模型层方法获取资金池详细信息
	err := models.NewPoolData().PoolDataInfo(chainId, result)
	if err != nil {
		// 数据库查询失败，记录错误并返回服务端错误状态码
		log.Logger.Error(err.Error())
		return statecode.CommonErrServerErr
	}
	// 成功获取数据，返回成功状态码
	return statecode.CommonSuccess
}
