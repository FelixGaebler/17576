export default function Home() {
  return (
    <main>
      <h1>Next.js on Prisma Compute</h1>
      <p>This app uses Next.js App Router, Prisma ORM, and PostgreSQL.</p>
      <p>
        Query the seeded users at{' '}
        <a href="/api/users">
          <code>/api/users</code>
        </a>
        .
      </p>
      <p>
        Connect it with <code>bun run compute:connect</code>
        , then push to deploy with Prisma Composer.
      </p>
    </main>
  )
}
