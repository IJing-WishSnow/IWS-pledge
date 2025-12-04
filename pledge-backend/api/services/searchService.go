package services

import (
	"fmt"
	"pledge-backend/api/common/statecode"
	"pledge-backend/api/models"
	"pledge-backend/api/models/request"
	"pledge-backend/log"
)

// SearchService 搜索服务结构体
type SearchService struct{}

// NewSearch 创建搜索服务实例
func NewSearch() *SearchService {
	return &SearchService{}
}

// Search 搜索资金池
// 返回值：状态码, 总记录数, 资金池列表
func (c *SearchService) Search(req *request.Search) (int, int64, []models.Pool) {

	// 构建SQL查询条件
	whereCondition := fmt.Sprintf(`chain_id='%v'`, req.ChainID)
	if req.LendTokenSymbol != "" {
		whereCondition += fmt.Sprintf(` and lend_token_symbol='%v'`, req.LendTokenSymbol)
	}
	if req.State != "" {
		whereCondition += fmt.Sprintf(` and state='%v'`, req.State)
	}

	// 调用模型层进行分页查询（注意：Pagination返回顺序为：total, data, err）
	total, pools, err := models.NewPool().Pagination(req, whereCondition)
	if err != nil {
		// 查询失败，记录错误日志并返回错误状态码
		log.Logger.Error(err.Error())
		return statecode.CommonErrServerErr, 0, nil
	}

	// 查询成功，返回成功状态码、总记录数和数据
	return statecode.CommonSuccess, total, pools
}
