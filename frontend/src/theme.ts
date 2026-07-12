import { ThemeConfig } from 'antd';

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#06b6d4',
    colorBgBase: '#09090b',
    colorBgContainer: '#18181b',
    colorBgElevated: '#27272a',
    colorTextBase: '#fafafa',
    colorTextSecondary: '#a1a1aa',
    colorBorder: '#27272a',
    borderRadius: 8,
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Layout: {
      bodyBg: '#09090b',
      headerBg: '#18181b',
      siderBg: '#18181b',
    },
    Menu: {
      darkItemBg: '#18181b',
      darkItemSelectedBg: 'rgba(6, 182, 212, 0.1)',
      darkItemHoverBg: '#27272a',
    },
    Button: {
      colorPrimary: '#06b6d4',
      colorPrimaryHover: '#0891b2',
      colorPrimaryActive: '#164e63',
    },
  },
};
