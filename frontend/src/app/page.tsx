import AuthGuard from "../components/auth/AuthGuard";
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <AuthGuard>
      <div>dida</div>
    </AuthGuard>
  );
}
