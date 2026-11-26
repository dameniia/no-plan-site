import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteNav } from "../components/SiteNav";
import { APP_STORE_URL } from "../lib/appStore";
import { SiteFooter } from "../components/SiteFooter";
import "../css/noplan.css";
import "../css/faq.css";

// Answers mirror the app (dameniia/no-plan-app). When a fact changes there —
// minimum iOS, exercise count, AI providers, what leaves the device — update it
// here too, and keep the privacy answers in step with /privacy.
const GROUPS = [
  {
    id: "basics",
    title: "The basics",
    items: [
      {
        q: "What is noplan?",
        a: (
          <p>
            A workout tracker for iPhone. You build your own plan and swap exercises as you go,
            instead of following a fixed program. AI can help fill gaps and suggest variations,
            but it never takes over.
          </p>
        ),
      },
      {
        q: "Where can I get it?",
        a: (
          <p>
            noplan is free on the <a href={APP_STORE_URL}>App Store</a> (listed as noplan
            Fitness) for iPhone with iOS 18 or later. See what&apos;s coming next on the{" "}
            <a href="/#roadmap">roadmap</a>.
          </p>
        ),
      },
      {
        q: "Do I need an account?",
        a: <p>No. There is no sign-up, no login and no password. Open the app and start.</p>,
      },
      {
        q: "Are there subscriptions or in-app purchases?",
        a: <p>No. noplan has no subscriptions and no in-app purchases.</p>,
      },
      {
        q: "Which devices does it run on?",
        a: (
          <p>
            iPhone with iOS 18 or later, with an optional Apple Watch companion. iPad isn&apos;t
            supported in the first version.
          </p>
        ),
      },
    ],
  },
  {
    id: "workouts",
    title: "Workouts",
    items: [
      {
        q: "How many exercises are built in?",
        a: (
          <p>
            More than 270, searchable by name, muscle or equipment. You can also add your own.
          </p>
        ),
      },
      {
        q: "Can I change a workout while I'm doing it?",
        a: (
          <p>
            Yes. Swap an exercise, add one or edit sets mid-workout. A newly added exercise is
            placed right after the one you&apos;re on, so it&apos;s what you do next.
          </p>
        ),
      },
      {
        q: "Does it work with Apple Watch?",
        a: (
          <p>
            Start a workout on your iPhone and your watch shows live heart rate and calories. You
            can also import workouts you recorded on Apple Watch into your history.
          </p>
        ),
      },
      {
        q: "Does it sync with Apple Health?",
        a: (
          <p>
            If you turn it on in Profile, noplan saves your workouts to Apple Health and reads
            workouts and heart rate from it. Health data stays on your iPhone.
          </p>
        ),
      },
    ],
  },
  {
    id: "ai",
    title: "AI",
    items: [
      {
        q: "Do I have to use AI?",
        a: (
          <p>
            No. Logging workouts and building plans work without it. AI is there when you want a
            suggestion, a plan built around your profile, or help with a piece of equipment.
          </p>
        ),
      },
      {
        q: "Which AI models can I use?",
        a: (
          <p>
            You choose in Profile. <strong>On-device</strong> is the default and runs entirely on
            your iPhone; it needs an iPhone that supports Apple Intelligence, on iOS 26 or later.{" "}
            <strong>Claude</strong> or <strong>ChatGPT</strong> give fuller answers and use your
            own API key.
          </p>
        ),
      },
      {
        q: "Why do Claude and ChatGPT need my own API key?",
        a: (
          <p>
            noplan has no server and no subscription, so there&apos;s nothing in between: your
            iPhone talks to the provider directly and the provider bills you for what you use. Get
            a key at console.anthropic.com or platform.openai.com and paste it in Profile. It&apos;s
            stored in the iOS Keychain on that iPhone only.
          </p>
        ),
      },
      {
        q: "What does the AI see?",
        a: (
          <p>
            With on-device AI, nothing leaves your iPhone. With Claude or ChatGPT, the provider you
            picked receives what it needs to answer: your profile answers, logged workout history,
            your messages and any equipment photos you scan. Apple Health data is never sent.
          </p>
        ),
      },
      {
        q: "How does equipment scanning work?",
        a: (
          <p>
            Take or pick a photo of a machine or the equipment you have, and the AI model you chose
            suggests exercises you can do with it. The photo isn&apos;t stored by noplan.
          </p>
        ),
      },
    ],
  },
  {
    id: "data",
    title: "Your data",
    items: [
      {
        q: "Where is my data stored?",
        a: (
          <p>
            On your iPhone. There&apos;s no cloud sync between devices; your regular iPhone backup
            (iCloud or computer) includes it.
          </p>
        ),
      },
      {
        q: "How do I delete my data?",
        a: (
          <p>
            Profile → <strong>Erase All Data</strong> removes everything noplan stored on your
            iPhone. Deleting the app does the same. Workouts saved to Apple Health can be removed
            in the Health app.
          </p>
        ),
      },
      {
        q: "Where's the full privacy policy?",
        a: (
          <p>
            Read it <Link to="/privacy">here</Link>.
          </p>
        ),
      },
    ],
  },
];

export function Faq() {
  useEffect(() => {
    const previous = document.title;
    document.title = "FAQ — noplan";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="np-root">
      <SiteNav />

      <main className="np-section np-faq">
        <div className="np-faq-inner">
          <header className="np-faq-head">
            <p className="np-eyebrow">FAQ</p>
            <h1 className="np-heading">Questions, answered.</h1>
            <p className="np-body">
              Short answers about noplan, its AI and your data.
            </p>
            <nav className="np-faq-jump" aria-label="FAQ sections">
              {GROUPS.map(({ id, title }) => (
                <a key={id} href={`#${id}`} className="np-faq-chip">{title}</a>
              ))}
            </nav>
          </header>

          {GROUPS.map(({ id, title, items }) => (
            <section key={id} id={id} className="np-faq-group" aria-labelledby={`${id}-title`}>
              <h2 id={`${id}-title`} className="np-faq-group-title">{title}</h2>
              <div className="np-faq-list">
                {items.map(({ q, a }) => (
                  <details key={q} className="np-faq-item">
                    <summary>
                      <span className="np-faq-q">{q}</span>
                      <span className="np-faq-toggle" aria-hidden="true" />
                    </summary>
                    <div className="np-faq-a">{a}</div>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <aside className="np-faq-more">
            <h2 className="np-faq-group-title">Still have a question?</h2>
            <p className="np-body">
              Messages go straight to the person building noplan.
            </p>
            <div className="np-faq-more-actions">
              <Link to="/feedback" className="np-pill np-pill--solid np-pill--lg">Send feedback</Link>
              <a href="mailto:admin@no-plan.app" className="np-pill np-pill--ghost np-pill--lg">
                admin@no-plan.app
              </a>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
