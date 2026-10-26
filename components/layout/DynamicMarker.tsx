import { Suspense } from "react";
import { connection } from "next/server";

async function Connection() {
  await connection();
  return null;
}

// Renders nothing. Tells Next.js (Cache Components) that this route's metadata
// is meant to resolve at request time — needed on dynamic [id] routes, whose
// link-preview tags depend on the URL — while the page shell still prerenders.
export default function DynamicMarker() {
  return (
    <Suspense>
      <Connection />
    </Suspense>
  );
}
