
import React, { useEffect, useState } from "react";
import { DashboardResponse } from "@/interfaces/DashboardResponse";

const DashboardPage: React.FC = () => {
    const [data, setData] = useState<DashboardResponse | null>(null);

    useEffect(() => {
        fetch("/api/dashboard")
            .then((res) => res.json())
            .then((json: DashboardResponse) => setData(json))
            .catch(() => setData(null));
    }, []);

    return (
        <div style={{ padding: 32 }}>
            <h1>Dashboard</h1>
            <pre style={{ background: "#f5f5f5", padding: 16, borderRadius: 8 }}>
                {data ? JSON.stringify(data, null, 2) : "Carregando..."}
            </pre>
        </div>
    );
};

export default DashboardPage;