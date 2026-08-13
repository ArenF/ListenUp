import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
    // Cloudflare Tunnel(네임드 터널의 커스텀 도메인 포함)로 접근할 수 있도록 허용.
    // 터널이 외부 접근의 게이트키퍼 역할을 하므로 테스트 용도로 모든 호스트를 연다.
    // 특정 도메인만 허용하려면 [".example.com"] 형태로 좁힐 수 있다.
    allowedHosts: true,
    proxy: {
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true,
        changeOrigin: true,
        secure: false,
        // WebSocket 에러를 조용히 처리 (정상적인 연결 종료)
        configure: (proxy, _options) => {
          proxy.on('error', (err: Error & { code?: string }, _req, _res) => {
            if (err.code === 'ECONNRESET') {
              // 정상적인 연결 종료는 로그 출력 안 함
              return;
            }
            console.log('proxy error', err);
          });
        },
      },
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
