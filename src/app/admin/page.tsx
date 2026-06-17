import { redirect } from "next/navigation";

/* /admin → the only admin destination in scope. */
export default function AdminIndex() {
  redirect("/admin/approvals");
}
