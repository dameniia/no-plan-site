import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteNav } from "../components/SiteNav";
import { SiteFooter } from "../components/SiteFooter";
import "../css/noplan.css";
import "../css/privacy.css";

// Mirrors docs/PRIVACY-POLICY.md in the app repo (dameniia/no-plan-app), which must
// stay in step with the app's PrivacyInfo.xcprivacy and App Store privacy label.
// Change both together, and bump EFFECTIVE when the substance changes.
const EFFECTIVE = "23 November 2026";
const CONTACT = "admin@no-plan.app";

export function Privacy() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Privacy Policy — noplan";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="np-root">
      <SiteNav />

      <main className="np-section np-legal">
        <article className="np-legal-inner">
          <h1 className="np-heading">Privacy Policy</h1>
          <p className="np-legal-date">Effective {EFFECTIVE}</p>

          <p className="np-body">
            noplan is a workout tracker built to work without an account. The short version:{" "}
            <strong>
              your data stays on your iPhone unless you choose a cloud AI model, and noplan has no
              server of its own.
            </strong>
          </p>

          <h2>What noplan stores</h2>
          <p className="np-body">Everything you enter is stored only on your device:</p>
          <ul className="np-body">
            <li>Your profile answers, such as activity type and fitness level</li>
            <li>
              The name you can optionally give yourself in Profile. It is never sent to an AI model
            </li>
            <li>Your workouts, plans and exercise history</li>
            <li>Your conversations with the Trainer and Guide</li>
            <li>Your app settings</li>
          </ul>
          <p className="np-body">
            There is no sign-up, no account and no noplan server. The developer never receives
            any of this data.
          </p>

          <h2>Apple Health</h2>
          <p className="np-body">
            If you turn on Health sync, noplan reads workouts and heart rate from Apple Health and
            saves the workouts you log back to it. Health data stays on your device. It is{" "}
            <strong>never</strong> sent to an AI provider, to the developer or to anyone else, and
            it is never used for advertising.
          </p>

          <h2>AI features</h2>
          <p className="np-body">You choose which AI model noplan uses, in Profile:</p>
          <ul className="np-body">
            <li>
              <strong>On-device (default).</strong> Apple&apos;s on-device model runs entirely on
              your iPhone. Nothing leaves the device.
            </li>
            <li>
              <strong>Claude (Anthropic) or ChatGPT (OpenAI).</strong> These run with an API key
              that you provide. When you pick one, noplan sends that provider what it needs to
              answer: your profile answers, your logged workout history, your messages, and any gym
              equipment photos you choose to scan. Apple Health data is not included. The request
              goes directly from your iPhone to the provider you picked; noplan never switches you
              to a different provider. That provider handles the data under its own terms:{" "}
              <a href="https://www.anthropic.com/legal/privacy">Anthropic privacy policy</a>,{" "}
              <a href="https://openai.com/policies/privacy-policy">OpenAI privacy policy</a>.
            </li>
          </ul>
          <p className="np-body">Your API key is stored in the iOS Keychain on this device only.</p>

          <h2>Camera and photos</h2>
          <p className="np-body">
            The camera and photo library are used only when you scan gym equipment. The photo is
            analysed by the AI model you selected and is not stored by noplan.
          </p>

          <h2>What noplan does not do</h2>
          <ul className="np-body">
            <li>No analytics, crash-reporting or advertising SDKs</li>
            <li>No tracking across apps or websites</li>
            <li>No selling or sharing of data</li>
          </ul>

          <h2>Deleting your data</h2>
          <p className="np-body">
            Profile → <strong>Erase All Data</strong> removes everything noplan has stored on your
            device. Deleting the app does the same. Workouts already saved to Apple Health can be
            removed in the Health app. Data already sent to an AI provider is governed by that
            provider&apos;s retention policy.
          </p>

          <h2>This website</h2>
          <p className="np-body">
            no-plan.app uses no cookies or analytics. The hosting provider keeps standard server
            logs. If you send feedback, your message and optional email go to a private inbox and
            are used only to reply and improve noplan; to limit spam, the form briefly keeps a
            hashed (not readable) form of your IP address.
          </p>

          <h2>Children</h2>
          <p className="np-body">noplan is not directed at children under 13.</p>

          <h2>Changes</h2>
          <p className="np-body">
            If this policy changes, the new version will be posted on this page with a new
            effective date.
          </p>

          <h2>Contact</h2>
          <p className="np-body">
            Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a> or use the{" "}
            <Link to="/feedback">feedback form</Link>.
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
