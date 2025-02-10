export function Home() {
  return (
    <div class="home">
      <header>
        <h1>Install the CLI</h1>
      </header>
      <main>
        <h2>Installation</h2>
        <p>Follow these steps to install:</p>
        <pre class="install-command">
          <code>curl -fsSL https://cli.ahh.bet/install.sh | bash</code>
        </pre>
        <h3>Further Resources</h3>
        <section>
          <Resource
            title="Docs"
            description="Documentation and guides on how to use."
            href="https://cli.ahh.bet/docs"
          />
        </section>
      </main>
    </div>
  );
}

function Resource(props) {
  return (
    <a href={props.href} target="_blank" class="resource">
      <h2>{props.title}</h2>
      <p>{props.description}</p>
    </a>
  );
}
