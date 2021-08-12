/**
 * 状态管理--用户（刷新页面会消失，要兼容浏览器需要本地存一份）
 * @description 用户相关的数据全部存于该文件
 * @Author lss 
 * @Date 2021-3-8
 */
// import cache from '@/common/js/cache'
import {
	login,
	logout,
	getPermissionMenu,
	getUserInfo
} from '@/api/user'

const state = {
	token: '',
	openid: null,
	userInfo: {},		// 用户信息（userInfo、token 其他api请求依赖这两项，所以需要持久化存本地，防止用户刷新浏览器导致数据丢失）
	wxInfo: {}, 		// 微信授权后的临时信息
	permissionMenu: [], // 当前用户权限菜单
}

// 更改 Vuex 的 store 中的状态的唯一方法是提交 mutation。统一入口，常量命名，必须是同步函数
// 使用方法：可以在组件中使用 this.$store.commit('user/xxx') 提交 mutation。但是建议少直接调用，而是通过Action 方法触发
const mutations = {
	DO_LOGIN(state, payload) {
		// state.loginProvider = payload.provider;
		state.token = payload.token;
		// 缓存本地，兼容H5刷新。默认8小时候过期
		/* cache.put('token', payload.userInfo.token, 60 * 60 * 8)
		cache.put('userInfo', payload.userInfo, 60 * 60 * 8) 	// 只包含部分用户信息 */
		sessionStorage['token'] = payload.token
		// sessionStorage['userInfo'] = JSON.stringify(payload.userInfo)
	},
	DO_LOGOUT(state) {
		// 登出后清除相关状态数据 2021/3/9
		// state = {}	// 不能这样写，导致数据更新异常bug
		state.token = ''
		state.permissionMenu = []
		sessionStorage.clear()
	},
	SET_OPENID(state, openid) {
		state.openid = openid
	},
	// 设置用户信息
	SET_USERINFO(state, payload) {
		state.userInfo = payload.userInfo
		// cache.put('userInfo', payload.userInfo, 60 * 60 * 8) // 包含全部用户信息
		sessionStorage['userInfo'] = JSON.stringify(payload.userInfo) 
	},
	// 设置微信信息
	SET_WXINFO(state, payload) {
		state.wxInfo = payload.wxInfo
	},
	// 设置用户菜单
	SET_PERMISSIONMENU(state, payload) {
		state.permissionMenu = payload.permissionMenu
	},
}

// Action 类似于 mutation，不同在于：Action 提交的是 mutation，而不是直接变更状态。Action 可以包含任意异步操作。
// 使用方法：在组件中使用 this.$store.dispatch('user/xxx') 分发 action，或者使用 mapActions 辅助函数将组件的 methods 映射为 store.dispatch 调用
const actions = {
	// 账号、手机号登录
	login({ commit }, data){
		return new Promise((rs, rj)=>{
			// 返回部分用户信息
			login(data).then(res=>{
				if (!res){
					return
				}
				commit('DO_LOGIN', { token: res })
				rs(res)
			}).catch(err=>{
				rj(err)
			})
		})
	},
	// 第三方平台登录
	thirdLogin({ commit }, data){
		return new Promise((rs, rj)=>{
			// 返回部分用户信息
			thirdpartyLogin(data).then(res=>{
				if (!res){
					return
				}
				commit('DO_LOGIN', { userInfo: res })
				rs(res)
			}).catch(err=>{
				rj(err)
			})
		})
	},
	// 退出
	logout({ commit }){
		return new Promise((rs, rj)=>{
			logout().then(res=>{
				commit('DO_LOGOUT')
				rs(res)
			}).catch(err=>{
				rj(err)
			})
		})
	},
	// 直接异步函数写法 
	// async logout({ commit }){
	// 	commit('DO_LOGOUT', await logout())
	// },
	getUserInfo({ commit }, data){
		// commit('SET_USERINFO', { userInfo: getUserInfo() })
		return new Promise((rs, rj)=>{
			// 返回全部用户信息
			getUserInfo(data).then(res=>{
				if (!res){
					return
				}
				commit('SET_USERINFO', { userInfo: res })
				rs(res)
			}).catch(err=>{
				rj(err)
			})
		})
	},
	setUserInfo({ commit }, data){
		commit('SET_USERINFO', { userInfo: data })
	},
	// 获取用户权限菜单
	getPermissionMenu({ commit }, data){
		return new Promise((rs, rj)=>{
			// 优先使用状态数据
			if (state.permissionMenu.length > 0) {
				rs(state.permissionMenu)
			} else {
				let menu = '[{"icon":"el-icon-lx-home","path":"/dashboard","title":"系统首页"},{"icon":"el-icon-lx-cascades","path":"/baseTable","title":"基础表格"},{"icon":"el-icon-lx-copy","path":"/tabs","title":"tab选项卡"},{"icon":"el-icon-office-building","path":"/org","title":"组织机构","children":[{"path":"/org/demo/index","title":"组织机构逻辑"},{"path":"/org/userdepManage/index","title":"用户部门管理"},{"path":"/org/menuManage/index","title":"菜单管理"},{"path":"/org/roleManage/index","title":"角色管理"},{"path":"/org/postManage/index","title":"岗位管理"}]},{"icon":"el-icon-lx-calendar","path":"/form","title":"表单相关","children":[{"path":"/form/baseform","title":"基本表单"},{"path":"/form-2","title":"三级菜单","children":[{"path":"/form/form-2/editor","title":"富文本编辑器"},{"path":"/form/form-2/markdown","title":"markdown编辑器"}]},{"path":"/form/upload","title":"文件上传"}]},{"icon":"el-icon-lx-emoji","path":"/icon","title":"自定义图标"},{"icon":"el-icon-pie-chart","path":"/baseCharts","title":"schart图表"},{"icon":"el-icon-lx-global","path":"/i18n","title":"国际化功能"},{"icon":"el-icon-lx-warn","path":"/error","title":"错误处理","children":[{"path":"/error/403","title":"403页面"},{"path":"/error/404","title":"404页面"}]}]';
				commit('SET_PERMISSIONMENU', { permissionMenu: JSON.parse(menu) })

				/* getPermissionMenu(data).then(res=>{
					if (!res){
						return
					}
					commit('SET_PERMISSIONMENU', { permissionMenu: res })
					rs(res)
				}).catch(err=>{
					rj(err)
				})*/
			}
		})
	},
}

export default {
	namespaced: true,
	state,
	mutations,
	actions
}
