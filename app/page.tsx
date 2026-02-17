import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.blob1}></div>
          <div className={styles.blob2}></div>
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.headline}>
              Master your mix with <span>STEMS.IO</span>
            </h1>
            <p className={styles.subhead}>
              The ultimate SaaS platform for producers and engineers to manage, share, and play stems with zero friction.
            </p>
            <div className={styles.heroActions}>
              <Link href="/new" className={styles.primaryBtnLarge}>Start for free</Link>
              <Link href="#demo" className={styles.secondaryBtnLarge}>Watch Demo</Link>
            </div>
            <div className={styles.socialProofSmall}>
              Join 10,000+ producers worldwide
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.illustrationPlaceholder}>
              <Image
                src="/images/hero-illustration.svg"
                alt="STEMS.IO Illustration"
                width={500}
                height={500}
                className={styles.vectorIcon}
                priority
              />
            </div>
          </div>
        </div>
      </header>

      {/* Social Proof Row */}
      <section className={styles.socialProof}>
        <div className={styles.sectionContent}>
          <p className={styles.trustedText}>Trusted by industry leaders</p>
          <div className={styles.logoGrid}>
            <div className={styles.logoPlaceholder}>PulseAudio</div>
            <div className={styles.logoPlaceholder}>BeatSync</div>
            <div className={styles.logoPlaceholder}>WaveForm</div>
            <div className={styles.logoPlaceholder}>SoundStack</div>
            <div className={styles.logoPlaceholder}>MixMaster</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>Built for modern production</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3>Smart Stem Management</h3>
              <p>Organize your tracks with intelligent tagging and automated cloud syncing.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.5 1.5" />
                </svg>
              </div>
              <h3>Real-time Collaboration</h3>
              <p>Share sessions with artists and get feedback instantly with time-stamped comments.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M10 8l6 4-6 4V8z" />
                </svg>
              </div>
              <h3>Integrated Web Player</h3>
              <p>Play multi-track stems directly in your browser with our high-fidelity Web Audio engine.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaContent}>
          <h2>Ready to elevate your workflow?</h2>
          <p>Join thousands of professionals who trust StemFlow with their music.</p>
          <Link href="/new" className={styles.primaryBtnLarge}>Get started for free</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <div className={styles.logoMark}></div>
              <span>STEMS.IO</span>
            </div>
            <p>&copy; 2025 STEMS.IO Inc. All rights reserved.</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.linkGroup}>
              <h4>Product</h4>
              <Link href="#features">Features</Link>
              <Link href="#pricing">Pricing</Link>
            </div>
            <div className={styles.linkGroup}>
              <h4>Company</h4>
              <Link href="#about">About</Link>
              <Link href="#contact">Contact</Link>
            </div>
            <div className={styles.linkGroup}>
              <h4>Legal</h4>
              <Link href="#privacy">Privacy</Link>
              <Link href="#terms">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
