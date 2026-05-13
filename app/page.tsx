import { redirect } from "next/navigation";

/** Root sends visitors to the portal chooser. */
export default function RootPage() {
  redirect("/home");
}
