import nextConfig from 'eslint-config-next';

export default [
  ...nextConfig,
  {
    ignores: ['demo_crm/**'],
  },
];
