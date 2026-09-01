import { NavLink } from 'react-router-dom';

const About = () => {
  return (
    <div className="page-container">
      <section className="about-hero">
        <h1 className="hero-title">Learn Anything. Your Way.</h1>
        <p className="hero-copy">
          Interactive AI Learning transforms any topic into an engaging learning experience designed around how you learn best.
        </p>
      </section>

      <section className="about-section">
        <h2>What is Interactive AI Learning?</h2>
        <p>
          It is an AI-powered learning platform that converts topics into interactive lessons. Instead of giving you a wall of text, the application chooses the best format for the content:
        </p>
        <div className="about-modes">
          {['Flashcards', 'Quiz', 'Timeline', 'Diagram', 'Visualization', 'Simulation'].map((mode) => (
            <span key={mode} className="about-mode-badge">{mode}</span>
          ))}
        </div>
        <p>
          The goal is simple: make learning more active, more visual, and more personal.
        </p>
      </section>

      <section className="about-section">
        <h2>Why this project exists</h2>
        <p>
          Traditional learning often presents information in the same format regardless of the topic or learner.
        </p>
        <p>
          This project explores a different approach: instead of asking learners to adapt to one format, let AI help adapt the learning experience to the topic.
        </p>
      </section>

      <section className="about-section">
        <h2>How it works</h2>
        <div className="about-steps">
          <div className="about-step">
            <span className="about-step-number">01</span>
            <h3>Choose a topic</h3>
            <p>Enter anything you want to learn, from React Hooks to TCP/IP.</p>
          </div>
          <div className="about-step">
            <span className="about-step-number">02</span>
            <h3>AI chooses an experience</h3>
            <p>The AI analyzes the topic and generates structured learning content in the most suitable format.</p>
          </div>
          <div className="about-step">
            <span className="about-step-number">03</span>
            <h3>Learn interactively</h3>
            <p>Review the lesson through flashcards, quizzes, timelines, diagrams, visualizations, or simulations.</p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Built by</h2>
        <div className="about-creator">
          <div>
            <h3>Roohul Amin</h3>
            <p className="about-creator-role">BSCS Student & AI/Software Developer</p>
            <p>
              I'm a computer science student interested in AI, software development, and building practical products that solve real problems.
            </p>
            <p>
              Interactive AI Learning started as an experiment in combining AI with better learning experiences. Instead of simply generating another block of text, I wanted to explore how AI could decide how information should be presented.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Technology</h2>
        <div className="about-tech">
          <div className="about-tech-group">
            <h4>Frontend</h4>
            <div className="about-tech-list">
              <span className="about-tech-badge">React</span>
              <span className="about-tech-badge">Vite</span>
              <span className="about-tech-badge">JavaScript</span>
              <span className="about-tech-badge">CSS</span>
            </div>
          </div>
          <div className="about-tech-group">
            <h4>Backend</h4>
            <div className="about-tech-list">
              <span className="about-tech-badge">Node.js</span>
              <span className="about-tech-badge">Express</span>
            </div>
          </div>
          <div className="about-tech-group">
            <h4>AI</h4>
            <div className="about-tech-list">
              <span className="about-tech-badge">OpenRouter</span>
              <span className="about-tech-badge">LLM API</span>
            </div>
          </div>
          <div className="about-tech-group">
            <h4>Database / Auth</h4>
            <div className="about-tech-list">
              <span className="about-tech-badge">Supabase</span>
              <span className="about-tech-badge">PostgreSQL</span>
              <span className="about-tech-badge">Supabase Auth</span>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>From idea to product</h2>
        <div className="about-timeline">
          {[
            'Designing the idea',
            'Building the AI backend',
            'Creating structured JSON responses',
            'Developing multiple interactive learning modes',
            'Connecting the frontend and backend',
            'Adding authentication',
            'Adding persistent learning history',
            'Adding XP and progress tracking',
            'Deploying the application',
            'Improving the product experience',
          ].map((item) => (
            <div key={item} className="about-timeline-item">
              <span className="about-timeline-dot" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section">
        <h2>Project status</h2>
        <p>Interactive AI Learning is currently deployed and available to try.</p>
        <div className="about-links">
          <a
            href="https://github.com/RoohulAmin-dev/gamification-with-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="about-link"
          >
            GitHub
          </a>
          <NavLink to="/" className="about-link">
            Live Application
          </NavLink>
        </div>
        <p className="about-note">
          LinkedIn link can be added here later.
        </p>
      </section>
    </div>
  );
};

export default About;
