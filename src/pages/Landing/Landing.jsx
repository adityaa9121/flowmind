import { useState, useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle2, Zap, Brain, Clock, Mail, FileText, MessageSquare, GitBranch, Sparkles, Send, Star, Users, BarChart3, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './Landing.module.css';
import { API_BASE_URL } from '../../config/api';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

const TypingText = ({ words }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = words[currentWordIndex];
    const speed = isDeleting ? 40 : 80;

    const timeout = setTimeout(() => {
      if (!isDeleting && displayText === word) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      } else {
        setDisplayText(isDeleting ? word.substring(0, displayText.length - 1) : word.substring(0, displayText.length + 1));
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentWordIndex, words]);

  return <span className={styles.typingText}>{displayText}<span className={styles.cursor}>|</span></span>;
};

const AnimatedCounter = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        let start = 0;
        const duration = 2000;
        const step = (timestamp) => {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

const Landing = () => {
  
  // Contact form
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactStatus, setContactStatus] = useState({ type: '', message: '' });

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    setContactStatus({ type: '', message: '' });
    try {
      const res = await fetch(`${API_BASE_URL}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject,
          description: contactForm.message,
          priority: 'Medium'
        })
      });
      if (!res.ok) throw new Error('Failed to send message');
      setContactStatus({ type: 'success', message: 'Message sent successfully! We\'ll get back to you soon.' });
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setContactStatus({ type: 'error', message: 'Failed to send message. Please try again or email us directly.' });
    } finally {
      setContactLoading(false);
      setTimeout(() => setContactStatus({ type: '', message: '' }), 5000);
    }
  };

  const features = [
    { icon: <Brain size={24} />, title: 'Smart Summaries', desc: 'Instantly summarize long documents, articles, and meeting notes with Gemini AI.' },
    { icon: <Zap size={24} />, title: 'Automated Tasks', desc: 'Turn notes into actionable tasks automatically and never miss a deadline.' },
    { icon: <Mail size={24} />, title: 'Email Generation', desc: 'Draft professional emails in seconds using simple AI prompts.' },
    { icon: <GitBranch size={24} />, title: 'Workflow Builder', desc: 'Design automation workflows with AI-powered triggers and actions.' },
    { icon: <FileText size={24} />, title: 'Document Analyzer', desc: 'Upload PDFs and documents for instant AI-powered analysis.' },
    { icon: <MessageSquare size={24} />, title: 'Luma Chat', desc: 'A powerful conversational AI to help you with any task.' },
  ];


  return (
    <div className={styles.landing}>
      {/* ====== HERO ====== */}
      <section id="hero" className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={`container ${styles.heroContainer}`}>
          <motion.div initial="hidden" animate="visible" variants={stagger} className={styles.heroContent}>
            <motion.div variants={fadeUp} className={styles.heroBadge}>
              <Sparkles size={14} className={styles.heroBadgeIcon} /> 
              <span>Meet Luma: Your Personal AI Assistant</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className={styles.heroTitle}>
              Work smarter with <br />
              <span className={styles.gradientText}>
                <TypingText words={['AI Automation', 'Smart Workflows', 'Document Analysis', 'Email Generation']} />
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} className={styles.heroSubtitle}>
              Your intelligent workspace that automates tasks, summarizes documents, and supercharges your productivity — powered by Google's Gemini AI.
            </motion.p>
            <motion.div variants={fadeUp} className={styles.heroActions}>
              <Link to="/signup">
                <button className={styles.primaryBtn}>
                  Get Started for Free <ArrowRight size={18} />
                </button>
              </Link>
              <button className={styles.secondaryBtn} onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                See How It Works
              </button>
            </motion.div>
            <motion.div variants={fadeUp} className={styles.heroStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}><AnimatedCounter target={10000} suffix="+" /></span>
                <span className={styles.statLabel}>Active Users</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNumber}><AnimatedCounter target={50000} suffix="+" /></span>
                <span className={styles.statLabel}>Tasks Completed</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNumber}>99.9%</span>
                <span className={styles.statLabel}>Uptime</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            className={styles.heroPreview}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className={styles.previewWindow}>
              <div className={styles.previewHeader}>
                <div className={styles.previewDots}>
                  <span style={{ background: '#ef4444' }} />
                  <span style={{ background: '#f59e0b' }} />
                  <span style={{ background: '#10b981' }} />
                </div>
                <div className={styles.previewUrl}>flowmind.ai/dashboard</div>
              </div>
              <div className={styles.previewBody}>
                <div className={styles.previewSidebar}>
                  <div className={styles.skelSm} />
                  <div className={styles.skelSm} />
                  <div className={styles.skelSmActive} />
                  <div className={styles.skelSm} />
                </div>
                <div className={styles.previewMain}>
                  <div className={styles.skelTitle} />
                  <div className={styles.skelCards}>
                    <div className={styles.skelCard} />
                    <div className={styles.skelCard} />
                    <div className={styles.skelCard} />
                  </div>
                  <div className={styles.skelBlock} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section id="features" className={styles.features}>
        <div className="container">
          <motion.div className={styles.sectionHeader} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeUp}>
            <span className={styles.sectionBadge}>Features</span>
            <h2 className={styles.sectionTitle}>Powerful AI Features</h2>
            <p className={styles.sectionSubtitle}>Everything you need to automate your daily workflows and boost productivity.</p>
          </motion.div>
          <motion.div className={styles.featureGrid} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger}>
            {features.map((feature, i) => (
              <motion.div key={i} variants={fadeUp} className={styles.featureCard} whileHover={{ y: -6 }}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== ABOUT ====== */}
      <section id="about" className={styles.about}>
        <div className="container">
          <motion.div className={styles.aboutGrid} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}>
            <motion.div variants={fadeUp} className={styles.aboutContent}>
              <span className={styles.sectionBadge}>About</span>
              <h2 className={styles.sectionTitle}>Why choose FlowMind AI?</h2>
              <p className={styles.aboutDesc}>FlowMind is built for professionals who want to spend less time on repetitive work and more time on what matters.</p>
              <ul className={styles.benefitsList}>
                <li><CheckCircle2 size={20} className={styles.checkIcon} /> <span>Save up to 10 hours a week on repetitive tasks.</span></li>
                <li><CheckCircle2 size={20} className={styles.checkIcon} /> <span>Organize your workspace with intuitive design.</span></li>
                <li><CheckCircle2 size={20} className={styles.checkIcon} /> <span>Powered by Google's cutting-edge Gemini AI.</span></li>
                <li><Shield size={20} className={styles.checkIcon} /> <span>Enterprise-grade security and data privacy.</span></li>
              </ul>
            </motion.div>
            <motion.div variants={fadeUp} className={styles.aboutVisual}>
              <div className={styles.abstractShape} />
              <div className={styles.floatingCard} style={{ top: '10%', right: '5%' }}>
                <Users size={20} /> <span>10,000+ Users</span>
              </div>
              <div className={styles.floatingCard} style={{ bottom: '15%', left: '0%' }}>
                <Star size={20} /> <span>4.9 Rating</span>
              </div>
              <div className={styles.floatingCard} style={{ top: '55%', right: '-5%' }}>
                <BarChart3 size={20} /> <span>99.9% Uptime</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* ====== CONTACT ====== */}
      <section id="contact" className={styles.contact}>
        <div className="container">
          <motion.div className={styles.sectionHeader} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeUp}>
            <span className={styles.sectionBadge}>Contact</span>
            <h2 className={styles.sectionTitle}>Get in touch</h2>
            <p className={styles.sectionSubtitle}>Have a question or need help? We'd love to hear from you.</p>
          </motion.div>
          <motion.div className={styles.contactGrid} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger}>
            {/* Contact Form */}
            <motion.form variants={fadeUp} className={styles.contactForm} onSubmit={handleContactSubmit}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Name</label>
                  <input type="text" required placeholder="Your name" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input type="email" required placeholder="you@example.com" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Subject</label>
                <input type="text" required placeholder="How can we help?" value={contactForm.subject} onChange={e => setContactForm({...contactForm, subject: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Message</label>
                <textarea required placeholder="Tell us more..." rows={5} value={contactForm.message} onChange={e => setContactForm({...contactForm, message: e.target.value})} />
              </div>
              {contactStatus.message && (
                <div className={`${styles.formAlert} ${contactStatus.type === 'error' ? styles.alertError : styles.alertSuccess}`}>
                  {contactStatus.message}
                </div>
              )}
              <button type="submit" className={styles.primaryBtn} disabled={contactLoading} style={{ width: '100%' }}>
                {contactLoading ? 'Sending...' : <><Send size={18} /> Send Message</>}
              </button>
            </motion.form>

            {/* Contact Info */}
            <motion.div variants={fadeUp} className={styles.contactInfo}>
              <div className={styles.contactInfoCard}>
                <div className={styles.contactInfoIcon}><Mail size={22} /></div>
                <div>
                  <h4>Email Us</h4>
                  <a href="mailto:support@flowmind.ai">support@flowmind.ai</a>
                </div>
              </div>
              <div className={styles.contactInfoCard}>
                <div className={styles.contactInfoIcon}><Clock size={22} /></div>
                <div>
                  <h4>Response Time</h4>
                  <p>We typically respond within 24 hours</p>
                </div>
              </div>
              <div className={styles.contactInfoCard}>
                <div className={styles.contactInfoIcon}><MessageSquare size={22} /></div>
                <div>
                  <h4>Live Chat</h4>
                  <p>Available Mon–Fri, 9am–6pm IST</p>
                </div>
              </div>
              <div className={styles.contactHighlight}>
                <Sparkles size={20} className={styles.contactHighlightIcon} />
                <p>Need help getting started? Our onboarding team is happy to walk you through FlowMind.</p>
                <Link to="/signup" className={styles.primaryBtn} style={{ marginTop: '1rem', display: 'inline-flex' }}>
                  Get Started Free <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className={styles.cta}>
        <div className={styles.ctaGlow} />
        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className={styles.ctaTitle}>Ready to transform your workflow?</motion.h2>
            <motion.p variants={fadeUp} className={styles.ctaSubtitle}>Join thousands of professionals already using FlowMind AI.</motion.p>
            <motion.div variants={fadeUp}>
              <Link to="/signup">
                <button className={styles.primaryBtn} style={{ fontSize: '1.05rem', padding: '0.875rem 2rem' }}>
                  Create Your Free Account <ArrowRight size={18} />
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
