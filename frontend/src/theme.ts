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
    colorBorderSecondary: '#27272a',
    borderRadius: 8,
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    // Fix text selection highlight (photo 1 issue)
    colorPrimaryBg: 'rgba(6, 182, 212, 0.12)',
    colorPrimaryBgHover: 'rgba(6, 182, 212, 0.2)',
    colorPrimaryBorder: '#0891b2',
    colorPrimaryBorderHover: '#06b6d4',
    colorTextPlaceholder: '#71717a',
    colorTextDisabled: '#52525b',
  },
  components: {
    Layout: {
      bodyBg: '#09090b',
      headerBg: '#18181b',
      siderBg: '#18181b',
    },
    Menu: {
      darkItemBg: '#18181b',
      darkItemSelectedBg: 'rgba(6, 182, 212, 0.12)',
      darkItemHoverBg: '#27272a',
      darkSubMenuItemBg: '#18181b',
    },
    Button: {
      colorPrimary: '#06b6d4',
      colorPrimaryHover: '#0891b2',
      colorPrimaryActive: '#164e63',
    },
    Input: {
      activeBg: '#27272a',
      hoverBg: '#27272a',
      colorBgContainer: '#27272a',
      colorText: '#fafafa',
      // Fix the blue selection highlight (photo 1)
      activeShadow: '0 0 0 2px rgba(6,182,212,0.2)',
    },
    Select: {
      colorBgContainer: '#27272a',
      colorBgElevated: '#27272a',
      optionSelectedBg: 'rgba(6, 182, 212, 0.15)',
    },
    DatePicker: {
      colorBgContainer: '#27272a',
      colorBgElevated: '#27272a',
    },
    Table: {
      colorBgContainer: '#18181b',
      headerBg: '#27272a',
      rowHoverBg: 'rgba(255,255,255,0.04)',
      borderColor: '#27272a',
    },
    Card: {
      colorBgContainer: '#18181b',
      colorBorderSecondary: '#27272a',
    },
    Drawer: {
      colorBgElevated: '#18181b',
    },
    Modal: {
      contentBg: '#18181b',
      headerBg: '#18181b',
    },
    Tag: {
      // Fix miscolored tags (photo 2) — ensure dark-mode safe colors
      colorSuccess: '#22c55e',
      colorSuccessBg: 'rgba(34, 197, 94, 0.12)',
      colorSuccessBorder: 'rgba(34, 197, 94, 0.3)',
      colorError: '#ef4444',
      colorErrorBg: 'rgba(239, 68, 68, 0.12)',
      colorErrorBorder: 'rgba(239, 68, 68, 0.3)',
      colorWarning: '#f97316',
      colorWarningBg: 'rgba(249, 115, 22, 0.12)',
      colorWarningBorder: 'rgba(249, 115, 22, 0.3)',
      colorProcessing: '#06b6d4',
    },
    Alert: {
      colorInfoBg: 'rgba(6, 182, 212, 0.08)',
      colorInfoBorder: 'rgba(6, 182, 212, 0.25)',
      colorInfoText: '#fafafa',
      colorInfoIcon: '#06b6d4',

      colorSuccessBg: 'rgba(34, 197, 94, 0.08)',
      colorSuccessBorder: 'rgba(34, 197, 94, 0.25)',
      colorSuccessText: '#fafafa',
      colorSuccessIcon: '#22c55e',

      colorWarningBg: 'rgba(245, 158, 11, 0.08)',
      colorWarningBorder: 'rgba(245, 158, 11, 0.2)',
      colorWarningText: '#fafafa',
      colorWarningIcon: '#f59e0b',

      colorErrorBg: 'rgba(239, 68, 68, 0.08)',
      colorErrorBorder: 'rgba(239, 68, 68, 0.25)',
      colorErrorText: '#fafafa',
      colorErrorIcon: '#ef4444',
    },
    Statistic: {
      colorTextDescription: '#a1a1aa',
    },
  },
};
