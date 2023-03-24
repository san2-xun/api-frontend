import Footer from '@/components/Footer';
import RightContent from '@/components/RightContent';
import {BookOutlined, LinkOutlined} from '@ant-design/icons';
import {PageLoading, SettingDrawer} from '@ant-design/pro-components';
import type {RunTimeLayoutConfig} from 'umi';
import {history, Link} from 'umi';
import {RequestConfig} from '@@/plugin-request/request';
import {getLoginUserUsingGET} from '@/services/api-backend/userController';
import type {Settings as LayoutSettings} from '@ant-design/pro-layout';
import defaultSettings from '../config/defaultSettings';

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';

/** 获取用户信息比较慢的时候会展示一个 loading */
export const initialStateConfig = {
  loading: <PageLoading/>,
};

export const request: RequestConfig = {
  // prefix: 'http://localhost:8101',
  // withCredentials: true,
  timeout: 1000000,
};

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
// export async function getInitialState(): Promise<InitialState> {
//   const state: InitialState = {
//     loginUser: undefined,
//   };
//   try {
//     const res = await getLoginUserUsingGET();
//     if (res.data) {
//       state.loginUser = res.data;
//     }
//   } catch (error) {
//     history.push(loginPath);
//   }
//   return state;
// }

export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.UserVO;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.UserVO | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      const res = await getLoginUserUsingGET();  // /api/user/get/login
      if (res.data) {
        return res.data;
      }
    } catch (error) {
      history.push(loginPath);
    }
    return undefined;
  };
  // 如果是登录页面，不用获取当前用户信息
  if (history.location.pathname == loginPath) {
    return {
      fetchUserInfo,
      settings: defaultSettings,
    };
  }
  // const res = await getLoginUserUsingGET();
  // 如果需要登录信息页面，要去获取当前用户信息
  const res = await fetchUserInfo();
  return {
    fetchUserInfo,
    currentUser: res? res: undefined,
    settings: defaultSettings,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({initialState, setInitialState}) => {
  return {
    rightContentRender: () => <RightContent/>,
    disableContentMargin: false,
    waterMarkProps: {
      content: initialState?.currentUser?.userName,
    },
    footerRender: () => <Footer/>,
    onPageChange: () => {
      const {location} = history;
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    links: isDev
      ? [
        <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
          <LinkOutlined/>
          <span>OpenAPI 文档</span>
        </Link>,
        <Link to="/~docs" key="docs">
          <BookOutlined/>
          <span>业务组件文档</span>
        </Link>,
      ]
      : [],
    menuHeaderRender: undefined,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children, props) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
          {!props.location?.pathname?.includes('/login') && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    ...initialState?.settings,
  };
};
