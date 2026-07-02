import { Suspense } from "react";
import Loading from "../../../loading";

export default function CampusLoading() {
  return (
    <Suspense fallback={<Loading />}>
      <Loading />
    </Suspense>
  );
}
