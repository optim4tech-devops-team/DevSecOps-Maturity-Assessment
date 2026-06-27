"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CategoryScore } from "@/features/scoring/scoring";

export function ScoreDonut({ score }: { score: number }) {
  const data = [{ name: "score", value: score }, { name: "remaining", value: 100 - score }];
  return (
    <ResponsiveContainer width="100%" height={210}>
      <PieChart>
        <Pie data={data} innerRadius={68} outerRadius={88} dataKey="value" startAngle={90} endAngle={-270}>
          <Cell fill="#0f9f8f" />
          <Cell fill="#e8edf1" />
        </Pie>
        <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="fill-ink text-4xl font-semibold">{score}</text>
        <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" className="fill-muted text-xs">overall score</text>
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CategoryBars({ scores }: { scores: CategoryScore[] }) {
  const data = scores.filter((item) => item.score > 0).slice(0, 10).map((item) => ({ name: item.category.name.split(" ")[0], score: item.score }));
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#edf1f4" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#667085" }} />
        <YAxis tick={{ fontSize: 11, fill: "#667085" }} domain={[0, 100]} />
        <Tooltip />
        <Bar dataKey="score" fill="#0f9f8f" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MaturityRadar({ scores }: { scores: CategoryScore[] }) {
  const data = scores.filter((item) => item.score > 0).slice(0, 8).map((item) => ({ subject: item.category.name.split(" ")[0], score: item.score }));
  return (
    <ResponsiveContainer width="100%" height={230}>
      <RadarChart data={data}>
        <PolarGrid stroke="#d9e1e7" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#667085" }} />
        <Radar dataKey="score" stroke="#0f9f8f" fill="#0f9f8f" fillOpacity={0.2} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}
