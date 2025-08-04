import { Suspense } from "solid-js";
import { Body, Head, Html, Routes, FileRoutes, Scripts } from "solid-start";
import "./app.css";

export default function Root() {
  return (
    <Html lang="en">
      <Head />
      <Body>
        <Suspense>
          <Routes>
            <FileRoutes />
          </Routes>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}
