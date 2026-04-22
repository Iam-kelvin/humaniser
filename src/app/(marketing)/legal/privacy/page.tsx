export default function PrivacyPage() {
  return (
    <div className="container-shell page-fade py-12">
      <article className="panel prose prose-slate max-w-none p-8">
        <h1>Privacy Policy</h1>
        <p>
          Humaniser stores account information, rewrite inputs, rewrite outputs, usage records, and billing references
          needed to operate the service. We use this data to authenticate users, process rewrites, manage subscriptions,
          and improve reliability.
        </p>
        <p>
          We do not position Humaniser as a tool for detector evasion. The service is designed to preserve meaning while
          improving tone, flow, and readability for legitimate writing workflows.
        </p>
        <p>
          You may request account deletion and data removal by contacting support. Payment details are handled by our
          billing providers rather than stored directly in our application database.
        </p>
      </article>
    </div>
  );
}
