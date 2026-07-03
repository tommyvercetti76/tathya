/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Full CSP is on the hardening roadmap (docs/SECURITY.md): it requires
          // self-hosting tesseract.js wasm/traineddata and the Commons images first,
          // so the policy can drop third-party script/img origins entirely.
        ],
      },
    ];
  },
};

export default nextConfig;
