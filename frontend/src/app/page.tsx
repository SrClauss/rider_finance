"use client";
import { useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import LoggedLayout from "@/layouts/LoggedLayout";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    axios
      .get("/api/validate_token", { withCredentials: true })
      .then((res) => {
        if (res.data && res.data.valid) {
          router.replace("/dashboard");
        }
      })
      .catch(() => {});
  }, []);

  return (
    <LoggedLayout>
      <div>Bem-vindo ao Rider Finance</div>
    </LoggedLayout>
  );
}
