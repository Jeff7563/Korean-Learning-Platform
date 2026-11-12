import type { Metadata } from "next";import "./globals.css";import {Navigation} from "@/components/navigation";
export const metadata:Metadata={title:"ฮันกึล — เรียนภาษาเกาหลี",description:"เส้นทางเรียนภาษาเกาหลีสำหรับผู้เริ่มต้นและเตรียม EPS-TOPIK"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="th"><body><div className="app"><Navigation/><main>{children}</main></div></body></html>}
