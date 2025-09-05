"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function useAdminAuth(redirect = true) {
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/admin/me', { withCredentials: true });
        setOk(res.status === 200);
      } catch {
        setOk(false);
        if (redirect) router.push('/admin/login');
      } finally { setLoading(false); }
    })();
    // redirect and router are intentionally not included in deps to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading, ok };
}
