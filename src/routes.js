// Every page the build pre-renders to static HTML (scripts/prerender.js), with the
// <title> and description that go in its <head>. Keep in step with:
//   - the <Route>s in src/App.jsx
//   - the RewriteRule list in public/.htaccess
//   - public/sitemap.xml and public/llms.txt (public pages only)
export const PAGES = [
  {
    path: "/",
    file: "index.html",
    title: "noplan — App as a tool",
    description:
      "noplan is a minimal iOS fitness app. Scan your equipment, get exercise suggestions, log workouts in seconds. No account, your data stays on your iPhone.",
  },
  {
    path: "/faq",
    file: "faq.html",
    title: "FAQ — noplan",
    description:
      "Answers about noplan: devices, exercises, Apple Health and Watch, AI models, and where your data is stored.",
  },
  {
    path: "/roadmap",
    file: "roadmap.html",
    title: "Roadmap — noplan",
    description: "Everything planned, in progress and released for noplan, with search and filters.",
  },
  {
    path: "/next",
    file: "next.html",
    title: "Next build — noplan",
    description: "What's planned, in development, in testing and ready for noplan's next build.",
  },
  {
    path: "/privacy",
    file: "privacy.html",
    title: "Privacy Policy — noplan",
    description:
      "noplan's privacy policy: what the app stores on your iPhone, what reaches an AI provider, and what this website collects.",
  },
  {
    path: "/feedback",
    file: "feedback.html",
    title: "Feedback — noplan",
    description: "Send feedback or a question about noplan to the developer.",
  },
  {
    path: "/post",
    file: "post.html",
    title: "noplan — App as a tool",
    description: "noplan post canvas.",
    noindex: true,
    // Screenshot canvas: iOS Safari's App Store banner would sit on top of it
    noAppBanner: true,
  },
  {
    // Served by Apache as the body of every 404 (ErrorDocument in public/.htaccess)
    path: "/404",
    file: "404.html",
    title: "Page not found — noplan",
    description: "There's nothing at this address.",
    noindex: true,
  },
];
