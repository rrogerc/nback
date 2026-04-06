/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare module "*.wav" {
  const src: string;
  export default src;
}
