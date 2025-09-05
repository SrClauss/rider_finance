"use client";
import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type ChartPoint = { label: string; value: number };

export default function Charts({ data }: { data: ChartPoint[] }) {
  if (!data || data.length === 0) return <div style={{ height: 240 }}>Sem dados</div>;
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#2BD34F" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
