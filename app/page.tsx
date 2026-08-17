import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  let dbStatus: string;
  let dbTime: string | null = null;

  try {
    const rows = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() as now`;
    dbStatus = "connected";
    dbTime = rows[0]?.now?.toISOString() ?? "unknown";
  } catch (err) {
    dbStatus = "error: " + (err instanceof Error ? err.message : String(err));
  }

  return (
    <main
      style={{
        maxWidth: 640,
        margin: "80px auto",
        padding: "0 24px",
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ marginBottom: 4 }}>Wrap Lab</h1>
      <p style={{ color: "#555", marginTop: 0 }}>
        Next.js on Vercel, PostgreSQL on Supabase, Prisma 7 ORM.
      </p>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: "16px 20px",
          marginTop: 32,
        }}
      >
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>Deployment status</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li>
            App:{" "}
            <strong style={{ color: "#16a34a" }}>running</strong>
          </li>
          <li>
            Database:{" "}
            <strong style={{ color: dbStatus === "connected" ? "#16a34a" : "#dc2626" }}>
              {dbStatus}
            </strong>
            {dbTime && (
              <span style={{ color: "#777", fontSize: 13 }}>
                {" "}
                (server time {dbTime})
              </span>
            )}
          </li>
          <li>
            Supabase URL:{" "}
            <strong>
              {process.env.NEXT_PUBLIC_SUPABASE_URL
                ? "configured"
                : "not set"}
            </strong>
          </li>
        </ul>
      </section>
    </main>
  );
}
