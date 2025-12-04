package controllers

import (
	"pledge-backend/api/common/statecode"
	"pledge-backend/api/models"
	"pledge-backend/api/models/request"
	"pledge-backend/api/models/response"
	"pledge-backend/api/services"
	"pledge-backend/api/validate"
	"pledge-backend/config"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type PoolController struct {
}

// PoolBaseInfo 获取资金池基础信息
func (c *PoolController) PoolBaseInfo(ctx *gin.Context) {
	res := response.Gin{Res: ctx}
	req := request.PoolBaseInfo{}
	var result []models.PoolBaseInfoRes

	// 参数验证，验证失败则返回错误码
	errCode := validate.NewPoolBaseInfo().PoolBaseInfo(ctx, &req)
	if errCode != statecode.CommonSuccess {
		res.Response(ctx, errCode, nil)
		return
	}

	// 调用服务层获取资金池基础数据
	errCode = services.NewPool().PoolBaseInfo(req.ChainId, &result)
	if errCode != statecode.CommonSuccess {
		res.Response(ctx, errCode, nil)
		return
	}

	// 返回成功响应和数据
	res.Response(ctx, statecode.CommonSuccess, result)
}

// PoolDataInfo 获取资金池数据信息
func (c *PoolController) PoolDataInfo(ctx *gin.Context) {
	res := response.Gin{Res: ctx}
	req := request.PoolDataInfo{}
	var result []models.PoolDataInfoRes

	// 参数验证
	errCode := validate.NewPoolDataInfo().PoolDataInfo(ctx, &req)
	if errCode != statecode.CommonSuccess {
		res.Response(ctx, errCode, nil)
		return
	}

	// 调用服务层获取资金池详细信息
	errCode = services.NewPool().PoolDataInfo(req.ChainId, &result)
	if errCode != statecode.CommonSuccess {
		res.Response(ctx, errCode, nil)
		return
	}

	// 返回成功响应和数据
	res.Response(ctx, statecode.CommonSuccess, result)
}

// TokenList 获取代币列表信息
func (c *PoolController) TokenList(ctx *gin.Context) {

	req := request.TokenList{}
	result := response.TokenList{}

	// 验证请求参数中的链ID
	errCode := validate.NewTokenList().TokenList(ctx, &req)
	if errCode != statecode.CommonSuccess {
		// 验证失败直接返回错误信息
		ctx.JSON(200, map[string]string{
			"error": "chainId error",
		})
		return
	}

	// 调用服务层获取代币列表数据
	errCode, data := services.NewTokenList().GetTokenList(&req)
	if errCode != statecode.CommonSuccess {
		ctx.JSON(200, map[string]string{
			"error": "chainId error",
		})
		return
	}

	// 构建基础URL，用于拼接Logo路径
	var BaseUrl = c.GetBaseUrl()
	result.Name = "Pledge Token List"
	result.LogoURI = BaseUrl + "storage/img/Pledge-project-logo.png"
	result.Timestamp = time.Now()
	result.Version = response.Version{
		Major: 2,
		Minor: 16,
		Patch: 12,
	}

	// 遍历服务层返回的数据，转换为前端需要的Token格式
	for _, v := range data {
		result.Tokens = append(result.Tokens, response.Token{
			Name:     v.Symbol,
			Symbol:   v.Symbol,
			Decimals: v.Decimals,
			Address:  v.Token,
			ChainID:  v.ChainId,
			LogoURI:  v.Logo,
		})
	}

	// 返回完整的代币列表响应
	ctx.JSON(200, result)
}

// Search 搜索资金池
func (c *PoolController) Search(ctx *gin.Context) {
	res := response.Gin{Res: ctx}
	req := request.Search{}
	result := response.Search{}

	// 验证搜索请求参数
	errCode := validate.NewSearch().Search(ctx, &req)
	if errCode != statecode.CommonSuccess {
		res.Response(ctx, errCode, nil)
		return
	}

	// 调用服务层进行搜索，返回匹配的池列表和总数
	errCode, count, pools := services.NewSearch().Search(&req)
	if errCode != statecode.CommonSuccess {
		res.Response(ctx, errCode, nil)
		return
	}

	// 封装搜索结果并返回
	result.Rows = pools
	result.Count = count
	res.Response(ctx, statecode.CommonSuccess, result)
}

// DebtTokenList 获取债务代币列表
func (c *PoolController) DebtTokenList(ctx *gin.Context) {
	res := response.Gin{Res: ctx}
	req := request.TokenList{}

	// 验证请求参数
	errCode := validate.NewTokenList().TokenList(ctx, &req)
	if errCode != statecode.CommonSuccess {
		res.Response(ctx, errCode, nil)
		return
	}

	// 调用服务层获取债务代币列表
	errCode, result := services.NewTokenList().DebtTokenList(&req)
	if errCode != statecode.CommonSuccess {
		res.Response(ctx, errCode, nil)
		return
	}

	// 返回债务代币列表数据
	res.Response(ctx, statecode.CommonSuccess, result)
}

// GetBaseUrl 获取基础URL（根据域名判断是否包含端口）
func (c *PoolController) GetBaseUrl() string {

	domainName := config.Config.Env.DomainName
	domainNameSlice := strings.Split(domainName, "")
	pattern := "\\d+"
	isNumber, _ := regexp.MatchString(pattern, domainNameSlice[0])

	// 判断域名首字符是否为数字（IP地址），如果是则包含端口号
	if isNumber {
		return config.Config.Env.Protocol + "://" + config.Config.Env.DomainName + ":" + config.Config.Env.Port + "/"
	}
	// 否则为域名，不包含端口号
	return config.Config.Env.Protocol + "://" + config.Config.Env.DomainName + "/"
}
