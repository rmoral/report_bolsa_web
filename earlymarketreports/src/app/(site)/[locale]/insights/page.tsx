export default async function InsightsPage() {
  const res = await fetch('http://localhost:3000/api/posts', { cache: 'no-store' })
  const data = await res.json()

  return (
    <div>
      <h1>Insights</h1>
      <ul>
        {data.docs?.map((p: any) => (
          <li key={p.id}>
            {p.title} — {p.slug}
          </li>
        ))}
      </ul>
    </div>
  )
}

