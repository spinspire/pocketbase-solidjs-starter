import { Title } from "@solidjs/meta";
import { createSignal } from "solid-js";
import ImgModal from "@/components/ImgModal";
import { alerts } from "@/lib/alerts";
import styles from "./ref-ui.module.scss";

// oat-css web components ship without framework bindings — declare them so
// TypeScript accepts the custom elements used in the WebComponents section.
declare module "@solidjs/web" {
  namespace JSX {
    interface IntrinsicElements {
      "ot-tabs": JSX.HTMLAttributes<HTMLElement>;
      "ot-dropdown": JSX.HTMLAttributes<HTMLElement>;
    }
  }
}

const THUMB = "https://picsum.photos/seed/uiref/400/300";
const FULL = "https://picsum.photos/seed/uiref/800/600";

export default function UiReference() {
  const [progress, setProgress] = createSignal(60);

  return (
    <main>
      <Title>UI Reference - PocketBase SolidJS</Title>
      <h1>UI Reference</h1>

      <p>
        This project uses{" "}
        <a href="https://oat.ink/demo/" target="_blank" rel="noopener">
          oat-css
        </a>{" "}
        as its UI framework. Below are the patterns and customizations specific to this starter. For
        the full component catalog, see the{" "}
        <a href="https://oat.ink/demo/" target="_blank" rel="noopener">
          official oat demo
        </a>
        .
      </p>

      <section class={styles.section}>
        <h2>Custom Theme</h2>
        <p>
          Slate colors are defined in <code>src/App.scss</code> using oat's CSS variables with{" "}
          <code>light-dark()</code> for automatic dark mode:
        </p>
        <pre>
          <code>{`--primary: light-dark(#0f172a, #f8fafc);
--secondary: light-dark(#f1f5f9, #1e293b);
--success: light-dark(#008032, #6cc070);
--danger: light-dark(#d32f2f, #f4807b);
--warning: light-dark(#a65b00, #f0a030);`}</code>
        </pre>
        <div class="hstack gap-2">
          <button>Primary</button>
          <button data-variant="secondary">Secondary</button>
          <button data-variant="danger">Danger</button>
          <button class="outline">Outline</button>
          <button class="ghost">Ghost</button>
        </div>
      </section>

      <section class={styles.section}>
        <h2>Component: Image Lightbox</h2>
        <p>
          Oat's <code>&lt;dialog&gt;</code> opens natively. Our <code>&lt;ImgModal&gt;</code>{" "}
          component (<code>src/components/ImgModal.tsx</code>, props <code>src</code>/
          <code>full</code>/<code>alt</code>) wraps a thumbnail button with a native{" "}
          <code>&lt;dialog&gt;</code> lightbox — backdrop click and Escape dismiss:
        </p>
        <pre>
          <code>{`<ImgModal
  src="https://picsum.photos/seed/uiref/400/300"
  full="https://picsum.photos/seed/uiref/800/600"
  alt="Demo image"
/>`}</code>
        </pre>
        <ImgModal src={THUMB} full={FULL} alt="Demo image" />
      </section>

      <section class={styles.section}>
        <h2>Alerts</h2>
        <p>
          The <code>alerts</code> API (<code>src/lib/alerts.ts</code>) exposes <code>info</code>/
          <code>success</code>/<code>warning</code>/<code>error</code>.{" "}
          <code>&lt;Alerts /&gt;</code> is rendered globally by the app shell, so callers just fire
          alerts:
        </p>
        <div class="hstack gap-2">
          <button class="small" onClick={() => alerts.info("Informational message.")}>
            Info
          </button>
          <button
            class="small"
            data-variant="secondary"
            onClick={() => alerts.success("Saved!", 3000)}
          >
            Success
          </button>
          <button class="small" data-variant="warning" onClick={() => alerts.warning("Check this.")}>
            Warning
          </button>
          <button class="small" data-variant="danger" onClick={() => alerts.error("Failed.")}>
            Error
          </button>
        </div>
      </section>

      <section class={styles.section}>
        <h2>Loading Indicators</h2>
        <p>
          Oat styles <code>aria-busy</code> natively — no spinner component needed:
        </p>
        <div class="hstack gap-2">
          <div aria-busy="true" />
          <div aria-busy="true" data-spinner="large" />
          <button aria-busy="true" disabled>
            Loading
          </button>
        </div>
      </section>

      <section class={styles.section}>
        <h2>Cards in This Project</h2>
        <p>
          Oat cards use <code>&lt;article&gt;</code> with <code>&lt;header&gt;</code> and{" "}
          <code>&lt;footer&gt;</code>. We use the <code>.row</code>/<code>.col-*</code> grid for
          layouts.
        </p>
        <div class="row">
          <article class="card col-4">
            <header>
              <h3>Post Card</h3>
              <span class="badge" data-variant="success">
                Published
              </span>
            </header>
            <p>Content goes here. No custom classes needed.</p>
            <footer class="hstack gap-2">
              <button class="outline small">Edit</button>
              <button class="small">View</button>
            </footer>
          </article>
          <article class="card col-4">
            <header>
              <h3>Interactive Progress</h3>
            </header>
            <progress value={progress()} max="100" />
            <p class="text-light">{progress()}% complete</p>
            <footer class="hstack gap-2">
              <button class="ghost small" onClick={() => setProgress((v) => Math.max(0, v - 10))}>
                -10
              </button>
              <button class="ghost small" onClick={() => setProgress((v) => Math.min(100, v + 10))}>
                +10
              </button>
            </footer>
          </article>
          <article class="card col-4">
            <header>
              <h3>Empty State</h3>
            </header>
            <p class="text-light text-center">Nothing here yet.</p>
            <footer class={`hstack justify-center ${styles.mt4}`}>
              <button onClick={() => alerts.info("Created!")}>New Item</button>
            </footer>
          </article>
        </div>
      </section>

      <section class={styles.section}>
        <h2>Forms Pattern</h2>
        <p>
          Oat uses <code>&lt;label data-field&gt;</code> for styled inputs. Input groups use{" "}
          <code>&lt;fieldset class="group"&gt;</code> or <code>role="group"</code>.
        </p>
        <div class="row">
          <div class="col-6">
            <form onSubmit={(e) => e.preventDefault()}>
              <label data-field>
                Name
                <input type="text" placeholder="Enter name" />
              </label>
              <label data-field>
                <input type="checkbox" role="switch" /> Notifications
              </label>
              <fieldset class="hstack gap-4">
                <legend>Priority</legend>
                <label>
                  <input type="radio" name="p" value="low" /> Low
                </label>
                <label>
                  <input type="radio" name="p" value="med" checked /> Medium
                </label>
                <label>
                  <input type="radio" name="p" value="high" /> High
                </label>
              </fieldset>
              <button type="submit">Save</button>
            </form>
          </div>
          <div class="col-6">
            <fieldset class="group">
              <input type="text" placeholder="Search..." />
              <button>Search</button>
            </fieldset>
          </div>
        </div>
      </section>

      <section class={styles.section}>
        <h2>WebComponents</h2>
        <p>
          Oat ships <code>&lt;ot-tabs&gt;</code> and <code>&lt;ot-dropdown&gt;</code> as zero-config
          web components.
        </p>
        <div class="row">
          <div class="col-6">
            <ot-tabs>
              <div role="tablist">
                <button role="tab">Tab 1</button>
                <button role="tab">Tab 2</button>
              </div>
              <div role="tabpanel">
                <p>First panel content.</p>
              </div>
              <div role="tabpanel">
                <p>Second panel content.</p>
              </div>
            </ot-tabs>
          </div>
          <div class="col-6">
            <ot-dropdown>
              <button popovertarget="ref-menu" class="outline">
                Actions
              </button>
              <menu popover id="ref-menu">
                <button role="menuitem" onClick={() => alerts.info("Edit")}>
                  Edit
                </button>
                <button role="menuitem" onClick={() => alerts.info("Duplicate")}>
                  Duplicate
                </button>
                <hr />
                <button role="menuitem" onClick={() => alerts.warning("Deleted")}>
                  Delete
                </button>
              </menu>
            </ot-dropdown>
          </div>
        </div>
      </section>

      <section class={styles.section}>
        <h2>Layout Utilities</h2>
        <p>
          <code>.hstack</code>/<code>.vstack</code> for flex, <code>.gap-*</code> for spacing,{" "}
          <code>.row</code>/<code>.col-*</code> for grid. <code>.text-light</code> for muted text.
        </p>
        <div class={`hstack gap-2 ${styles.mb4}`}>
          <span class="badge">Default</span>
          <span class="badge" data-variant="success">
            Success
          </span>
          <span class="badge" data-variant="warning">
            Warning
          </span>
          <span class="badge" data-variant="danger">
            Danger
          </span>
          <span class="badge outline">Outline</span>
        </div>
        <div class="table">
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>.hstack</code>
                </td>
                <td>Horizontal flex with gap</td>
              </tr>
              <tr>
                <td>
                  <code>.vstack</code>
                </td>
                <td>Vertical flex with gap</td>
              </tr>
              <tr>
                <td>
                  <code>.gap-2</code>
                </td>
                <td>0.5rem gap</td>
              </tr>
              <tr>
                <td>
                  <code>.text-light</code>
                </td>
                <td>Muted text color</td>
              </tr>
              <tr>
                <td>
                  <code>.justify-center</code>
                </td>
                <td>Flex center justify</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
