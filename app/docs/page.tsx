"use client";

import { useEffect } from "react";

export default function DocsPage() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist/swagger-ui.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js";
    script.onload = () => {
      // @ts-expect-error swagger ui global
      window.SwaggerUIBundle({
        url: "/api/openapi",
        dom_id: "#swagger-ui",
      });
    };
    document.body.appendChild(script);
  }, []);

  return <div id="swagger-ui" />;
}
