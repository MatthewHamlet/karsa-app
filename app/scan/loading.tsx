import PageSkeleton from "../components/PageSkeleton";

/* wajib ada biar route ini bisa di-prefetch. next gak prefetch route
   dinamis kalau gak punya loading boundary. */
export default function Loading() {
  return <PageSkeleton />;
}
