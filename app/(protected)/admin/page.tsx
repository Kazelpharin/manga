
import { redirect } from "next/navigation";
import { getCurentUser } from "@/lib/session";



export default async function Page() { 
const user = await getCurentUser();
if (!user || user.role !== "ADMIN") redirect("/");
    return (
        <div>
        <h1>Admin Page</h1>
        <p>This page is only accessible to authenticated users.</p>
        </div>
    );
}